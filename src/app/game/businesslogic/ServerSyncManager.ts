import { commandManager, gameManager, settingsManager, storageManager } from 'src/app/game/businesslogic/Managers';
import { Game, GameModel } from 'src/app/game/model/Game';
import { Permissions } from 'src/app/game/model/Permissions';
import { localSettings, Settings } from 'src/app/game/model/Settings';

export class ServerSyncManager {
  game: Game;
  ws: WebSocket | undefined;
  serverError: string = '';
  permissionBackup: Permissions | undefined;
  connectionTries: number = 0;
  serverVersion: string = '';
  automaticTheme: boolean = true;

  constructor(game: Game) {
    this.game = game;
  }

  initServer() {
    if (settingsManager.settings.serverUrl && settingsManager.settings.serverPort && settingsManager.settings.serverCode) {
      if (settingsManager.settings.serverAutoconnect) {
        this.connect();
      } else {
        gameManager.stateManager.updateBlocked = true;
        gameManager.stateManager.permissions = new Permissions();
        gameManager.stateManager.updatePermissions();
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
    if (
      !gameManager.stateManager.missingEditions.length &&
      settingsManager.settings.serverUrl &&
      settingsManager.settings.serverPort &&
      settingsManager.settings.serverCode
    ) {
      this.disconnect();
      this.connectionTries++;
      this.automaticTheme = true;
      const protocol = settingsManager.settings.serverWss ? 'wss://' : 'ws://';
      const url = this.buildWsUrl(protocol, settingsManager.settings.serverUrl, settingsManager.settings.serverPort);
      if (settingsManager.settings.logServerMessages) console.debug('WS preparing ' + url);
      this.ws = new WebSocket(url);
      this.ws.onmessage = (ev) => this.onMessage(ev);
      this.ws.onopen = (ev) => this.onOpen(ev);
      this.ws.onclose = (ev) => this.onClose(ev);
      this.ws.onerror = (ev) => this.onError(ev);
    }
  }

  disconnect() {
    gameManager.stateManager.permissions = undefined;
    gameManager.stateManager.updatePermissions();
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
        this.serverVersion = message.serverVersion;
      }

      if (settingsManager.settings.logServerMessages) console.debug('WS received ' + message.type, ev);
      switch (message.type) {
        case 'game':
          this.onGameMessage(message);
          break;
        case 'game-undo':
          this.onGameUndoMessage(message);
          break;
        case 'game-redo':
          this.onGameRedoMessage(message);
          break;
        case 'game-update':
          window.document.body.classList.add('working');
          window.document.body.classList.add('server-sync');
          const gameUpdate: GameModel = message.payload as GameModel;
          if (this.game.revision === gameUpdate.revision) {
            this.game.playSeconds = gameUpdate.playSeconds;
            this.game.server = gameUpdate.server;
            gameManager.stateManager.saveLocal();
            gameManager.triggerUiChange(true);
            setTimeout(() => {
              window.document.body.classList.remove('working');
              window.document.body.classList.remove('server-sync');
            }, 1);
            this.serverError = '';
          }
          break;
        case 'requestUpdate':
          gameManager.stateManager.after(1, false, 0, 'game-update');
          this.serverError = '';
          break;
        case 'settings':
          this.onSettingsMessage(message);
          break;
        case 'permissions':
          gameManager.stateManager.permissions = (message.payload as Permissions) || undefined;
          this.permissionBackup =
            (gameManager.stateManager.permissions && JSON.parse(JSON.stringify(gameManager.stateManager.permissions))) || undefined;
          gameManager.stateManager.updatePermissions();
          this.serverError = '';
          break;
        case 'ping':
          console.debug('Received ping answer...');
          break;
        case 'remoteCommand':
          if (message.payload && (this.game.server || message.payload.force)) {
            console.debug('remoteCommand:', message.payload);
            commandManager.execute(message.payload.id, true, ...(message.payload.parameters || []));
          }
          break;
        case 'error':
          this.onErrorMessage(message, ev);
          break;
        default:
          gameManager.triggerUiChange(false);
      }
    } catch (e) {
      gameManager.stateManager.errorLog.push(ev.data);
      this.serverError = ev.data;
      console.error('[GHS] ' + ev.data, e);
      window.document.body.classList.remove('working');
      window.document.body.classList.remove('server-sync');
    }
  }

