import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { storageManager } from 'src/app/game/businesslogic/StorageManager';
import { commandManager } from 'src/app/game/commands/CommandManager';
import { Character } from 'src/app/game/model/Character';
import { Game, GameModel } from 'src/app/game/model/Game';
import { effectiveRevision, LogEntry, LogEntryType } from 'src/app/game/model/LogEntry';
import { Monster } from 'src/app/game/model/Monster';
import { Permissions } from 'src/app/game/model/Permissions';
import { localSettings, Settings } from 'src/app/game/model/Settings';
import { downloadJson } from 'src/app/ui/helper/Static';

/** log entries describing the undo/redo snapshots, `undo` aligned with `undos`, `redo[0]` describes the next redo (last of `redos`) */
export type HistoryInfo = {
  undo: (LogEntry | undefined)[];
  redo: (LogEntry | undefined)[];
  // log entries linked to an undo/redo snapshot, with the undos index or redo index (0 = next redo)
  links: Map<LogEntry, { type: 'undo' | 'redo'; index: number }>;
  // update entries which were undone and never redone
  undone: Set<LogEntry>;
};

export class StateManager {
  game: Game;
  permissions: Permissions | undefined;
  ws: WebSocket | undefined;

  undos: GameModel[] = [];
  redos: GameModel[] = [];
  log: LogEntry[] = [];
  private historyVersion: number = 0;
  private historyCache: { key: string; history: HistoryInfo } | undefined;

  lastSaveTimestamp: number;

  hasUpdate: boolean = false;
  installPrompt: any = null;

  lastAction: 'update' | 'undo' | 'redo' = 'update';
  updateBlocked: boolean = false;
  serverError: string = '';
  errorLog: any[] = [];
  backupError: number | undefined;
  permissionBackup: Permissions | undefined;
  connectionTries: number = 0;
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
  serverVersion: string = '';

  storageBlocked: boolean = false;
  autoBackupTimeout: any = null;

  ready: boolean = false;

  automaticTheme: boolean = true;

  constructor(game: Game) {
    this.game = game;
    this.lastSaveTimestamp = new Date().getTime();
  }

  async init(tool: boolean = false) {
    try {
      const gameModel = await storageManager.readGameModel();
      gameModel.server = false;
      this.game.fromModel(gameModel);
    } catch {
      if (!tool) {
        storageManager.writeGameModel(this.game.toModel());
      }
    }

    this.updateBlocked = false;

    if (settingsManager.settings.serverUrl && settingsManager.settings.serverPort && settingsManager.settings.serverCode) {
      if (settingsManager.settings.serverAutoconnect) {
        this.connect();
      } else {
        gameManager.stateManager.updateBlocked = true;
        gameManager.stateManager.permissions = new Permissions();
        this.updatePermissions();
      }
    }

    await this.loadStorage();
    await this.migrateUndoInfos();

    this.ready = true;
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
    this.log = await this.readArray<LogEntry>('log');
    this.historyVersion++;
    this.updatePermissions();
  }

  private async readArray<T>(store: string): Promise<T[]> {
    try {
      return (await storageManager.readAll<T>(store)) || [];
    } catch {
      return [];
    }
  }

