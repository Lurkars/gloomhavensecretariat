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
      gameManager.uiChange.emit();
    } else {
      localStorage.setItem("ghs-game", JSON.stringify(this.game.toModel()));
    }

    if (settingsManager.settings.serverUrl && settingsManager.settings.serverPort && settingsManager.settings.serverPassword && settingsManager.settings.serverAutoconnect) {
      this.connect();
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
  }

  async install() {
    if (this.installPrompt) {
      this.installPrompt.prompt();
      const outcome = await gameManager.stateManager.installPrompt.userChoice;
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
      const protocol = settingsManager.settings.serverWss ? "wss://" : "ws://";
      this.ws = new WebSocket(this.buildWsUrl(protocol, settingsManager.settings.serverUrl, settingsManager.settings.serverPort));
      this.ws.onmessage = this.onMessage;
      this.ws.onopen = this.onOpen;
      this.ws.onclose = this.onClose;
    }
  }

  disconnect() {
    this.permissions = undefined;
    if (this.ws && this.ws.readyState != WebSocket.CLOSED) {
      this.ws.close();
    }
  }

  onMessage(ev: any): any {
    try {
      const message: any = JSON.parse(ev.data);
      switch (message.type) {
        case "game":
          window.document.body.classList.add('working');
          window.document.body.classList.add('server-sync');
          let gameModel: GameModel = message.payload as GameModel;
          const undoinfo = message.undoinfo;
          if (undoinfo) {
            if (undoinfo.length > 0 && undoinfo[0] == "serverSync") {
              gameManager.stateManager.before("serverSync", ...undoinfo.slice(1));
            } else {
              gameManager.stateManager.before("serverSync", ...undoinfo);
            }
          }
          if (gameManager.game.revision > gameModel.revision) {
            localStorage.setItem("ghs-game-rev." + gameManager.game.revision, JSON.stringify(gameManager.game.toModel()));
            console.warn("An older revision was loaded from server, created a backup of previous state.");
          }
          gameManager.game.fromModel(gameModel, true);
          gameManager.stateManager.saveLocal();
          gameManager.uiChange.emit();
          setTimeout(() => {
            window.document.body.classList.remove('working');
            window.document.body.classList.remove('server-sync');
          }, 1);
          break;
        case "settings":
          window.document.body.classList.add('server-sync');
          if (settingsManager.settings.serverSettings) {
            let settings: Settings = message.payload as Settings;

            if (!settings.serverUrl) {
              settings.serverUrl = settingsManager.settings.serverUrl;
            }
            if (!settings.serverPort) {
              settings.serverPort = settingsManager.settings.serverPort;
            }
            if (!settings.serverPassword) {
              settings.serverPassword = settingsManager.settings.serverPassword;
            }
            if (!settings.serverSettings) {
              settings.serverSettings = settingsManager.settings.serverSettings;
            }

            settingsManager.setSettings(settings);
            localStorage.setItem("ghs-settings", JSON.stringify(settingsManager.settings));
            setTimeout(() => {
              window.document.body.classList.remove('server-sync');
            }, 1);
          }
          break;
        case "permissions":
          gameManager.stateManager.permissions = message.payload as Permissions || undefined;
          break;
        case "requestUpdate":
          gameManager.stateManager.after();
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
          break;
      }
    } catch (e) {
      console.error("[GHS] " + ev.data, e);
    }
  }

  onOpen(ev: Event) {
    const ws = ev.target as WebSocket;
    if (ws && ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword) {
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
    }
  }

  onClose(ev: Event) {
    gameManager.game.server = false;
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

  before(...info: string[]) {
    window.document.body.classList.add('working');
    this.addToUndo(info || []);
  }

  after(timeout: number = 1) {
    this.game.revision++;
    this.saveLocal();
    if (this.ws && this.ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword) {
      window.document.body.classList.add('server-sync');
      let message = {
        "password": settingsManager.settings.serverPassword,
        "type": "game",
        "payload": this.game.toModel(),
        "undoinfo": this.undoInfos[this.undos.length - 1]
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
      const gameModel: GameModel = this.undos.splice(this.undos.length - 1, 1)[0];
      this.game.fromModel(gameModel);
      this.game.revision = revision;
      this.saveLocalStorage();
      if (sync) {
        this.after();
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
      const gameModel: GameModel = this.redos.splice(this.redos.length - 1, 1)[0];
      this.game.fromModel(gameModel);
      this.game.revision = revision;
      this.saveLocalStorage();
      if (sync) {
        this.after();
      } else {
        gameManager.uiChange.emit();
      }
      this.lastAction = "undo";
    }
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

  hasCharacterPermission(character: Character): boolean {
    return this.permissions == undefined || this.permissions.characters || this.permissions.character.some((value) => value.name == character.name && value.edition == character.edition);
  }

  hasMonsterPermission(monster: Monster): boolean {
    return this.permissions == undefined || this.permissions.monsters || this.permissions.monster.some((value) => value.name == monster.name && value.edition == monster.edition);
  }
}