  onGameMessage(message: any) {
    window.document.body.classList.add('working');
    window.document.body.classList.add('server-sync');
    const gameModel: GameModel = message.payload as GameModel;

    if (this.automaticTheme && !!gameModel.edition) {
      this.automaticTheme = false;
      settingsManager.automaticTheme(gameModel.edition, this.game.edition);
    }

    if (this.game.revision > gameModel.revision) {
      gameManager.stateManager.before();
      storageManager.addBackup(this.game.toModel());
      console.warn('An older revision was loaded from server, created a backup of previous state.');
      gameManager.stateManager.saveLocal();
      gameManager.stateManager.before('serverSyncEmpty');
    }
    const undoinfo = message.undoinfo;
    if (undoinfo) {
      if (undoinfo.length > 0 && undoinfo[0] === 'serverSync') {
        gameManager.stateManager.before('serverSync', ...undoinfo.slice(1));
      } else if (this.game.revision - (this.game.revisionOffset || 0) < gameModel.revision - (gameModel.revisionOffset || 0)) {
        gameManager.stateManager.before('serverSync', ...undoinfo);
      }
    }

    this.game.fromModel(gameModel, true);
    gameManager.stateManager.saveLocal();
    gameManager.triggerUiChange(true);
    setTimeout(() => {
      window.document.body.classList.remove('working');
      window.document.body.classList.remove('server-sync');
    }, 1);
    this.serverError = '';
  }

  onGameUndoMessage(message: any) {
    window.document.body.classList.add('working');
    window.document.body.classList.add('server-sync');
    const gameUndo: GameModel = message.payload as GameModel;
    gameManager.historyManager.addServerLog('undo', gameUndo, message);

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
      gameManager.stateManager.redos.splice(gameManager.stateManager.redos.length - undoCount, 0, this.game.toModel());
    } else {
      gameManager.stateManager.redos.push(this.game.toModel());
      const undoGame = gameManager.stateManager.undos[gameManager.stateManager.undos.length - 1];
      if (undoGame && undoGame.revision - undoGame.revisionOffset === this.game.revision - this.game.revisionOffset - 1) {
        gameManager.stateManager.undos.splice(gameManager.stateManager.undos.length - 1, 1);
      }
    }

    this.game.fromModel(gameUndo);
    gameManager.stateManager.saveLocal();
    gameManager.stateManager.saveStorage();
    gameManager.triggerUiChange(true);
    setTimeout(() => {
      window.document.body.classList.remove('working');
      window.document.body.classList.remove('server-sync');
    }, 1);
    this.serverError = '';
  }

  onGameRedoMessage(message: any) {
    window.document.body.classList.add('working');
    window.document.body.classList.add('server-sync');
    const gameRedo: GameModel = message.payload as GameModel;
    gameManager.historyManager.addServerLog('redo', gameRedo, message);

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
      gameManager.stateManager.undos.splice(gameManager.stateManager.undos.length - redoCount, 0, this.game.toModel());
    } else {
      gameManager.stateManager.undos.push(this.game.toModel());
      const redoGame =
        gameManager.stateManager.redos.length > 0 ? gameManager.stateManager.redos[gameManager.stateManager.redos.length - 1] : undefined;
      if (redoGame && redoGame.revision - redoGame.revisionOffset === this.game.revision - this.game.revisionOffset + 1) {
        gameManager.stateManager.redos.splice(gameManager.stateManager.redos.length - 1, 1);
      }
    }

    this.game.fromModel(gameRedo);
    gameManager.stateManager.saveLocal();
    gameManager.stateManager.saveStorage();
    gameManager.triggerUiChange(true);
    setTimeout(() => {
      window.document.body.classList.remove('working');
      window.document.body.classList.remove('server-sync');
    }, 1);
    this.serverError = '';
  }

  onSettingsMessage(message: any) {
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
    this.serverError = '';
  }

  onErrorMessage(message: any, ev: any) {
    // migration
    if (message.message === 'No enum constant de.champonthis.ghs.server.socket.model.MessageType.PING') {
      console.debug('Received ping answer...');
      return;
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
    this.serverError = typeof message === 'string' ? message : JSON.stringify(message);
    window.document.body.classList.remove('working');
    window.document.body.classList.remove('server-sync');
  }

  onOpen(ev: Event) {
    if (settingsManager.settings.logServerMessages) console.debug('WS opened', ev);
    const ws = ev.target as WebSocket;
    if (ws && ws.readyState === WebSocket.OPEN && settingsManager.settings.serverCode) {
      this.connectionTries = 0;
      gameManager.stateManager.updateBlocked = false;
      gameManager.stateManager.permissions = this.permissionBackup;
      const message = {
        code: settingsManager.settings.serverCode,
        password: settingsManager.settings.serverCode, // migration
        type: 'request-game',
        payload: this.game.toModel()
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
    this.game.server = false;
    gameManager.stateManager.updateBlocked = true;
    this.serverVersion = '';
    gameManager.stateManager.permissions = new Permissions();
    gameManager.stateManager.updatePermissions();
    gameManager.triggerUiChange(false);
  }

  onError(ev: Event) {
    if (settingsManager.settings.logServerMessages) console.debug('WS error', ev);
    this.game.server = false;
    gameManager.stateManager.updateBlocked = true;
    this.serverVersion = '';
    gameManager.stateManager.permissions = new Permissions();
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
}
