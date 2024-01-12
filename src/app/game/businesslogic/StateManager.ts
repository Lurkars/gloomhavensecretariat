import { Character } from "../model/Character";
import { Game, GameModel } from "../model/Game";
import { Monster } from "../model/Monster";
import { Permissions } from "../model/Permissions";
import { Settings } from "../model/Settings";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";
import { storageManager } from "./StorageManager";

export class StateManager {

  game: Game;
  permissions: Permissions | undefined;
  ws: WebSocket | undefined;

  undos: GameModel[] = [];
  redos: GameModel[] = [];
  undoInfos: string[][] = [];

  lastSaveTimestamp: number;

  hasUpdate: boolean = false;
  installPrompt: any = null;

  lastAction: "update" | "undo" | "redo" = "update";
  updateBlocked: boolean = false;
  serverError: boolean = false;
  errorLog: any[] = [];
  backupError: number | undefined;
  permissionBackup: Permissions | undefined;
  connectionTries: number = 0;
  gameOffsetWarning: boolean = true;
  standeeDialogCanceled: boolean = false;
  keyboardSelecting: boolean = false;
  keyboardSelect: number = -1;

  undoPermission: boolean = false;
  redoPermission: boolean = false;
  characterPermissions: Record<string, boolean> = {};
  monsterPermissions: Record<string, boolean> = {};

  wakeLock: any = null;
  scenarioSummary: boolean = false;
  serverVersion: string = "";

  storageBlocked: boolean = false;
  autoBackupTimeout: any = null;

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

    if (settingsManager.settings.serverUrl && settingsManager.settings.serverPort && settingsManager.settings.serverPassword) {
      if (settingsManager.settings.serverAutoconnect) {
        this.connect();
      } else {
        gameManager.stateManager.updateBlocked = true;
        gameManager.stateManager.permissions = new Permissions();
        this.updatePermissions();
      }
    }

    await this.loadStorage();

    // migration
    const missingUndoInfos = this.undos.length + this.redos.length - this.undoInfos.length;
    for (let i = 0; i < missingUndoInfos; i++) {
      this.undoInfos.unshift([]);
    }

    gameManager.uiChange.subscribe({
      next: () => {
        if (!settingsManager.settings.serverUrl || !settingsManager.settings.serverPort || !settingsManager.settings.serverPassword) {
          this.permissions = undefined;
          this.updateBlocked = false;
        }
        this.updatePermissions();
      }
    })

