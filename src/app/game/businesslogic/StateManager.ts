import { gameManager, settingsManager, storageManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { Game, GameModel } from 'src/app/game/model/Game';
import { effectiveRevision, LogEntry } from 'src/app/game/model/LogEntry';
import { Monster } from 'src/app/game/model/Monster';
import { Permissions } from 'src/app/game/model/Permissions';
import { downloadJson } from 'src/app/ui/helper/Static';

/** log entries describing the undo/redo snapshots, `undo` aligned with `undos`, `redo[0]` describes the next redo (last of `redos`) */

export class StateManager {
  game: Game;
  permissions: Permissions | undefined;

  undos: GameModel[] = [];
  redos: GameModel[] = [];

  lastSaveTimestamp: number;

  hasUpdate: boolean = false;
  installPrompt: any = null;

  lastAction: 'update' | 'undo' | 'redo' | 'automatic' = 'update';
  private undoRevert: { redos: GameModel[]; trimmed: GameModel[] } | undefined;
  updateBlocked: boolean = false;
  errorLog: any[] = [];
  backupError: number | undefined;
  gameOffsetWarning: boolean = true;
  standeeDialogCanceled: boolean = false;
  keyboardSelecting: 's' | 'w' | false = false;
  keyboardSelect: number = -1;

  undoPermission: boolean = false;
  redoPermission: boolean = false;
  characterPermissions: Record<string, boolean> = {};
  monsterPermissions: Record<string, boolean> = {};

  wakeLock: any = null;
  scenarioSummary: boolean = false;

  storageBlocked: boolean = false;
  missingEditions: string[] = [];
  private missingEditionsModel: GameModel | undefined;
  private storageSaving: boolean = false;
  private storagePending: boolean = false;
  autoBackupTimeout: any = null;

  ready: boolean = false;

  constructor(game: Game) {
    this.game = game;
    this.lastSaveTimestamp = new Date().getTime();
  }

  async init(tool: boolean = false) {
    try {
      const gameModel = await storageManager.readGameModel();
      gameModel.server = false;
      this.missingEditions = tool ? [] : this.missingEditionData(gameModel);
      if (this.missingEditions.length) {
        this.missingEditionsModel = gameModel;
      } else {
        this.game.fromModel(gameModel);
      }
    } catch {
      if (!tool) {
        storageManager.writeGameModel(this.game.toModel());
      }
    }

    this.updateBlocked = false;
    gameManager.randomManager.previewOutsideChanges = !tool;

    if (!this.missingEditions.length) {
      gameManager.serverSyncManager.initServer();
    }

    await this.loadStorage();
    await gameManager.historyManager.migrateUndoInfos();

    this.ready = true;
    gameManager.triggerUiChange(false);
  }

  // editions used by the stored game whose data failed to load, loading it would drop everything depending on that data
  missingEditionData(model: GameModel): string[] {
    if (!gameManager.editionManager.failedEditionDataUrls.length) {
      return [];
    }
    const editions = [
      model.edition,
      ...(model.characters || []).map((character) => character.edition),
      ...(model.monsters || []).map((monster) => monster.edition),
      model.scenario?.edition,
      ...(model.sections || []).map((section) => section.edition)
    ];
    return editions.filter(
      (edition, index): edition is string =>
        !!edition &&
        editions.indexOf(edition) === index &&
        !gameManager.editionManager.editionData.some((editionData) => editionData.edition === edition)
    );
  }

  loadWithMissingEditions() {
    const model = this.missingEditionsModel;
    if (!model) {
      return;
    }
    this.missingEditions = [];
    this.missingEditionsModel = undefined;
    this.game.fromModel(model);
    this.updatePermissions();
    gameManager.serverSyncManager.initServer();
    gameManager.triggerUiChange(false);
  }

  async install() {
    if (this.installPrompt) {
      this.installPrompt.prompt();
      await gameManager.stateManager.installPrompt.userChoice;
      this.installPrompt = null;
    }
  }

  async loadStorage() {
    this.undos = await this.readArray<GameModel>('undo');
    this.redos = await this.readArray<GameModel>('redo');
    gameManager.historyManager.log = await this.readArray<LogEntry>('log');
    gameManager.historyManager.historyVersion++;
    this.updatePermissions();
  }

  async readArray<T>(store: string): Promise<T[]> {
    try {
      return (await storageManager.readAll<T>(store)) || [];
    } catch {
      return [];
    }
  }

  async saveStorage() {
    if (this.storageBlocked || this.missingEditions.length) {
      return;
    }
    if (this.storageSaving) {
      // the running save writes the latest state again
      this.storagePending = true;
      return;
    }
    this.storageSaving = true;
    try {
      do {
        this.storagePending = false;
        await storageManager.writeArray('undo', this.undos);
        if (this.storageBlocked) {
          break;
        }
        await storageManager.writeArray('redo', this.redos);
      } while (this.storagePending && !this.storageBlocked);
    } catch (error) {
      console.error('Failed to save undo/redo storage:', error);
      throw error;
    } finally {
      this.storagePending = false;
      this.storageSaving = false;
    }
  }

  forceUpdateState() {
    gameManager.stateManager.updateBlocked = false;
    gameManager.stateManager.permissions = gameManager.serverSyncManager.permissionBackup;
    gameManager.stateManager.updatePermissions();
    gameManager.triggerUiChange(false);
  }

  reset() {
    storageManager.addBackup(this.game.toModel());
    const revision = this.game.revision;
    // reset in place, all managers share this game instance
    Object.assign(this.game, new Game());
    this.game.revision = revision;
    storageManager.clear('game');
    storageManager.clear('undo');
    storageManager.clear('redo');
    storageManager.clear('undo-infos');
    storageManager.clear('log');
    this.undos = [];
    this.redos = [];
    gameManager.historyManager.log = [];
    gameManager.historyManager.historyVersion++;
  }

  saveLocal() {
    if (this.missingEditions.length) {
      return;
    }
    storageManager.writeGameModel(this.game.toModel());
    this.lastSaveTimestamp = new Date().getTime();
  }

  saveSettings() {
    if (
      gameManager.serverSyncManager.ws &&
      gameManager.serverSyncManager.ws.readyState === WebSocket.OPEN &&
      settingsManager.settings.serverCode &&
      settingsManager.settings.serverSettings
    ) {
      const message = {
        code: settingsManager.settings.serverCode,
        password: settingsManager.settings.serverCode, // migration
        type: 'settings',
        payload: settingsManager.settings
      };
      if (settingsManager.settings.logServerMessages) console.debug('WS sending settings');
      gameManager.serverSyncManager.ws.send(JSON.stringify(message));
    }
  }

  updatePermissions() {
    this.undoPermission = this.hasUndo() && (!this.permissions || !this.updateBlocked) && !this.missingEditions.length;
    this.redoPermission = this.hasRedo() && (!this.permissions || !this.updateBlocked) && !this.missingEditions.length;
    this.characterPermissions = {};

    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        this.characterPermissions[figure.name + '|' + figure.edition] =
          !this.permissions ||
          (this.permissions &&
            (this.permissions.characters ||
              this.permissions.character.some((value) => value.name === figure.name && value.edition === figure.edition)));
      }
    });

    if (this.game.party.retirements) {
      this.game.party.retirements.forEach((model) => {
        this.characterPermissions[model.name + '|' + model.edition] =
          !this.permissions ||
          (this.permissions &&
            (this.permissions.characters ||
              this.permissions.character.some((value) => value.name === model.name && value.edition === model.edition)));
      });
    }

    this.monsterPermissions = {};
    this.game.figures.forEach((figure) => {
      if (figure instanceof Monster) {
        this.monsterPermissions[figure.name + '|' + figure.edition] =
          !this.permissions ||
          (this.permissions &&
            (this.permissions.monsters ||
              this.permissions.monster.some((value) => value.name === figure.name && value.edition === figure.edition)));
      }
    });
  }

  before(...info: (string | number | boolean)[]) {
    window.document.body.classList.add('working');
    this.addToUndo((info && info.map((value) => '' + value)) || []);
    gameManager.randomManager.beginChange();
  }

  /**
   * Start an automatic change done in background (e.g. auto. clock out), must be finished with `afterAutomatic()`.
   * No undo snapshot is created, so the redo history is kept. The change only gets logged.
   */
  beforeAutomatic(...info: (string | number | boolean)[]) {
    window.document.body.classList.add('working');
    gameManager.historyManager.addLog(gameManager.historyManager.createLog('automatic', (info && info.map((value) => '' + value)) || []));
    gameManager.randomManager.beginChange();
  }

  /** finish an automatic change: persist and sync it, without changing the effective revision (undo/redo position) */
  async afterAutomatic(timeout: number = 1) {
    this.game.revisionOffset += 1;
    const after = this.after(timeout);
    this.lastAction = 'automatic';
    await after;
  }

  async after(
    timeout: number = 1,
    autoBackup: boolean = false,
    revisionChange: number = 1,
    type: string = 'game',
    revision: number = 0,
    undolength: number = 1
  ) {
    gameManager.randomManager.endChange();
    this.undoRevert = undefined;
    // set synchronously, a server error for this message must be able to revert it in the right direction
    this.lastAction = type === 'game-undo' ? 'undo' : type === 'game-redo' ? 'redo' : 'update';
    this.game.revision += revisionChange;
    this.saveLocal();
    if (
      gameManager.serverSyncManager.ws &&
      gameManager.serverSyncManager.ws.readyState === WebSocket.OPEN &&
      settingsManager.settings.serverCode
    ) {
      window.document.body.classList.add('server-sync');
      const lastEntry: LogEntry | undefined = gameManager.historyManager.log[gameManager.historyManager.log.length - 1];
      let undoInfo: string[] | undefined;
      if (
        lastEntry &&
        ((type === 'game' && lastEntry.type === 'update') ||
          (type === 'game-undo' && lastEntry.type === 'undo') ||
          (type === 'game-redo' && lastEntry.type === 'redo'))
      ) {
        undoInfo = lastEntry.info;
      }

      const message = {
        code: settingsManager.settings.serverCode,
        password: settingsManager.settings.serverCode, // migration
        type: type,
        payload: this.game.toModel(),
        undoinfo: undoInfo,
        revision: revision,
        undolength: undolength
      };
      if (settingsManager.settings.logServerMessages) console.debug('WS sending ' + type);
      gameManager.serverSyncManager.ws.send(JSON.stringify(message));
    }

    if (
      autoBackup ||
      (settingsManager.settings.autoBackup > 0 &&
        (this.game.revision + this.game.revisionOffset) % settingsManager.settings.autoBackup === 0)
    ) {
      await this.autoBackup();
    }

    if (timeout && settingsManager.settings.animations) {
      setTimeout(() => {
        gameManager.triggerUiChange(false);
        window.document.body.classList.remove('working');
        window.document.body.classList.remove('server-sync');
      }, timeout * settingsManager.settings.animationSpeed);
    } else {
      gameManager.triggerUiChange(false);
      window.document.body.classList.remove('working');
      window.document.body.classList.remove('server-sync');
    }
  }

  async autoBackup(filename: string = '', forceDownload: boolean = false) {
    if (this.autoBackupTimeout) {
      return;
    }

    if (this.storageBlocked || this.storageSaving) {
      this.autoBackupTimeout = setTimeout(() => {
        this.autoBackupTimeout = null;
        this.autoBackup();
      }, 100);
    } else {
      window.document.body.classList.add('working');
      window.document.body.classList.add('server-sync');
      try {
        const datadump: any = await storageManager.datadump();
        if (!filename) {
          filename = 'ghs-autobackup-' + new Date().toISOString() + '.json';
        }

        if (!forceDownload && settingsManager.settings.autoBackupUrl && settingsManager.settings.autoBackupUrl.url) {
          try {
            this.backupError = undefined;
            const xhr = new XMLHttpRequest();
            let url = settingsManager.settings.autoBackupUrl.url;
            url = url.replaceAll('{FILENAME}', filename);
            const windowsFilename = filename.replace(/[\\/:*?"<>|]/g, '_');
            url = url.replaceAll('{WINDOWS_FILENAME}', windowsFilename);
            xhr.open(
              settingsManager.settings.autoBackupUrl.method,
              url,
              true,
              settingsManager.settings.autoBackupUrl.username,
              settingsManager.settings.autoBackupUrl.password
            );

            let data: string | FormData = JSON.stringify(datadump);
            if (settingsManager.settings.autoBackupUrl.fileUpload) {
              data = new FormData();
              data.append(filename, new File([JSON.stringify(datadump)], filename, { type: 'application/json' }));
            } else {
              xhr.setRequestHeader('Content-Type', 'application/json');
            }

            if (settingsManager.settings.autoBackupUrl.authorization) {
              xhr.setRequestHeader('Authorization', settingsManager.settings.autoBackupUrl.authorization);
            }

            xhr.send(data);

            xhr.addEventListener('error', (event) => {
              this.backupError = -1;
              console.warn('Could not post autobackup', settingsManager.settings.autoBackupUrl, event);
            });

            xhr.addEventListener('readystatechange', () => {
              if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status >= 400) {
                  this.backupError = xhr.status;
                  console.warn('Could not post autobackup', settingsManager.settings.autoBackupUrl, xhr.status, xhr.responseText);
                }
              }
            });
          } catch (error) {
            this.backupError = -1;
            console.warn('Could not post autobackup', settingsManager.settings.autoBackupUrl, error);
          }
        } else {
          downloadJson(datadump, filename);
        }
      } catch {
        console.warn('Could not create autobackup');
      }
      window.document.body.classList.remove('working');
      window.document.body.classList.remove('server-sync');
    }
  }

  addToUndo(info: string[]) {
    this.undos.push(this.game.toModel());
    const maxUndos = storageManager.db ? settingsManager.settings.maxUndo : Math.min(settingsManager.settings.maxUndo, 50);
    const trimmed = this.undos.length > maxUndos ? this.undos.splice(0, this.undos.length - maxUndos) : [];
    this.undoRevert = { redos: this.redos, trimmed: trimmed };

    if (this.redos.length > 5) {
      storageManager.addBackup(this.redos[0]);
    }

    this.redos = [];

    // the snapshot has the effective revision of the current game, which links the entry to it
    gameManager.historyManager.addLog(gameManager.historyManager.createLog('update', info, info.length > 0 && info[0] === 'serverSync'));

    this.saveStorage();
  }

  revertLastUndo() {
    gameManager.randomManager.endChange();
    const snapshot = this.undos.splice(this.undos.length - 1, 1)[0];
    if (this.undoRevert) {
      this.undos.unshift(...this.undoRevert.trimmed);
      this.redos = this.undoRevert.redos;
      this.undoRevert = undefined;
    }
    if (snapshot) {
      const revision = this.game.revision;
      const revisionOffset = this.game.revisionOffset;
      this.game.fromModel(snapshot);
      this.game.revision = revision;
      this.game.revisionOffset = revisionOffset;
    }
    const lastEntry = gameManager.historyManager.log[gameManager.historyManager.log.length - 1];
    if (lastEntry && lastEntry.type === 'update') {
      gameManager.historyManager.log.pop();
      storageManager.removeLast('log', gameManager.historyManager.log).catch((error) => console.error('Failed to save log:', error));
    }
    gameManager.historyManager.historyVersion++;
    window.document.body.classList.remove('working');
    window.document.body.classList.remove('server-sync');
    this.saveStorage();
    gameManager.triggerUiChange(false);
  }

  hasUndo(): boolean {
    return this.undos.length > 0;
  }

  undo(sync: boolean = true) {
    this.fixedUndo(1, sync);
  }

  fixedUndo(undolength: number, sync: boolean = true) {
    if (undolength > 0 && undolength <= this.undos.length && !this.missingEditions.length) {
      window.document.body.classList.add('working');
      const entry = gameManager.historyManager.history().undo[this.undos.length - 1];
      gameManager.historyManager.addLog(
        gameManager.historyManager.createLog(
          'undo',
          entry ? entry.info : [],
          false,
          effectiveRevision(this.undos[this.undos.length - undolength]),
          undolength
        )
      );
      this.redos.push(this.game.toModel());
      const revision = this.game.revision;
      const revisionOffset = this.game.revisionOffset + undolength - 1;
      const undos = this.undos.splice(this.undos.length - undolength, undolength);
      for (let i = undos.length - 1; i > 0; i--) {
        this.redos.push(undos[i]);
      }
      const gameModel: GameModel = undos[0];
      this.game.fromModel(gameModel);
      this.game.revision = revision;
      // after() increases the revision by one when syncing
      this.game.revisionOffset = revisionOffset + (sync ? 2 : 1);
      this.saveStorage();
      if (sync) {
        this.after(1, false, 1, 'game-undo', undos[0].revision - (undos[0].revisionOffset || 0), undolength);
      } else {
        this.saveLocal();
        gameManager.triggerUiChange(false);
      }
      this.lastAction = 'undo';
    }
  }

  hasRedo(): boolean {
    return this.redos.length > 0;
  }

  redo(sync: boolean = true) {
    this.fixedRedo(1, sync);
  }

  fixedRedo(redolength: number, sync: boolean = true) {
    if (redolength > 0 && redolength <= this.redos.length && !this.missingEditions.length) {
      window.document.body.classList.add('working');
      const entry = gameManager.historyManager.history().redo[redolength - 1];
      gameManager.historyManager.addLog(
        gameManager.historyManager.createLog(
          'redo',
          entry ? entry.info : [],
          false,
          effectiveRevision(this.redos[this.redos.length - redolength]),
          redolength
        )
      );
      this.undos.push(this.game.toModel());
      const revision = this.game.revision;
      const revisionOffset = this.game.revisionOffset - redolength + 1;
      const redos = this.redos.splice(this.redos.length - redolength, redolength);
      for (let i = redos.length - 1; i > 0; i--) {
        this.undos.push(redos[i]);
      }
      const gameModel: GameModel = redos[0];
      this.game.fromModel(gameModel);
      this.game.revision = revision;
      // after() increases the revision by one when syncing
      this.game.revisionOffset = revisionOffset - (sync ? 0 : 1);
      this.saveStorage();
      if (sync) {
        this.after(1, false, 1, 'game-redo', redos[0].revision - (redos[0].revisionOffset || 0), redolength);
      } else {
        this.saveLocal();
        gameManager.triggerUiChange(false);
      }
      this.lastAction = 'redo';
    }
  }

  clearUndos() {
    this.undos = [];
    gameManager.historyManager.historyVersion++;
    this.saveStorage();
  }

  clearRedos() {
    this.redos = [];
    gameManager.historyManager.historyVersion++;
    this.saveStorage();
  }

  savePermissions(code: string, permissions: Permissions | undefined) {
    if (
      gameManager.serverSyncManager.ws &&
      gameManager.serverSyncManager.ws.readyState === WebSocket.OPEN &&
      settingsManager.settings.serverCode
    ) {
      const message = {
        code: settingsManager.settings.serverCode,
        password: settingsManager.settings.serverCode, // migration
        type: 'permissions',
        payload: {
          permissions: permissions,
          code: code,
          password: code // migration
        }
      };
      if (settingsManager.settings.logServerMessages) console.debug(`WS sending permissions`);
      gameManager.serverSyncManager.ws.send(JSON.stringify(message));
    }
  }
}
