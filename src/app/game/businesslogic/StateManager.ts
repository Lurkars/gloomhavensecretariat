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
          let gameModel: GameModel = message.payload as GameModel;
          gameManager.stateManager.before();
          gameManager.game.fromModel(gameModel, true);
          gameManager.stateManager.saveLocal();
          gameManager.uiChange.emit();
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

  addToUndo(info: string[]) {
    window.document.body.classList.add('working');
    if (JSON.stringify(this.game.toModel()) != localStorage.getItem("ghs-game")) {
      let undos = [];
      const undoString: string | null = localStorage.getItem("ghs-undo");
      if (undoString != null) {
        undos = JSON.parse(undoString);
      }
      let redos = [];
      const redoString: string | null = localStorage.getItem("ghs-redo");
      if (redoString != null) {
        redos = JSON.parse(redoString);
      }
      let undoInfos = [];
      const undoInfosString: string | null = localStorage.getItem("ghs-undo-infos");
      if (undoInfosString != null) {
        undoInfos = JSON.parse(undoInfosString);
      }

      undos.push(this.game.toModel());

      if (undos.length > settingsManager.settings.maxUndo) {
        undos.splice(0, undos.length - settingsManager.settings.maxUndo);
      }
      undoInfos.splice(undoInfos.length - redos.length, redos.length);
      undoInfos.push(info);

      localStorage.setItem("ghs-undo", JSON.stringify(undos));
      localStorage.setItem("ghs-undo-infos", JSON.stringify(undoInfos));
      localStorage.setItem("ghs-redo", JSON.stringify([]));

      if (settingsManager.settings.browserNavigation) {
        // TODO: push state
      }
    }
  }

  saveLocal() {
    window.document.body.classList.add('working');
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

  hasUndo(): boolean {      
    let undos = [];
    const undoString: string | null = localStorage.getItem("ghs-undo");
    if (undoString != null) {
      undos = JSON.parse(undoString);
    }
    return undos.length > 0;
  }

  undo() {
    window.document.body.classList.add('working');
    let undos = [];
    const undoString: string | null = localStorage.getItem("ghs-undo");
    if (undoString != null) {
      undos = JSON.parse(undoString);
    }
    let redos = [];
    const redoString: string | null = localStorage.getItem("ghs-redo");
    if (redoString != null) {
      redos = JSON.parse(redoString);
    }
    if (undos.length > 0) {
      redos.push(this.game.toModel());
      const gameModel: GameModel = undos.splice(undos.length - 1, 1)[ 0 ];
      this.game.fromModel(gameModel);
    }
    localStorage.setItem("ghs-redo", JSON.stringify(redos));
    localStorage.setItem("ghs-undo", JSON.stringify(undos));
    this.after();
  }

  hasRedo(): boolean {      
    let redos = [];
    const redoString: string | null = localStorage.getItem("ghs-redo");
    if (redoString != null) {
      redos = JSON.parse(redoString);
    }
    return redos.length > 0;
  }

  redo() {      
    let undos = [];
    const undoString: string | null = localStorage.getItem("ghs-undo");
    if (undoString != null) {
      undos = JSON.parse(undoString);
    }
    let redos = [];
    const redoString: string | null = localStorage.getItem("ghs-redo");
    if (redoString != null) {
      redos = JSON.parse(redoString);
    }
    window.document.body.classList.add('working');
    if (redos.length > 0) {
      undos.push(this.game.toModel());
      const gameModel: GameModel = redos.splice(redos.length - 1, 1)[ 0 ];
      this.game.fromModel(gameModel);
    }

    localStorage.setItem("ghs-redo", JSON.stringify(redos));
    localStorage.setItem("ghs-undo", JSON.stringify(undos));
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