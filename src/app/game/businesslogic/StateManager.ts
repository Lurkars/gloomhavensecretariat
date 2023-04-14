import { Character } from "../model/Character";
import { Game, GameModel } from "../model/Game";
import { Monster } from "../model/Monster";
import { Permissions } from "../model/Permissions";
import { Settings } from "../model/Settings";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

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
  permissionBackup: Permissions | undefined;
  connectionTries: number = 0;
  gameOffsetWarning: boolean = true;
  standeeDialogCanceled: boolean = false;

  undoPermission: boolean = false;
  redoPermission: boolean = false;
  characterPermissions: Record<string, boolean> = {};
  monsterPermissions: Record<string, boolean> = {};

  wakeLock: any = null;

  constructor(game: Game) {
    this.game = game;
    this.lastSaveTimestamp = new Date().getTime();
  }

  init() {
    const local: string | null = localStorage.getItem("ghs-game");
    if (local != null) {
      const gameModel: GameModel = Object.assign(new GameModel(), JSON.parse(local));
      gameModel.server = false;
      this.game.fromModel(gameModel);
    } else {
      localStorage.setItem("ghs-game", JSON.stringify(this.game.toModel()));
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


    if (settingsManager.settings.browserNavigation) {
      const currentState = +(localStorage.getItem("ghs-popstate") && typeof localStorage.getItem("ghs-popstate") == 'number' && localStorage.getItem("ghs-popstate") || '0');
      localStorage.setItem("ghs-popstate", '' + currentState);
      history.replaceState(currentState, '');
    }

    window.addEventListener('popstate', (event: PopStateEvent) => {
      if (settingsManager.settings.browserNavigation) {
        const oldState = +(localStorage.getItem("ghs-popstate") || '0');
        localStorage.setItem("ghs-popstate", event.state);
        if (oldState < event.state) {
          this.redo();
        } else if (oldState > event.state) {
          this.undo();
        }
      }
    })

    this.loadLocalStorage();

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

  loadLocalStorage() {
    this.undos = [];
    const undoString: string | null = localStorage.getItem("ghs-undo");
    if (undoString != null) {
      this.undos = JSON.parse(undoString);
      let count = 1;
      let additionalUndoString = localStorage.getItem("ghs-undo-" + count);
      while (additionalUndoString) {
        const additionalUndo: GameModel[] = JSON.parse(additionalUndoString);
        this.undos.push(...additionalUndo);
        count++;
        additionalUndoString = localStorage.getItem("ghs-undo-" + count);
      }
    }
    this.redos = [];
    const redoString: string | null = localStorage.getItem("ghs-redo");
    if (redoString != null) {
      this.redos = JSON.parse(redoString);
      let count = 1;
      let additionalRedoString = localStorage.getItem("ghs-redo-" + count);
      while (additionalRedoString) {
        const additionalRedo: GameModel[] = JSON.parse(additionalRedoString);
        this.redos.push(...additionalRedo);
        count++;
        additionalRedoString = localStorage.getItem("ghs-redo-" + count);
      }
    }
    this.undoInfos = [];
    const undoInfosString: string | null = localStorage.getItem("ghs-undo-infos");
    if (undoInfosString != null) {
      this.undoInfos = JSON.parse(undoInfosString);
      let count = 1;
      let additionalUndoInfosString = localStorage.getItem("ghs-undo-infos-" + count);
      while (additionalUndoInfosString) {
        const additionalUndoInfos: string[][] = JSON.parse(additionalUndoInfosString);
        this.undoInfos.push(...additionalUndoInfos);
        count++;
        additionalUndoInfosString = localStorage.getItem("ghs-undo-infos-" + count);
      }
    }
  }

  saveLocalStorage() {
    this.clearLocalStorage();
    let limit = 250;
    if (this.undos.length < limit) {
      localStorage.setItem("ghs-undo", JSON.stringify(this.undos));
    } else {
      let count = 1;
      localStorage.setItem("ghs-undo", JSON.stringify(this.undos.slice(0, limit)));
      while (this.undos.length > count * limit) {
        localStorage.setItem("ghs-undo-" + count, JSON.stringify(this.undos.slice(count * limit, count * limit + limit)));
        count++;
      }
    }
    if (this.redos.length < limit) {
      localStorage.setItem("ghs-redo", JSON.stringify(this.redos));
    } else {
      let count = 1;
      localStorage.setItem("ghs-redo", JSON.stringify(this.redos.slice(0, limit)));
      while (this.redos.length > count * limit) {
        localStorage.setItem("ghs-redo-" + count, JSON.stringify(this.redos.slice(count * limit, count * limit + limit)));
        count++;
      }
    }

    limit = 1000;
    if (this.undoInfos.length < limit) {
      localStorage.setItem("ghs-undo-infos", JSON.stringify(this.undoInfos));
    } else {
      let count = 1;
      localStorage.setItem("ghs-undo-infos", JSON.stringify(this.undoInfos.slice(0, limit)));
      while (this.undoInfos.length > count * limit) {
        localStorage.setItem("ghs-undo-infos-" + count, JSON.stringify(this.undoInfos.slice(count * limit, count * limit + limit)));
        count++;
      }
    }
  }

  clearLocalStorage() {
    let count = 1;
    localStorage.removeItem("ghs-undo");
    while (localStorage.getItem("ghs-undo-" + count)) {
      localStorage.removeItem("ghs-undo-" + count);
    }
    count = 1;
    localStorage.removeItem("ghs-redo");
    while (localStorage.getItem("ghs-redo-" + count)) {
      localStorage.removeItem("ghs-redo-" + count);
    }
    count = 1;
    localStorage.removeItem("ghs-undo-infos");
    while (localStorage.getItem("ghs-undo-infos-" + count)) {
      localStorage.removeItem("ghs-undo-infos-" + count);
    }
  }

  createBackup(gameModel: GameModel) {
    let count = 1;
    let backup = localStorage.getItem("ghs-game-backup-" + count);
    while (backup) {
      count++;
      backup = localStorage.getItem("ghs-game-backup-" + count);
    }
    localStorage.setItem("ghs-game-backup-" + count, JSON.stringify(gameModel));
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
      this.ws = new WebSocket(this.buildWsUrl(protocol, settingsManager.settings.serverUrl, settingsManager.settings.serverPort));
      this.ws.onmessage = this.onMessage;
      this.ws.onopen = this.onOpen;
      this.ws.onclose = this.onClose;
      this.ws.onerror = this.onError
    }
  }

  disconnect() {
    this.permissions = undefined;
    this.updatePermissions();
    if (this.ws && this.ws.readyState != WebSocket.CLOSED) {
      this.ws.close();
    }
  }

  onMessage(ev: any): any {
    try {
      const message: any = JSON.parse(ev.data);
      gameManager.stateManager.updateBlocked = false;
      switch (message.type) {
        case "game":
          window.document.body.classList.add('working');
          window.document.body.classList.add('server-sync');
          let gameModel: GameModel = message.payload as GameModel;
          if (gameManager.game.revision > gameModel.revision) {
            gameManager.stateManager.before();
            gameManager.stateManager.createBackup(gameManager.game.toModel());
            console.warn("An older revision was loaded from server, created a backup of previous state.");
            gameManager.stateManager.saveLocal();
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

          const undoGame = gameManager.stateManager.undos[gameManager.stateManager.undos.length - 1];
          if (undoGame && undoGame.revision - undoGame.revisionOffset == gameManager.game.revision - gameManager.game.revisionOffset - 1) {
            gameManager.stateManager.undos.splice(gameManager.stateManager.undos.length - 1, 1);
          } else {
            gameManager.stateManager.undoInfos.splice(gameManager.stateManager.undoInfos.length - gameManager.stateManager.redos.length, 0, message.undoinfo && ['serverSync', ...message.undoinfo] || ['serverSync']);
          }

          gameManager.stateManager.redos.push(gameManager.game.toModel());
          gameManager.game.fromModel(gameUndo);
          gameManager.stateManager.saveLocal();
          gameManager.stateManager.saveLocalStorage();
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

          const redoGame = gameManager.stateManager.redos.length > 0 ? gameManager.stateManager.redos[gameManager.stateManager.redos.length - 1] : undefined;
          if (redoGame && redoGame.revision - redoGame.revisionOffset == gameManager.game.revision - gameManager.game.revisionOffset + 1) {
            gameManager.stateManager.redos.splice(gameManager.stateManager.redos.length - 1, 1);
          } else {
            gameManager.stateManager.undoInfos.splice(gameManager.stateManager.undoInfos.length - gameManager.stateManager.redos.length, 0, message.undoinfo && ['serverSync', ...message.undoinfo] || ['serverSync']);
          }

          gameManager.stateManager.undos.push(gameManager.game.toModel());
          gameManager.game.fromModel(gameRedo);
          gameManager.stateManager.saveLocal();
          gameManager.stateManager.saveLocalStorage();
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
          gameManager.stateManager.after(1, 0, 'game-update');
          gameManager.stateManager.serverError = false;
          break;
        case "settings":
          window.document.body.classList.add('server-sync');
          if (settingsManager.settings.serverSettings) {
            let settings: Settings = message.payload as Settings;
            // keep local
            settings.automaticAttackModifierFullscreen = settingsManager.settings.automaticAttackModifierFullscreen;
            settings.autoscroll = settingsManager.settings.autoscroll;
            settings.barsize = settingsManager.settings.barsize;
            settings.browserNavigation = settingsManager.settings.browserNavigation;
            settings.debugRightClick = settingsManager.settings.debugRightClick;
            settings.disableAnimations = settingsManager.settings.disableAnimations;
            settings.disableColumns = settingsManager.settings.disableColumns;
            settings.disableWakeLock = settingsManager.settings.disableWakeLock;
            settings.dragValues = settingsManager.settings.dragValues;
            settings.fhStyle = settingsManager.settings.fhStyle;
            settings.fontsize = settingsManager.settings.fontsize;
            settings.fullscreen = settingsManager.settings.fullscreen;
            settings.pressDoubleClick = settingsManager.settings.pressDoubleClick;
            settings.serverAutoconnect = settingsManager.settings.serverAutoconnect;
            settings.serverPassword = settingsManager.settings.serverPassword;
            settings.serverPort = settingsManager.settings.serverPort;
            settings.serverSettings = settingsManager.settings.serverSettings;
            settings.serverUrl = settingsManager.settings.serverUrl;
            settings.serverWss = settingsManager.settings.serverWss;
            settings.theme = settingsManager.settings.theme;
            settings.zoom = settingsManager.settings.zoom;

            settingsManager.setSettings(settings);
            localStorage.setItem("ghs-settings", JSON.stringify(settingsManager.settings));
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
          console.warn("[GHS] Error: " + message.message);
          if (message.message == "Permission(s) missing" || message.message == "invalid revision") {
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
      ws.send(JSON.stringify(message));

      if (settingsManager.settings.serverSettings) {
        let message = {
          "password": settingsManager.settings.serverPassword,
          "type": "request-settings"
        }
        ws.send(JSON.stringify(message));
      }

      gameManager.stateManager.updatePermissions();
    }
  }

  onClose(ev: Event) {
    gameManager.game.server = false;
    gameManager.stateManager.updateBlocked = true;
    gameManager.stateManager.permissions = new Permissions();
    gameManager.stateManager.updatePermissions();
  }

  onError(ev: Event) {
    gameManager.game.server = false;
    gameManager.stateManager.updateBlocked = true;
    gameManager.stateManager.permissions = new Permissions();
    gameManager.stateManager.updatePermissions();
  }

  forceUpdateState() {
    gameManager.stateManager.updateBlocked = false;
    gameManager.stateManager.permissions = gameManager.stateManager.permissionBackup;
    gameManager.stateManager.updatePermissions();
  }

  requestSettings() {
    if (this.ws && this.ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword && settingsManager.settings.serverSettings) {
      let message = {
        "password": settingsManager.settings.serverPassword,
        "type": "request-settings"
      }
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
    this.createBackup(gameManager.game.toModel());
    const revision = this.game.revision;
    this.game = new Game();
    this.game.revision = revision;
    localStorage.removeItem("ghs-game");
    this.clearLocalStorage();
  }

  saveLocal() {
    localStorage.setItem("ghs-game", JSON.stringify(this.game.toModel()));
    this.lastSaveTimestamp = new Date().getTime();
  }

  saveSettings() {
    if (this.ws && this.ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword && settingsManager.settings.serverSettings) {
      let message = {
        "password": settingsManager.settings.serverPassword,
        "type": "settings",
        "payload": settingsManager.settings
      }
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

  after(timeout: number = 1, revisionChange: number = 1, type: string = "game") {
    this.game.revision += revisionChange;
    this.saveLocal();
    if (this.ws && this.ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword) {
      window.document.body.classList.add('server-sync');
      let undoInfo = this.undoInfos[this.undos.length - 1];

      if (type == 'game-undo') {
        undoInfo = this.undoInfos[this.undos.length];
      }

      let message = {
        "password": settingsManager.settings.serverPassword,
        "type": type,
        "payload": this.game.toModel(),
        "undoinfo": undoInfo
      }
      this.ws.send(JSON.stringify(message));
    }

    gameManager.uiChange.emit();

    if (timeout && !settingsManager.settings.disableAnimations) {
      setTimeout(() => {
        window.document.body.classList.remove('working');
        window.document.body.classList.remove('server-sync');
      }, timeout);
    } else {
      window.document.body.classList.remove('working');
      window.document.body.classList.remove('server-sync');
    }

    this.lastAction = "update";
  }

  addToUndo(info: string[]) {
    if (this.game.toModel() != this.undos[this.undos.length - 1]) {
      this.undos.push(this.game.toModel());

      if (this.undos.length > settingsManager.settings.maxUndo) {
        this.undos.splice(0, this.undos.length - settingsManager.settings.maxUndo);
      }

      this.undoInfos.splice(this.undoInfos.length - this.redos.length, this.redos.length);

      this.undoInfos.push(info);

      if (this.undoInfos.length > this.undos.length) {
        this.undoInfos.splice(0, this.undoInfos.length - this.undos.length);
      }

      if (this.redos.length > 5) {
        this.createBackup(this.redos[0]);
      }

      this.redos = [];

      this.saveLocalStorage();

      if (settingsManager.settings.browserNavigation) {
        const state = (typeof history.state == 'number') ? history.state + 1 : 1;
        history.pushState(state, '');
        localStorage.setItem("ghs-popstate", '' + state);
      }
    }
  }

  hasUndo(): boolean {
    return this.undos.length > 0;
  }

  undo(sync: boolean = true) {
    if (this.undos.length > 0) {
      window.document.body.classList.add('working');
      this.redos.push(this.game.toModel());
      const revision = gameManager.game.revision;
      const revisionOffset = gameManager.game.revisionOffset;
      const gameModel: GameModel = this.undos.splice(this.undos.length - 1, 1)[0];
      this.game.fromModel(gameModel);
      this.game.revision = revision;
      this.game.revisionOffset = revisionOffset + 2;
      this.saveLocalStorage();
      if (sync) {
        this.after(1, 1, 'game-undo');
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
    if (this.redos.length > 0) {
      window.document.body.classList.add('working');
      this.undos.push(this.game.toModel());
      const revision = gameManager.game.revision;
      const revisionOffset = gameManager.game.revisionOffset;
      const gameModel: GameModel = this.redos.splice(this.redos.length - 1, 1)[0];
      this.game.fromModel(gameModel);
      this.game.revision = revision;
      this.game.revisionOffset = revisionOffset;
      this.saveLocalStorage();
      if (sync) {
        this.after(1, 1, 'game-redo');
      } else {
        gameManager.uiChange.emit();
      }
      this.lastAction = "undo";
    }
  }

  revisionOffset(): number {
    return (gameManager.game.revisionOffset || 0) + this.revisionOffsetUndo() + this.revisionOffsetRedo();
  }

  revisionOffsetUndo(): number {
    return this.undos.length > 0 ? this.undos.map((model) => model.revisionOffset || 0).reduce((a, b) => a + b) : 0;
  }

  revisionOffsetRedo(): number {
    return this.redos.length > 0 ? this.redos.map((model) => model.revisionOffset || 0).reduce((a, b) => a + b) : 0;
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
      this.ws.send(JSON.stringify(message));
    }
  }
}