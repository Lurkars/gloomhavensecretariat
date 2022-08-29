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

  constructor(game: Game) {
    this.game = game;
    this.lastSaveTimestamp = new Date().getTime();
  }

  init() {
    const local: string | null = localStorage.getItem("ghs-game");
    if (local != null) {
      const gameModel: GameModel = Object.assign(new GameModel(), JSON.parse(local));
      this.game.fromModel(gameModel);
      gameManager.uiChange.emit();
    } else {
      localStorage.setItem("ghs-game", JSON.stringify(this.game.toModel()));
    }

    if (settingsManager.settings.serverUrl && settingsManager.settings.serverPort && settingsManager.settings.serverPassword && settingsManager.settings.serverAutoconnect) {
      this.connect();
    }

    window.addEventListener('popstate', ((event: any) => {
      if (settingsManager.settings.browserNavigation) {
        // TODO: undo/redo on state
      }
    }))

    this.undos = [];
    const undoString: string | null = localStorage.getItem("ghs-undo");
    if (undoString != null) {
      this.undos = JSON.parse(undoString);
    }
    this.redos = [];
    const redoString: string | null = localStorage.getItem("ghs-redo");
    if (redoString != null) {
      this.redos = JSON.parse(redoString);
    }
    this.undoInfos = [];
    const undoInfosString: string | null = localStorage.getItem("ghs-undo-infos");
    if (undoInfosString != null) {
      this.undoInfos = JSON.parse(undoInfosString);
    }

    // migration
    const missingUndoInfos = this.undos.length + this.redos.length - this.undoInfos.length;
    for (let i = 0; i < missingUndoInfos; i++) {
      this.undoInfos.unshift([]);
    }
  }

  buildWsUrl(protocol: string, serverUrl: string, port: number | string) {
    let urls = serverUrl.split("/");
    const url = urls[ 0 ];
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
          let gameModel: GameModel = message.payload as GameModel;
          gameManager.stateManager.before("serverSync");
          gameManager.game.fromModel(gameModel, true);
          gameManager.stateManager.saveLocal();
          gameManager.uiChange.emit();
          setTimeout(() => {
            window.document.body.classList.remove('working');
          }, 1);
          break;
        case "settings":
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

            settingsManager.settings = settings;
            localStorage.setItem("ghs-settings", JSON.stringify(settingsManager.settings));
          }
          break;
        case "permissions":
          gameManager.stateManager.permissions = message.payload as Permissions || undefined;
          break;
        case "error":
          console.warn("[GHS] Error: " + message.message);
          if (message.message == "Permission(s) missing") {
            gameManager.stateManager.undo();
          }
          if (message.message.startsWith("Invalid password")) {
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
        "type": "request-game"
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
    this.game = new Game();
    localStorage.removeItem("ghs-game");
    localStorage.removeItem("ghs-undo");
    localStorage.removeItem("ghs-undo-infos");
    localStorage.removeItem("ghs-redo");
  }

  saveLocal() {
    localStorage.setItem("ghs-game", JSON.stringify(this.game.toModel()));
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
    this.saveLocal();
    if (this.ws && this.ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword) {
      let message = {
        "password": settingsManager.settings.serverPassword,
        "type": "game",
        "payload": this.game.toModel()
      }
      this.ws.send(JSON.stringify(message));
    }

    this.lastSaveTimestamp = new Date().getTime();
    gameManager.uiChange.emit();

    if (timeout) {
      setTimeout(() => {
        window.document.body.classList.remove('working');
      }, timeout);
    } else {
      window.document.body.classList.remove('working');
    }
  }

  addToUndo(info: string[]) {
    if (this.game.toModel() != this.undos[ this.undos.length - 1 ]) {
      this.undos.push(this.game.toModel());

      if (this.undos.length > settingsManager.settings.maxUndo) {
        this.undos.splice(0, this.undos.length - settingsManager.settings.maxUndo);
      }
      this.undoInfos.splice(this.undoInfos.length - this.redos.length, this.redos.length);
      this.undoInfos.push(info);

      this.redos = [];

      localStorage.setItem("ghs-undo", JSON.stringify(this.undos));
      localStorage.setItem("ghs-undo-infos", JSON.stringify(this.undoInfos));
      localStorage.setItem("ghs-redo", JSON.stringify([]));

      if (settingsManager.settings.browserNavigation) {
        // TODO: push state
      }
    }
  }

  hasUndo(): boolean {
    return this.undos.length > 0;
  }

  undo() {
    window.document.body.classList.add('working');
    if (this.undos.length > 0) {
      this.redos.push(this.game.toModel());
      const gameModel: GameModel = this.undos.splice(this.undos.length - 1, 1)[ 0 ];
      this.game.fromModel(gameModel);
    }
    localStorage.setItem("ghs-redo", JSON.stringify(this.redos));
    localStorage.setItem("ghs-undo", JSON.stringify(this.undos));
    this.after();
  }

  hasRedo(): boolean {
    return this.redos.length > 0;
  }

  redo() {
    window.document.body.classList.add('working');
    if (this.redos.length > 0) {
      this.undos.push(this.game.toModel());
      const gameModel: GameModel = this.redos.splice(this.redos.length - 1, 1)[ 0 ];
      this.game.fromModel(gameModel);
    }

    localStorage.setItem("ghs-redo", JSON.stringify(this.redos));
    localStorage.setItem("ghs-undo", JSON.stringify(this.undos));
    this.after();
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