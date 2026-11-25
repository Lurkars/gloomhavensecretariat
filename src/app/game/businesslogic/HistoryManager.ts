import { gameManager, labelManager, settingsManager, storageManager } from 'src/app/game/businesslogic/Managers';
import { Game, GameModel } from 'src/app/game/model/Game';
import { effectiveRevision, LogEntry, LogEntryType } from 'src/app/game/model/LogEntry';

export type HistoryInfo = {
  undo: (LogEntry | undefined)[];
  redo: (LogEntry | undefined)[];
  // log entries linked to an undo/redo snapshot, with the undos index or redo index (0 = next redo)
  links: Map<LogEntry, { type: 'undo' | 'redo'; index: number }>;
  // update entries which were undone and never redone
  undone: Set<LogEntry>;
};

export class HistoryManager {
  game: Game;
  log: LogEntry[] = [];
  historyVersion: number = 0;
  historyCache: { key: string; history: HistoryInfo } | undefined;

  constructor(game: Game) {
    this.game = game;
  }

  /** migration: undo infos (one per undo/redo snapshot) are replaced by the log */
  async migrateUndoInfos() {
    const undoInfos = await gameManager.stateManager.readArray<string[]>('undo-infos');
    if (!undoInfos.length) {
      return;
    }
    try {
      if (!this.log.length) {
        this.log = HistoryManager.undoInfosToLog(undoInfos, gameManager.stateManager.undos, gameManager.stateManager.redos, this.game);
        this.historyVersion++;
        await storageManager.writeArray('log', this.log);
      }
      await storageManager.clear('undo-infos');
    } catch (error) {
      console.error('Failed to migrate undo infos to log:', error);
    }
  }

  /**
   * Convert the former undo infos into log entries.
   * Layout of the undo infos: one per undo snapshot (oldest first), followed by one per redo snapshot (next redo first).
   * Missing infos were padded at the front, they become entries without info to keep the snapshots linked.
   */
  static undoInfosToLog(
    undoInfos: string[][],
    undos: GameModel[],
    redos: GameModel[],
    game: { revision: number; revisionOffset: number }
  ): LogEntry[] {
    const length = undos.length + redos.length;
    const infos: (string[] | undefined)[] =
      undoInfos.length >= length ? undoInfos.slice(undoInfos.length - length) : [...new Array(length - undoInfos.length), ...undoInfos];
    const log: LogEntry[] = [];
    infos.forEach((info, index) => {
      if (!info || !Array.isArray(info)) {
        info = [];
      }
      let revision: number;
      if (index < undos.length) {
        revision = effectiveRevision(undos[index]);
      } else {
        const redo = index - undos.length;
        revision = redo === 0 ? effectiveRevision(game) : effectiveRevision(redos[redos.length - redo]);
      }
      log.push(
        new LogEntry(
          'update',
          revision,
          info.map((value) => '' + value),
          0,
          undefined,
          undefined,
          info[0] === 'serverSync'
        )
      );
    });
    return log;
  }

  createLog(
    type: LogEntryType,
    info: string[],
    server: boolean = false,
    target: number | undefined = undefined,
    length: number | undefined = undefined
  ): LogEntry {
    return new LogEntry(
      type,
      effectiveRevision(this.game),
      info,
      Date.now(),
      this.game.party ? this.game.party.id : undefined,
      this.game.edition,
      server,
      target,
      length
    );
  }

  addLog(entry: LogEntry) {
    // -1: unlimited
    const maxLog = settingsManager.settings.maxLog ?? 1000;
    this.historyVersion++;
    if (maxLog === 0) {
      if (this.log.length) {
        this.log = [];
        storageManager.clear('log').catch((error) => console.error('Failed to clear log:', error));
      }
      return;
    }
    this.log.push(entry);
    storageManager.append('log', entry, this.log).catch((error) => console.error('Failed to save log:', error));
    if (maxLog > 0 && this.log.length > maxLog) {
      // never drop entries describing an existing undo/redo snapshot
      const links = this.history().links;
      const linked = this.log.findIndex((logEntry) => links.has(logEntry));
      const remove = Math.min(this.log.length - maxLog, linked === -1 ? this.log.length : linked);
      if (remove > 0) {
        this.log.splice(0, remove);
        this.historyVersion++;
        storageManager.trim('log', this.log.length, this.log).catch((error) => console.error('Failed to trim log:', error));
      }
    }
  }

  /** log an undo/redo received from the server, must be called before the game state gets applied */
  addServerLog(type: 'undo' | 'redo', gameModel: GameModel, message: any) {
    const undoinfo: string[] | undefined = Array.isArray(message.undoinfo) ? message.undoinfo.map((value: any) => '' + value) : undefined;
    const info = undoinfo ? (undoinfo[0] === 'serverSync' ? undoinfo : ['serverSync', ...undoinfo]) : ['serverSync'];
    this.addLog(this.createLog(type, info, true, effectiveRevision(gameModel), message.undolength || 1));
  }