  /** migration: undo infos (one per undo/redo snapshot) are replaced by the log */
  async migrateUndoInfos() {
    const undoInfos = await this.readArray<string[]>('undo-infos');
    if (!undoInfos.length) {
      return;
    }
    try {
      if (!this.log.length) {
        this.log = StateManager.undoInfosToLog(undoInfos, this.undos, this.redos, this.game);
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

  async saveStorage() {
    if (!this.storageBlocked) {
      this.storageBlocked = true;
      try {
        await storageManager.writeArray('undo', this.undos);
        await storageManager.writeArray('redo', this.redos);
      } catch (error) {
        console.error('Failed to save undo/redo storage:', error);
        throw error;
      } finally {
        this.storageBlocked = false;
      }
    }
  }

  buildWsUrl(protocol: string, serverUrl: string, port: number | string) {
    const urls = serverUrl.split('/');
    const url = urls[0];
    let path: string = '';
    if (urls.length > 1) {
      path = '/' + urls.splice(1, urls.length + 1).join('/');
    }
    path = protocol + url + ':' + (port + '') + path;
    return path;
  }

  connect() {
    if (settingsManager.settings.serverUrl && settingsManager.settings.serverPort && settingsManager.settings.serverCode) {
      this.disconnect();
      this.connectionTries++;
      this.automaticTheme = true;
      const protocol = settingsManager.settings.serverWss ? 'wss://' : 'ws://';
      const url = this.buildWsUrl(protocol, settingsManager.settings.serverUrl, settingsManager.settings.serverPort);
      if (settingsManager.settings.logServerMessages) console.debug('WS preparing ' + url);
      this.ws = new WebSocket(url);
      this.ws.onmessage = this.onMessage;
      this.ws.onopen = this.onOpen;
      this.ws.onclose = this.onClose;
      this.ws.onerror = this.onError;
    }
  }

  disconnect() {
    this.permissions = undefined;
    this.updatePermissions();
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      if (settingsManager.settings.logServerMessages) console.debug(`WS closing`);
      this.ws.close();
    }
  }

  onMessage(ev: any): any {
    try {
      const message: any = JSON.parse(ev.data);
      gameManager.stateManager.updateBlocked = false;

      if (message.serverVersion) {
        gameManager.stateManager.serverVersion = message.serverVersion;
      }

      if (settingsManager.settings.logServerMessages) console.debug('WS received ' + message.type, ev);
      switch (message.type) {
        case 'game':
          window.document.body.classList.add('working');
          window.document.body.classList.add('server-sync');
          const gameModel: GameModel = message.payload as GameModel;

          if (gameManager.stateManager.automaticTheme && !!gameModel.edition) {
            gameManager.stateManager.automaticTheme = false;
            settingsManager.automaticTheme(gameModel.edition, gameManager.game.edition);
          }

          if (gameManager.game.revision > gameModel.revision) {
            gameManager.stateManager.before();
            storageManager.addBackup(gameManager.game.toModel());
            console.warn('An older revision was loaded from server, created a backup of previous state.');
            gameManager.stateManager.saveLocal();
            gameManager.stateManager.before('serverSyncEmpty');
          }
          const undoinfo = message.undoinfo;
          if (undoinfo) {
            if (undoinfo.length > 0 && undoinfo[0] === 'serverSync') {
              gameManager.stateManager.before('serverSync', ...undoinfo.slice(1));
            } else if (
              gameManager.game.revision - (gameManager.game.revisionOffset || 0) <
              gameModel.revision - (gameModel.revisionOffset || 0)
            ) {
              gameManager.stateManager.before('serverSync', ...undoinfo);
            }
          }

          gameManager.game.fromModel(gameModel, true);
          gameManager.stateManager.saveLocal();
          gameManager.triggerUiChange(true);
          setTimeout(() => {
            window.document.body.classList.remove('working');
            window.document.body.classList.remove('server-sync');
          }, 1);
          gameManager.stateManager.serverError = '';
          break;
        case 'game-undo':
          window.document.body.classList.add('working');
          window.document.body.classList.add('server-sync');
          const gameUndo: GameModel = message.payload as GameModel;
          gameManager.stateManager.addServerLog('undo', gameUndo, message);

          if (message.revision !== undefined) {
            const undoRevision = message.revision || 0;
            let undoCount = 0;
            let undoGame = gameManager.stateManager.undos.splice(gameManager.stateManager.undos.length - 1, 1)[0];
            if (undoGame && undoGame.revision - (undoGame.revisionOffset || 0) > undoRevision) {
              gameManager.stateManager.redos.push(undoGame);
              undoCount++;
            }
            while (undoGame && undoGame.revision - (undoGame.revisionOffset || 0) > undoRevision) {
              undoGame = gameManager.stateManager.undos.splice(gameManager.stateManager.undos.length - 1, 1)[0];
              if (undoGame && undoGame.revision - (undoGame.revisionOffset || 0) > undoRevision) {
                gameManager.stateManager.redos.push(undoGame);
                undoCount++;
              }
            }
            gameManager.stateManager.redos.splice(gameManager.stateManager.redos.length - undoCount, 0, gameManager.game.toModel());
          } else {
            gameManager.stateManager.redos.push(gameManager.game.toModel());
            const undoGame = gameManager.stateManager.undos[gameManager.stateManager.undos.length - 1];
            if (
              undoGame &&
              undoGame.revision - undoGame.revisionOffset === gameManager.game.revision - gameManager.game.revisionOffset - 1
            ) {
              gameManager.stateManager.undos.splice(gameManager.stateManager.undos.length - 1, 1);
            }
          }

          gameManager.game.fromModel(gameUndo);
          gameManager.stateManager.saveLocal();
          gameManager.stateManager.saveStorage();
          gameManager.triggerUiChange(true);
          setTimeout(() => {
            window.document.body.classList.remove('working');
            window.document.body.classList.remove('server-sync');
          }, 1);
          gameManager.stateManager.serverError = '';
          break;
        case 'game-redo':
          window.document.body.classList.add('working');
          window.document.body.classList.add('server-sync');
          const gameRedo: GameModel = message.payload as GameModel;
          gameManager.stateManager.addServerLog('redo', gameRedo, message);

          if (message.revision !== undefined) {
            const redoRevision = message.revision || 0;
            let redoCount = 0;
            let redoGame = gameManager.stateManager.redos.splice(gameManager.stateManager.redos.length - 1, 1)[0];
            if (redoGame && redoGame.revision - (redoGame.revisionOffset || 0) < redoRevision) {
              gameManager.stateManager.undos.push(redoGame);
              redoCount++;
            } else if (redoGame && redoGame.revision - (redoGame.revisionOffset || 0) > redoRevision) {
              gameManager.stateManager.redos.push(redoGame);
            }
            while (redoGame && redoGame.revision - (redoGame.revisionOffset || 0) < redoRevision) {
              redoGame = gameManager.stateManager.redos.splice(gameManager.stateManager.redos.length - 1, 1)[0];
              if (redoGame && redoGame.revision - (redoGame.revisionOffset || 0) < redoRevision) {
                gameManager.stateManager.undos.push(redoGame);
                redoCount++;
              }
            }
            gameManager.stateManager.undos.splice(gameManager.stateManager.undos.length - redoCount, 0, gameManager.game.toModel());
          } else {
            gameManager.stateManager.undos.push(gameManager.game.toModel());
            const redoGame =
              gameManager.stateManager.redos.length > 0
                ? gameManager.stateManager.redos[gameManager.stateManager.redos.length - 1]
                : undefined;
            if (
              redoGame &&
              redoGame.revision - redoGame.revisionOffset === gameManager.game.revision - gameManager.game.revisionOffset + 1
            ) {
              gameManager.stateManager.redos.splice(gameManager.stateManager.redos.length - 1, 1);
            }
          }

          gameManager.game.fromModel(gameRedo);
          gameManager.stateManager.saveLocal();
          gameManager.stateManager.saveStorage();
          gameManager.triggerUiChange(true);
          setTimeout(() => {
            window.document.body.classList.remove('working');
            window.document.body.classList.remove('server-sync');
          }, 1);
          gameManager.stateManager.serverError = '';
          break;
        case 'game-update':
          window.document.body.classList.add('working');
          window.document.body.classList.add('server-sync');
          const gameUpdate: GameModel = message.payload as GameModel;
          if (gameManager.game.revision === gameUpdate.revision) {
            gameManager.game.playSeconds = gameUpdate.playSeconds;
            gameManager.game.server = gameUpdate.server;
            gameManager.stateManager.saveLocal();
            gameManager.triggerUiChange(true);
            setTimeout(() => {
              window.document.body.classList.remove('working');
              window.document.body.classList.remove('server-sync');
            }, 1);
            gameManager.stateManager.serverError = '';
          }
          break;
        case 'requestUpdate':
          gameManager.stateManager.after(1, false, 0, 'game-update');
          gameManager.stateManager.serverError = '';
          break;
        case 'settings':
          window.document.body.classList.add('server-sync');
          if (settingsManager.settings.serverSettings) {
            // no settings on server, store own settings first
            if (!message.payload) {
              gameManager.stateManager.saveSettings();
            } else {
              const settings: Settings = message.payload as Settings;
              // keep local
              localSettings.forEach((setting) => {
                settings[setting] = settingsManager.settings[setting];
              });

              // migration
              settings.serverCode = settingsManager.settings.serverCode || settingsManager.settings.serverPassword;
              settings.serverPassword = undefined;

              settingsManager.setSettings(Object.assign(new Settings(), settings));
              storageManager.write('settings', 'default', settingsManager.settings);
            }
          }
          setTimeout(() => {
            window.document.body.classList.remove('server-sync');
          }, 1);
          gameManager.stateManager.serverError = '';
          break;
        case 'permissions':
          gameManager.stateManager.permissions = (message.payload as Permissions) || undefined;
          gameManager.stateManager.permissionBackup =
            (gameManager.stateManager.permissions && JSON.parse(JSON.stringify(gameManager.stateManager.permissions))) || undefined;
          gameManager.stateManager.updatePermissions();
          gameManager.stateManager.serverError = '';
          break;
        case 'ping':
          console.debug('Received ping answer...');
          break;
        case 'remoteCommand':
          if (message.payload && (gameManager.game.server || message.payload.force)) {
            console.debug('remoteCommand:', message.payload);
            commandManager.execute(message.payload.id, true, ...(message.payload.parameters || []));
          }
          break;
        case 'error':
          // migration
          if (message.message === 'No enum constant de.champonthis.ghs.server.socket.model.MessageType.PING') {
            console.debug('Received ping answer...');
            break;
          }
          console.warn('[GHS] Error: ', message);
          if (message.message.startsWith('Permission(s) missing') || message.message.startsWith('invalid revision')) {
            if (gameManager.stateManager.lastAction === 'redo' || gameManager.stateManager.lastAction === 'update') {
              gameManager.stateManager.undo(false);
            } else if (gameManager.stateManager.lastAction === 'undo') {
              gameManager.stateManager.redo(false);
            }
          }
          if (message.message && (message.message.startsWith('Invalid password') || message.message.startsWith('Invalid game code'))) {
            console.warn('Disconnect...');
            ev.target?.close();
          }
          gameManager.stateManager.serverError = typeof message === 'string' ? message : JSON.stringify(message);
          window.document.body.classList.remove('working');
          window.document.body.classList.remove('server-sync');
          break;
        default:
          gameManager.triggerUiChange(false);
      }
    } catch (e) {
      gameManager.stateManager.errorLog.push(ev.data);
      gameManager.stateManager.serverError = ev.data;
      console.error('[GHS] ' + ev.data, e);
      window.document.body.classList.remove('working');
      window.document.body.classList.remove('server-sync');
    }
  }

  onOpen(ev: Event) {
    if (settingsManager.settings.logServerMessages) console.debug('WS opened', ev);
    const ws = ev.target as WebSocket;
    if (ws && ws.readyState === WebSocket.OPEN && settingsManager.settings.serverCode) {
      gameManager.stateManager.connectionTries = 0;
      gameManager.stateManager.updateBlocked = false;
      gameManager.stateManager.permissions = gameManager.stateManager.permissionBackup;
      const message = {
        code: settingsManager.settings.serverCode,
        password: settingsManager.settings.serverCode, // migration
        type: 'request-game',
        payload: gameManager.game.toModel()
      };
      if (settingsManager.settings.logServerMessages) console.debug('WS sending request-game');
      ws.send(JSON.stringify(message));

      if (settingsManager.settings.serverSettings) {
        const message = {
          code: settingsManager.settings.serverCode,
          password: settingsManager.settings.serverCode, // migration
          type: 'request-settings',
          'allow-empty': true
        };
        if (settingsManager.settings.logServerMessages) console.debug('WS sending request-settings');
        ws.send(JSON.stringify(message));
      }

      gameManager.stateManager.updatePermissions();
      gameManager.triggerUiChange(false);
    }
  }

  onClose(ev: Event) {
    if (settingsManager.settings.logServerMessages) console.debug('WS closed', ev);
    gameManager.game.server = false;
    gameManager.stateManager.updateBlocked = true;
    gameManager.stateManager.serverVersion = '';
    gameManager.stateManager.permissions = new Permissions();
    gameManager.stateManager.updatePermissions();
    gameManager.triggerUiChange(false);
  }

  onError(ev: Event) {
    if (settingsManager.settings.logServerMessages) console.debug('WS error', ev);
    gameManager.game.server = false;
    gameManager.stateManager.updateBlocked = true;
    gameManager.stateManager.serverVersion = '';
    gameManager.stateManager.permissions = new Permissions();
    gameManager.stateManager.updatePermissions();
    gameManager.triggerUiChange(false);
  }

  forceUpdateState() {
    gameManager.stateManager.updateBlocked = false;
    gameManager.stateManager.permissions = gameManager.stateManager.permissionBackup;
    gameManager.stateManager.updatePermissions();
    gameManager.triggerUiChange(false);
  }

  requestSettings() {
    if (
      this.ws &&
      this.ws.readyState === WebSocket.OPEN &&
      settingsManager.settings.serverCode &&
      settingsManager.settings.serverSettings
    ) {
      const message = {
        code: settingsManager.settings.serverCode,
        password: settingsManager.settings.serverCode, // migration
        type: 'request-settings',
        'allow-empty': true
      };
      if (settingsManager.settings.logServerMessages) console.debug('WS sending request-settings');
      this.ws.send(JSON.stringify(message));
    }
  }

  sendPing() {
    if (settingsManager.settings.serverUrl && settingsManager.settings.serverPort && settingsManager.settings.serverCode) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const message = {
          code: settingsManager.settings.serverCode,
          type: 'ping'
        };
        if (settingsManager.settings.logServerMessages) console.debug('WS sending ping');
        this.ws.send(JSON.stringify(message));
      } else {
        this.connect();
      }
    }
  }