    gameManager.uiChange.emit();
  }

  async install() {
    if (this.installPrompt) {
      this.installPrompt.prompt();
      await gameManager.stateManager.installPrompt.userChoice;
      this.installPrompt = null;
    }
  }

  async loadStorage() {
    try {
      this.undos = await storageManager.readAll<GameModel>('undo');
      this.redos = await storageManager.readAll<GameModel>('redo');
      this.undoInfos = await storageManager.readAll<string[]>('undo-infos');
      this.updatePermissions();
    } catch {
      this.updatePermissions();
    }
  }

  async saveStorage() {
    if (!this.storageBlocked) {
      this.storageBlocked = true;
      await storageManager.writeArray('undo', this.undos);
      await storageManager.writeArray('redo', this.redos);
      await storageManager.writeArray('undo-infos', this.undoInfos);
      this.storageBlocked = false;
    }
  }

  buildWsUrl(protocol: string, serverUrl: string, port: number | string) {
    let urls = serverUrl.split("/");
    const url = urls[0];
    let path: string = "";
    if (urls.length > 1) {
      path = "/" + (urls.splice(1, urls.length + 1).join("/"));
    }
    path = protocol + url + ":" + (port + "") + path;
    return path;
  }

  connect() {
    if (settingsManager.settings.serverUrl && settingsManager.settings.serverPort && settingsManager.settings.serverPassword) {
      this.disconnect();
      this.connectionTries++;
      const protocol = settingsManager.settings.serverWss ? "wss://" : "ws://";
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
    if (this.ws && this.ws.readyState != WebSocket.CLOSED) {
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
        case "game":
          window.document.body.classList.add('working');
          window.document.body.classList.add('server-sync');
          let gameModel: GameModel = message.payload as GameModel;
          if (gameManager.game.revision > gameModel.revision) {
            gameManager.stateManager.before();
            storageManager.addBackup(gameManager.game.toModel());
            console.warn("An older revision was loaded from server, created a backup of previous state.");
            gameManager.stateManager.saveLocal();
            gameManager.stateManager.before("serverSyncEmpty");
          }
          const undoinfo = message.undoinfo;
          if (undoinfo) {
            if (undoinfo.length > 0 && undoinfo[0] == "serverSync") {
              gameManager.stateManager.before("serverSync", ...undoinfo.slice(1));
            } else if (gameManager.game.revision - (gameManager.game.revisionOffset || 0) < gameModel.revision - (gameModel.revisionOffset || 0)) {
              gameManager.stateManager.before("serverSync", ...undoinfo);
            }
          }
          gameManager.game.fromModel(gameModel, true);
          gameManager.stateManager.saveLocal();
          gameManager.uiChange.emit(true);
          setTimeout(() => {
            window.document.body.classList.remove('working');
            window.document.body.classList.remove('server-sync');
          }, 1);
          gameManager.stateManager.serverError = false;
          break;
        case "game-undo":
          window.document.body.classList.add('working');
          window.document.body.classList.add('server-sync');
          let gameUndo: GameModel = message.payload as GameModel;

          if (message.revision != undefined) {
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
            if (!undoGame || undoGame.revision - (undoGame.revisionOffset || 0) != undoRevision) {
              gameManager.stateManager.undoInfos.splice(gameManager.stateManager.undos.length - gameManager.stateManager.redos.length, 0, message.undoinfo ? (message.undoinfo[0] == 'serverSync' ? message.undoinfo : ['serverSync', ...message.undoinfo]) : ['serverSync']);
            }
            gameManager.stateManager.redos.splice(gameManager.stateManager.redos.length - undoCount, 0, gameManager.game.toModel());
          } else {
            gameManager.stateManager.redos.push(gameManager.game.toModel());
            const undoGame = gameManager.stateManager.undos[gameManager.stateManager.undos.length - 1];
            if (undoGame && undoGame.revision - undoGame.revisionOffset == gameManager.game.revision - gameManager.game.revisionOffset - 1) {
              gameManager.stateManager.undos.splice(gameManager.stateManager.undos.length - 1, 1);
            } else {
              gameManager.stateManager.undoInfos.splice(gameManager.stateManager.undoInfos.length - gameManager.stateManager.redos.length, 0, message.undoinfo ? ['serverSync', ...message.undoinfo] : ['serverSync']);
            }
          }

          gameManager.game.fromModel(gameUndo);
          gameManager.stateManager.saveLocal();
          gameManager.stateManager.saveStorage();
          gameManager.uiChange.emit(true);
          setTimeout(() => {
            window.document.body.classList.remove('working');
            window.document.body.classList.remove('server-sync');
          }, 1);
          gameManager.stateManager.serverError = false;
          break;
        case "game-redo":
          window.document.body.classList.add('working');
          window.document.body.classList.add('server-sync');
          let gameRedo: GameModel = message.payload as GameModel;

          if (message.revision != undefined) {
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
            if (!redoGame || redoGame.revision - (redoGame.revisionOffset || 0) != redoRevision) {
              gameManager.stateManager.undoInfos.splice(gameManager.stateManager.undos.length + redoCount, 0, message.undoinfo ? (message.undoinfo[0] == 'serverSync' ? message.undoinfo : ['serverSync', ...message.undoinfo]) : ['serverSync']);
            }
            gameManager.stateManager.undos.splice(gameManager.stateManager.undos.length - redoCount, 0, gameManager.game.toModel());
          } else {
            gameManager.stateManager.undos.push(gameManager.game.toModel());
            const redoGame = gameManager.stateManager.redos.length > 0 ? gameManager.stateManager.redos[gameManager.stateManager.redos.length - 1] : undefined;
            if (redoGame && redoGame.revision - redoGame.revisionOffset == gameManager.game.revision - gameManager.game.revisionOffset + 1) {
              gameManager.stateManager.redos.splice(gameManager.stateManager.redos.length - 1, 1);
            } else {
              gameManager.stateManager.undoInfos.splice(gameManager.stateManager.undoInfos.length - gameManager.stateManager.redos.length, 0, message.undoinfo && ['serverSync', ...message.undoinfo] || ['serverSync']);
            }
          }

          gameManager.game.fromModel(gameRedo);
          gameManager.stateManager.saveLocal();
          gameManager.stateManager.saveStorage();
          gameManager.uiChange.emit(true);
          setTimeout(() => {
            window.document.body.classList.remove('working');
            window.document.body.classList.remove('server-sync');
          }, 1);
          gameManager.stateManager.serverError = false;
          break;
        case "game-update":
          window.document.body.classList.add('working');
          window.document.body.classList.add('server-sync');
          let gameUpdate: GameModel = message.payload as GameModel;
          if (gameManager.game.revision == gameUpdate.revision) {
            gameManager.game.playSeconds = gameUpdate.playSeconds;
            gameManager.game.server = gameUpdate.server;
            gameManager.stateManager.saveLocal();
            gameManager.uiChange.emit(true);
            setTimeout(() => {
              window.document.body.classList.remove('working');
              window.document.body.classList.remove('server-sync');
            }, 1);
            gameManager.stateManager.serverError = false;
          }
          break;
        case "requestUpdate":
          gameManager.stateManager.after(1, false, 0, 'game-update');
          gameManager.stateManager.serverError = false;
          break;
        case "settings":
          window.document.body.classList.add('server-sync');
          if (settingsManager.settings.serverSettings) {
            let settings: Settings = message.payload as Settings;
            // keep local
            settings.animations = settingsManager.settings.animations;
            settings.artwork = settingsManager.settings.artwork;
            settings.automaticAttackModifierFullscreen = settingsManager.settings.automaticAttackModifierFullscreen;
            settings.autoBackup = settingsManager.settings.autoBackup;
            settings.autoBackupFinish = settingsManager.settings.autoBackupFinish;
            settings.autoBackupUrl = settingsManager.settings.autoBackupUrl;
            settings.autoscroll = settingsManager.settings.autoscroll;
            settings.automaticTheme = settingsManager.settings.automaticTheme;
            settings.barsize = settingsManager.settings.barsize;
            settings.backupHint = settingsManager.settings.backupHint;
            settings.browserNavigation = settingsManager.settings.browserNavigation;
            settings.calendarLocked = settingsManager.settings.calendarLocked;
            settings.characterAttackModifierAnimate = settingsManager.settings.characterAttackModifierAnimate;
            settings.characterAttackModifierDeckPermanent = settingsManager.settings.characterAttackModifierDeckPermanent;
            settings.characterAttackModifierDeckPermanentActive = settingsManager.settings.characterAttackModifierDeckPermanentActive;
            settings.characterItemsPermanent = settingsManager.settings.characterItemsPermanent;
            settings.characterItemsPermanentActive = settingsManager.settings.characterItemsPermanentActive;
            settings.characterItemsPermanentEquipped = settingsManager.settings.characterItemsPermanentEquipped;
            settings.characterItemsPermanentSorted = settingsManager.settings.characterItemsPermanentSorted;
            settings.characterItemsPermanentZoom = settingsManager.settings.characterItemsPermanentZoom;
            settings.characterCompact = settingsManager.settings.characterCompact;
            settings.characterSheetCompact = settingsManager.settings.characterSheetCompact;
            settings.columns = settingsManager.settings.columns;
            settings.debugRightClick = settingsManager.settings.debugRightClick;
            settings.disableAnimations = settingsManager.settings.disableAnimations;
            settings.disableArtwork = settingsManager.settings.disableArtwork;
            settings.disableColumns = settingsManager.settings.disableColumns;
            settings.disableDragFigures = settingsManager.settings.disableDragFigures;
            settings.disablePinchZoom = settingsManager.settings.disablePinchZoom;
            settings.disableWakeLock = settingsManager.settings.disableWakeLock;
            settings.dragFigures = settingsManager.settings.dragFigures;
            settings.dragValues = settingsManager.settings.dragValues;
            settings.fhStyle = settingsManager.settings.fhStyle;
            settings.fontsize = settingsManager.settings.fontsize;
            settings.globalFontsize = settingsManager.settings.globalFontsize;
            settings.fullscreen = settingsManager.settings.fullscreen;
            settings.hideCharacterHP = settingsManager.settings.hideCharacterHP;
            settings.hideCharacterLoot = settingsManager.settings.hideCharacterLoot;
            settings.hideCharacterXP = settingsManager.settings.hideCharacterXP;
            settings.hints = settingsManager.settings.hints;
            settings.logServerMessages = settingsManager.settings.logServerMessages;
            settings.pinchZoom = settingsManager.settings.pinchZoom;
            settings.portraitMode = settingsManager.settings.portraitMode;
            settings.pressDoubleClick = settingsManager.settings.pressDoubleClick;
            settings.serverAutoconnect = settingsManager.settings.serverAutoconnect;
            settings.serverPassword = settingsManager.settings.serverPassword;
            settings.serverPort = settingsManager.settings.serverPort;
            settings.serverSettings = settingsManager.settings.serverSettings;
            settings.serverUrl = settingsManager.settings.serverUrl;
            settings.serverWss = settingsManager.settings.serverWss;
            settings.showAllSections = settingsManager.settings.showAllSections;
            settings.showBossMonster = settingsManager.settings.showBossMonster;
            settings.showHiddenMonster = settingsManager.settings.showHiddenMonster;
            settings.showOnlyUnfinishedScenarios = settingsManager.settings.showOnlyUnfinishedScenarios;
            settings.statAnimations = settingsManager.settings.statAnimations;
            settings.theme = settingsManager.settings.theme;
            settings.tooltips = settingsManager.settings.tooltips;
            settings.wakeLock = settingsManager.settings.wakeLock;
            settings.zoom = settingsManager.settings.zoom;

            settingsManager.setSettings(Object.assign(new Settings(), settings));
            storageManager.write('settings', 'default', settingsManager.settings);
            setTimeout(() => {
              window.document.body.classList.remove('server-sync');
            }, 1);
          }
          gameManager.stateManager.serverError = false;
          break;
        case "permissions":
          gameManager.stateManager.permissions = message.payload as Permissions || undefined;
          gameManager.stateManager.permissionBackup = gameManager.stateManager.permissions && JSON.parse(JSON.stringify(gameManager.stateManager.permissions)) || undefined;
          gameManager.stateManager.updatePermissions();
          gameManager.stateManager.serverError = false;
          break;
        case "error":
          console.warn("[GHS] Error: ", message);
          if (message.message.startsWith("Permission(s) missing") || message.message.startsWith("invalid revision")) {
            if (gameManager.stateManager.lastAction == "redo" || gameManager.stateManager.lastAction == "update") {
              gameManager.stateManager.undo(false);
            } else if (gameManager.stateManager.lastAction == "undo") {
              gameManager.stateManager.redo(false);
            }
          }
          if (message.message && message.message.startsWith("Invalid password")) {
            console.warn("Disconnect...");
            ev.target?.close();
          }
          gameManager.stateManager.serverError = false;
          window.document.body.classList.remove('working');
          window.document.body.classList.remove('server-sync');
          break;
      }
    } catch (e) {
      gameManager.stateManager.errorLog.push(ev.data);
      gameManager.stateManager.serverError = true;
      console.error("[GHS] " + ev.data, e);
      window.document.body.classList.remove('working');
      window.document.body.classList.remove('server-sync');
    }
  }

  onOpen(ev: Event) {
    if (settingsManager.settings.logServerMessages) console.debug('WS opened', ev);
    const ws = ev.target as WebSocket;
    if (ws && ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword) {
      gameManager.stateManager.connectionTries = 0;
      gameManager.stateManager.updateBlocked = false;
      gameManager.stateManager.permissions = gameManager.stateManager.permissionBackup;
      let message = {
        "password": settingsManager.settings.serverPassword,
        "type": "request-game",
        "payload": gameManager.game.toModel(),
      }
      if (settingsManager.settings.logServerMessages) console.debug('WS sending request-game');
      ws.send(JSON.stringify(message));

      if (settingsManager.settings.serverSettings) {
        let message = {
          "password": settingsManager.settings.serverPassword,
          "type": "request-settings"
        }
        if (settingsManager.settings.logServerMessages) console.debug('WS sending request-settings');
        ws.send(JSON.stringify(message));
      }

      gameManager.stateManager.updatePermissions();
    }
  }

  onClose(ev: Event) {
    if (settingsManager.settings.logServerMessages) console.debug('WS closed', ev);
    gameManager.game.server = false;
    gameManager.stateManager.updateBlocked = true;
    gameManager.stateManager.serverVersion = "";
    gameManager.stateManager.permissions = new Permissions();
    gameManager.stateManager.updatePermissions();
    gameManager.uiChange.emit();
  }

  onError(ev: Event) {
    if (settingsManager.settings.logServerMessages) console.debug('WS error', ev);
    gameManager.game.server = false;
    gameManager.stateManager.updateBlocked = true;
    gameManager.stateManager.serverVersion = "";
    gameManager.stateManager.permissions = new Permissions();
    gameManager.stateManager.updatePermissions();
    gameManager.uiChange.emit();
  }

  forceUpdateState() {
    gameManager.stateManager.updateBlocked = false;
    gameManager.stateManager.permissions = gameManager.stateManager.permissionBackup;
    gameManager.stateManager.updatePermissions();
    gameManager.uiChange.emit();
  }

  requestSettings() {
    if (this.ws && this.ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword && settingsManager.settings.serverSettings) {
      let message = {
        "password": settingsManager.settings.serverPassword,
        "type": "request-settings"
      }
      if (settingsManager.settings.logServerMessages) console.debug('WS sending request-settings');
      this.ws.send(JSON.stringify(message));
    }
  }

  wsState(): number {
    if (settingsManager.settings.serverUrl && settingsManager.settings.serverPort && settingsManager.settings.serverPassword) {
      return this.ws && this.ws.readyState || -1;
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
  }

  saveLocal() {
    storageManager.writeGameModel(this.game.toModel());
    this.lastSaveTimestamp = new Date().getTime();
  }

  saveSettings() {
    if (this.ws && this.ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword && settingsManager.settings.serverSettings) {
      let message = {
        "password": settingsManager.settings.serverPassword,
        "type": "settings",
        "payload": settingsManager.settings
      }
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
        this.characterPermissions[figure.name + '|' + figure.edition] = !this.permissions || this.permissions && (this.permissions.characters || this.permissions.character.some((value) => value.name == figure.name && value.edition == figure.edition));
      }
    })

    if (gameManager.game.party.retirements) {
      gameManager.game.party.retirements.forEach((model) => {
        this.characterPermissions[model.name + '|' + model.edition] = !this.permissions || this.permissions && (this.permissions.characters || this.permissions.character.some((value) => value.name == model.name && value.edition == model.edition));
      })
    }

    this.monsterPermissions = {};
    gameManager.game.figures.forEach((figure) => {
      if (figure instanceof Monster) {
        this.monsterPermissions[figure.name + '|' + figure.edition] = !this.permissions || this.permissions && (this.permissions.monsters || this.permissions.monster.some((value) => value.name == figure.name && value.edition == figure.edition));
      }
    })
  }

  before(...info: string[]) {
    window.document.body.classList.add('working');
    this.addToUndo(info || []);
  }

  async after(timeout: number = 1, autoBackup: boolean = false, revisionChange: number = 1, type: string = "game", revision: number = 0, undolength: number = 1) {
    this.game.revision += revisionChange;
    this.saveLocal();
    if (this.ws && this.ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword) {
      window.document.body.classList.add('server-sync');
      let undoInfo = this.undoInfos[this.undos.length - 1];

      if (type == 'game-undo') {
        undoInfo = this.undoInfos[this.undos.length + undolength - 1];
      }

      let message = {
        "password": settingsManager.settings.serverPassword,
        "type": type,
        "payload": this.game.toModel(),
        "undoinfo": undoInfo,
        "revision": revision,
        "undolength": undolength
      }
      if (settingsManager.settings.logServerMessages) console.debug('WS sending ' + type);
      this.ws.send(JSON.stringify(message));
    }

    if (autoBackup || (settingsManager.settings.autoBackup > 0 && (this.game.revision + this.game.revisionOffset) % settingsManager.settings.autoBackup == 0)) {
      await this.autoBackup();
    }

    if (timeout && settingsManager.settings.animations) {
      setTimeout(() => {
        this.lastAction = "update";
        gameManager.uiChange.emit();
        window.document.body.classList.remove('working');
        window.document.body.classList.remove('server-sync');
      }, timeout);
    } else {
      this.lastAction = "update";
      gameManager.uiChange.emit();
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
      }, 100)
    } else {
      window.document.body.classList.add('working');
      window.document.body.classList.add('server-sync');
      try {
        let datadump: any = await storageManager.datadump();
        if (!filename) {
          filename = "ghs-autobackup-" + new Date().toISOString() + ".json";
        }

        if (!forceDownload && settingsManager.settings.autoBackupUrl && settingsManager.settings.autoBackupUrl.url) {
          try {
            this.backupError = undefined;
            let xhr = new XMLHttpRequest();
            xhr.open(settingsManager.settings.autoBackupUrl.method, settingsManager.settings.autoBackupUrl.url.replaceAll('{FILENAME}', filename), true, settingsManager.settings.autoBackupUrl.username, settingsManager.settings.autoBackupUrl.password);

            let data: string | FormData = JSON.stringify(datadump);
            if (settingsManager.settings.autoBackupUrl.fileUpload) {
              data = new FormData();
              data.append(filename, new File([JSON.stringify(datadump)], filename, { type: "application/json" }));
            } else {
              xhr.setRequestHeader("Content-Type", "application/json");
            }

            if (settingsManager.settings.autoBackupUrl.authorization) {
              xhr.setRequestHeader("Authorization", settingsManager.settings.autoBackupUrl.authorization);
            }

            xhr.send(data);

            xhr.addEventListener("error", (event) => {
              this.backupError = -1;
              console.warn("Could not post autobackup", settingsManager.settings.autoBackupUrl, event);
            });

            xhr.addEventListener("readystatechange", (event) => {
              if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status >= 400) {
                  this.backupError = xhr.status;
                  console.warn("Could not post autobackup", settingsManager.settings.autoBackupUrl, xhr.status, xhr.responseText);
                }
              }
            });
          } catch (error) {
            this.backupError = -1;
            console.warn("Could not post autobackup", settingsManager.settings.autoBackupUrl, error);
          }
        } else {
          let downloadButton = document.createElement('a');
          downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(datadump)));
          downloadButton.setAttribute('download', filename);
          document.body.appendChild(downloadButton);
          downloadButton.click();
          document.body.removeChild(downloadButton);
        }
      } catch {
        console.warn("Could not create autobackup");
      }
      window.document.body.classList.remove('working');
      window.document.body.classList.remove('server-sync');
    }
  }

  addToUndo(info: string[]) {
    if (this.game.toModel() != this.undos[this.undos.length - 1]) {
      this.undos.push(this.game.toModel());
      const maxUndos = storageManager.db ? settingsManager.settings.maxUndo : Math.min(settingsManager.settings.maxUndo, 50);
      if (this.undos.length > maxUndos) {
        this.undos.splice(0, this.undos.length - maxUndos);
      }

      this.undoInfos.splice(this.undoInfos.length - this.redos.length, this.redos.length);

      this.undoInfos.push(info);

      if (this.undoInfos.length > this.undos.length) {
        this.undoInfos.splice(0, this.undoInfos.length - this.undos.length);
      }

      if (this.redos.length > 5) {
        storageManager.addBackup(this.redos[0]);
      }

      this.redos = [];

      this.saveStorage();
    }
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
        gameManager.uiChange.emit();
      }
      this.lastAction = "undo";
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
        gameManager.uiChange.emit();
      }
      this.lastAction = "undo";
    }
  }

  clearUndos() {
    this.undoInfos.splice(0, this.undoInfos.length - this.redos.length);
    this.undos = [];
    this.saveStorage();
  }

  clearRedos() {
    this.undoInfos.splice(this.undos.length, this.undoInfos.length);
    this.redos = [];
    this.saveStorage();
  }

  savePermissions(password: string, permissions: Permissions | undefined) {
    if (this.ws && this.ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword) {
      let message = {
        "password": settingsManager.settings.serverPassword,
        "type": "permissions",
        "payload": {
          "permissions": permissions,
          "password": password
        }
      }
      if (settingsManager.settings.logServerMessages) console.debug(`WS sending permissions`);
      this.ws.send(JSON.stringify(message));
    }
  }
}