  /** log entries describing the undo/redo snapshots, cached until the history changes */
  history(): HistoryInfo {
    const key = [
      this.historyVersion,
      gameManager.stateManager.undos.length,
      gameManager.stateManager.redos.length,
      this.log.length,
      this.game.revision,
      this.game.revisionOffset
    ].join('|');
    if (!this.historyCache || this.historyCache.key !== key) {
      this.historyCache = { key, history: this.buildHistory() };
    }
    return this.historyCache.history;
  }

  /**
   * Link the log to the undo/redo snapshots by effective revision.
   * The entry of a change from state `a` to state `b` is the latest `update` entry with a revision in [a, b) (or exactly `a`, if b <= a).
   * Searching the undos downwards only before already matched entries (and the redos upwards only after them) keeps entries of an
   * earlier game (e.g. another server game with overlapping revisions) from being linked to newer snapshots.
   */
  private buildHistory(): HistoryInfo {
    const history: HistoryInfo = {
      undo: new Array(gameManager.stateManager.undos.length),
      redo: new Array(gameManager.stateManager.redos.length),
      links: new Map(),
      undone: this.undoneEntries()
    };
    const find = (from: number, to: number, maxIndex: number, minIndex: number): number => {
      for (let index = maxIndex; index >= minIndex; index--) {
        const entry = this.log[index];
        if (entry && entry.type === 'update' && (to > from ? entry.revision >= from && entry.revision < to : entry.revision === from)) {
          return index;
        }
      }
      return -1;
    };

    let maxIndex = this.log.length - 1;
    let minIndex = -1;
    let next = effectiveRevision(this.game);
    for (let i = gameManager.stateManager.undos.length - 1; i >= 0; i--) {
      const revision = effectiveRevision(gameManager.stateManager.undos[i]);
      const index = find(revision, next, maxIndex, 0);
      if (index !== -1) {
        history.undo[i] = this.log[index];
        history.links.set(this.log[index], { type: 'undo', index: i });
        maxIndex = index - 1;
        if (minIndex === -1) {
          minIndex = index;
        }
      }
      next = revision;
    }

    let previous = effectiveRevision(this.game);
    for (let i = 0; i < gameManager.stateManager.redos.length; i++) {
      const revision = effectiveRevision(gameManager.stateManager.redos[gameManager.stateManager.redos.length - 1 - i]);
      const index = find(previous, revision, this.log.length - 1, minIndex + 1);
      if (index !== -1) {
        history.redo[i] = this.log[index];
        history.links.set(this.log[index], { type: 'redo', index: i });
        minIndex = index;
      }
      previous = revision;
    }
    return history;
  }

  /**
   * Replay the log to find the update entries which were undone and never redone,
   * including undone changes which got discarded by a later change (and therefore have no redo snapshot anymore).
   */
  private undoneEntries(): Set<LogEntry> {
    const applied: LogEntry[] = [];
    // last element is the next to redo
    const undone: LogEntry[] = [];
    const result = new Set<LogEntry>();
    this.log.forEach((entry) => {
      if (entry.type === 'update') {
        // changes on an earlier revision replace later ones (e.g. an older game got loaded)
        while (applied.length && applied[applied.length - 1].revision >= entry.revision) {
          applied.pop();
        }
        undone.length = 0;
        applied.push(entry);
      } else if (entry.type === 'undo') {
        const target = entry.target ?? entry.revision - (entry.length || 1);
        while (applied.length && applied[applied.length - 1].revision >= target) {
          const undoneEntry = applied.pop()!;
          undone.push(undoneEntry);
          result.add(undoneEntry);
        }
      } else if (entry.type === 'redo') {
        const target = entry.target ?? entry.revision + (entry.length || 1);
        while (undone.length && undone[undone.length - 1].revision < target) {
          const redoneEntry = undone.pop()!;
          applied.push(redoneEntry);
          result.delete(redoneEntry);
        }
      }
    });
    return result;
  }

  /** info of the undo snapshot at the given undos index */
  undoInfo(index: number, hideInitiative: boolean = true): string[] {
    return this.displayInfo(this.history().undo[index], hideInitiative);
  }

  /** info of the redo snapshot at the given redo index (0 = next redo) */
  redoInfo(index: number, hideInitiative: boolean = true): string[] {
    return this.displayInfo(this.history().redo[index], hideInitiative);
  }

  /** label key and arguments of a log entry, server infos get resolved into a single argument */
  displayInfo(entry: LogEntry | undefined, hideInitiative: boolean = true): string[] {
    const info = entry && entry.info;
    if (!info || !info.length) {
      return [];
    }
    if (info.length > 1 && info[0] === 'serverSync') {
      if (hideInitiative && info[1] === 'setInitiative' && info.length > 3) {
        return ['serverSync', labelManager.getLabel('state.info.' + info[1], [info[2], ''])];
      }
      return ['serverSync', labelManager.getLabel('state.info.' + info[1], info.slice(2))];
    } else if (info.length === 1 && info[0] === 'serverSync') {
      return ['serverSync', ''];
    }
    return info;
  }

  /** clear the log, except entries describing an existing undo/redo snapshot */
  clearLog() {
    const links = this.history().links;
    this.log = this.log.filter((entry) => links.has(entry));
    this.historyVersion++;
    storageManager.writeArray('log', this.log).catch((error) => console.error('Failed to clear log:', error));
  }
}