  wsState(): number {
    if (settingsManager.settings.serverUrl && settingsManager.settings.serverPort && settingsManager.settings.serverCode) {
      return (this.ws && this.ws.readyState) || -1;
    } else {
      return -99;
    }
  }

  reset() {
    storageManager.addBackup(gameManager.game.toModel());
    const revision = this.game.revision;
    this.game = new Game();
    this.game.revision = revision;
    storageManager.clear('game');
    storageManager.clear('undo');
    storageManager.clear('redo');
    storageManager.clear('undo-infos');
    storageManager.clear('log');
    this.undos = [];
    this.redos = [];
    this.log = [];
    this.historyVersion++;
  }

  saveLocal() {
    storageManager.writeGameModel(this.game.toModel());
    this.lastSaveTimestamp = new Date().getTime();
  }

  saveSettings() {
    if (
      this.ws &&
      this.ws.readyState === WebSocket.OPEN &&
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
      this.ws.send(JSON.stringify(message));
    }
  }

  updatePermissions() {
    this.undoPermission = this.hasUndo() && (!this.permissions || !this.updateBlocked);
    this.redoPermission = this.hasRedo() && (!this.permissions || !this.updateBlocked);
    this.characterPermissions = {};

    gameManager.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        this.characterPermissions[figure.name + '|' + figure.edition] =
          !this.permissions ||
          (this.permissions &&
            (this.permissions.characters ||
              this.permissions.character.some((value) => value.name === figure.name && value.edition === figure.edition)));
      }
    });

    if (gameManager.game.party.retirements) {
      gameManager.game.party.retirements.forEach((model) => {
        this.characterPermissions[model.name + '|' + model.edition] =
          !this.permissions ||
          (this.permissions &&
            (this.permissions.characters ||
              this.permissions.character.some((value) => value.name === model.name && value.edition === model.edition)));
      });
    }

    this.monsterPermissions = {};
    gameManager.game.figures.forEach((figure) => {
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
  }

  /**
   * Start an automatic change done in background (e.g. auto. clock out), must be finished with `afterAutomatic()`.
   * No undo snapshot is created, so the redo history is kept. The change only gets logged.
   */
  beforeAutomatic(...info: (string | number | boolean)[]) {
    window.document.body.classList.add('working');
    this.addLog(this.createLog('automatic', (info && info.map((value) => '' + value)) || []));
  }

  /** finish an automatic change: persist and sync it, without changing the effective revision (undo/redo position) */
  async afterAutomatic(timeout: number = 1) {
    this.game.revisionOffset += 1;
    await this.after(timeout);
  }

  async after(
    timeout: number = 1,
    autoBackup: boolean = false,
    revisionChange: number = 1,
    type: string = 'game',
    revision: number = 0,
    undolength: number = 1
  ) {
    this.game.revision += revisionChange;
    this.saveLocal();
    if (this.ws && this.ws.readyState === WebSocket.OPEN && settingsManager.settings.serverCode) {
      window.document.body.classList.add('server-sync');
      const lastEntry: LogEntry | undefined = this.log[this.log.length - 1];
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
      this.ws.send(JSON.stringify(message));
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
        this.lastAction = 'update';
        gameManager.triggerUiChange(false);
        window.document.body.classList.remove('working');
        window.document.body.classList.remove('server-sync');
      }, timeout * settingsManager.settings.animationSpeed);
    } else {
      this.lastAction = 'update';
      gameManager.triggerUiChange(false);
      window.document.body.classList.remove('working');
      window.document.body.classList.remove('server-sync');
    }
  }

  async autoBackup(filename: string = '', forceDownload: boolean = false) {
    if (this.autoBackupTimeout) {
      return;
    }

    if (this.storageBlocked) {
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
    if (this.undos.length > maxUndos) {
      this.undos.splice(0, this.undos.length - maxUndos);
    }

    if (this.redos.length > 5) {
      storageManager.addBackup(this.redos[0]);
    }

    this.redos = [];

    // the snapshot has the effective revision of the current game, which links the entry to it
    this.addLog(this.createLog('update', info, info.length > 0 && info[0] === 'serverSync'));

    this.saveStorage();
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
      this.undos.length,
      this.redos.length,
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
      undo: new Array(this.undos.length),
      redo: new Array(this.redos.length),
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
    for (let i = this.undos.length - 1; i >= 0; i--) {
      const revision = effectiveRevision(this.undos[i]);
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
    for (let i = 0; i < this.redos.length; i++) {
      const revision = effectiveRevision(this.redos[this.redos.length - 1 - i]);
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
        return ['serverSync', settingsManager.getLabel('state.info.' + info[1], [info[2], ''])];
      }
      return ['serverSync', settingsManager.getLabel('state.info.' + info[1], info.slice(2))];
    } else if (info.length === 1 && info[0] === 'serverSync') {
      return ['serverSync', ''];
    }
    return info;
  }

  revertLastUndo() {
    this.undos.splice(this.undos.length - 1, 1);
    const lastEntry = this.log[this.log.length - 1];
    if (lastEntry && lastEntry.type === 'update') {
      this.log.pop();
      storageManager.removeLast('log', this.log).catch((error) => console.error('Failed to save log:', error));
    }
    this.historyVersion++;
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
    if (undolength > 0 && undolength <= this.undos.length) {
      window.document.body.classList.add('working');
      const entry = this.history().undo[this.undos.length - 1];
      this.addLog(
        this.createLog('undo', entry ? entry.info : [], false, effectiveRevision(this.undos[this.undos.length - undolength]), undolength)
      );
      this.redos.push(this.game.toModel());
      const revision = gameManager.game.revision;
      const revisionOffset = gameManager.game.revisionOffset + undolength - 1;
      const undos = this.undos.splice(this.undos.length - undolength, undolength);
      for (let i = undos.length - 1; i > 0; i--) {
        this.redos.push(undos[i]);
      }
      const gameModel: GameModel = undos[0];
      this.game.fromModel(gameModel);
      this.game.revision = revision;
      this.game.revisionOffset = revisionOffset + 2;
      this.saveStorage();
      if (sync) {
        this.after(1, false, 1, 'game-undo', undos[0].revision - (undos[0].revisionOffset || 0), undolength);
      } else {
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
    if (redolength > 0 && redolength <= this.redos.length) {
      window.document.body.classList.add('working');
      const entry = this.history().redo[redolength - 1];
      this.addLog(
        this.createLog('redo', entry ? entry.info : [], false, effectiveRevision(this.redos[this.redos.length - redolength]), redolength)
      );
      this.undos.push(this.game.toModel());
      const revision = gameManager.game.revision;
      const revisionOffset = gameManager.game.revisionOffset - redolength + 1;
      const redos = this.redos.splice(this.redos.length - redolength, redolength);
      for (let i = redos.length - 1; i > 0; i--) {
        this.undos.push(redos[i]);
      }
      const gameModel: GameModel = redos[0];
      this.game.fromModel(gameModel);
      this.game.revision = revision;
      this.game.revisionOffset = revisionOffset;
      this.saveStorage();
      if (sync) {
        this.after(1, false, 1, 'game-redo', redos[0].revision - (redos[0].revisionOffset || 0), redolength);
      } else {
        gameManager.triggerUiChange(false);
      }
      this.lastAction = 'undo';
    }
  }

  clearUndos() {
    this.undos = [];
    this.historyVersion++;
    this.saveStorage();
  }

  clearRedos() {
    this.redos = [];
    this.historyVersion++;
    this.saveStorage();
  }

  /** clear the log, except entries describing an existing undo/redo snapshot */
  clearLog() {
    const links = this.history().links;
    this.log = this.log.filter((entry) => links.has(entry));
    this.historyVersion++;
    storageManager.writeArray('log', this.log).catch((error) => console.error('Failed to clear log:', error));
  }

  savePermissions(code: string, permissions: Permissions | undefined) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && settingsManager.settings.serverCode) {
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
      this.ws.send(JSON.stringify(message));
    }
  }
}
