import { Game, GameModel } from "../model/Game";
import { Settings } from "../model/Settings";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class StateManager {

  game: Game;
  ws: WebSocket | undefined;

  constructor(game: Game) {
    this.game = game;
  }

  init() {
    if (settingsManager.settings.serverUrl && settingsManager.settings.serverPort && settingsManager.settings.serverPassword && settingsManager.settings.serverAutoconnect) {
      this.connect();
    } else {
      const local: string | null = localStorage.getItem("ghs-game");
      if (local != null) {
        const gameModel: GameModel = Object.assign(new GameModel(), JSON.parse(local));
        this.game.fromModel(gameModel);
      } else {
        localStorage.setItem("ghs-game", JSON.stringify(this.game.toModel()));
      }
    }
  }

  connect() {
    if (settingsManager.settings.serverUrl && settingsManager.settings.serverPort && settingsManager.settings.serverPassword) {
      this.disconnect();
      const protocol = settingsManager.settings.serverWss ? "wss://" : "ws://";
      let urls = settingsManager.settings.serverUrl.split("/");
      const url = urls[ 0 ];
      let path = "/";
      if (urls.length > 1) {
        path = path + urls.splice(1, urls.length).join("/");
      }
      this.ws = new WebSocket(protocol + url + ":" + settingsManager.settings.serverPort + path);
      this.ws.onmessage = this.onMessage;
      this.ws.onopen = this.onOpen;
    }
  }

  disconnect() {
    if (this.ws && this.ws.readyState != WebSocket.CLOSED) {
      this.ws.close();
    }
  }

  onMessage(ev: MessageEvent<any>): any {
    try {
      const message: any = JSON.parse(ev.data);
      switch (message.type) {
        case "game":
          let gameModel: GameModel = message.payload as GameModel;
          gameManager.stateManager.addToUndo();
          gameManager.game.fromModel(gameModel);
          gameManager.stateManager.saveLocal(0);
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
        case "error":
          console.warn("[GHS] Error: " + message.message);
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
    return this.ws?.readyState || -1;
  }

  reset() {
    this.game = new Game();
    localStorage.removeItem("ghs-game");
    localStorage.removeItem("ghs-undo");
    localStorage.removeItem("ghs-redo");
  }

  addToUndo() {
    window.document.body.classList.add('working');
    let undo: GameModel[] = [];
    const undoString: string | null = localStorage.getItem("ghs-undo");
    if (undoString != null) {
      undo = JSON.parse(undoString);
    }

    undo.push(this.game.toModel());

    localStorage.setItem("ghs-undo", JSON.stringify(undo));
    localStorage.setItem("ghs-redo", "[]");
  }

  saveLocal(timeout: number = 0) {
    window.document.body.classList.add('working');
    localStorage.setItem("ghs-game", JSON.stringify(this.game.toModel()));
    if (timeout) {
      setTimeout(() => {
        window.document.body.classList.remove('working');
      }, timeout);
    } else {
      window.document.body.classList.remove('working');
    }
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

  before() {
    this.addToUndo();
  }

  after(timeout: number = 0) {
    this.saveLocal(timeout);
    if (this.ws && this.ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword) {
      let message = {
        "password": settingsManager.settings.serverPassword,
        "type": "game",
        "payload": this.game.toModel()
      }
      this.ws.send(JSON.stringify(message));
    }
  }

  hasUndo(): boolean {
    const undoString: string | null = localStorage.getItem("ghs-undo");
    return undoString != null && undoString != "[]";
  }

  undo() {
    window.document.body.classList.add('working');
    let redo: GameModel[] = [];
    const redoString: string | null = localStorage.getItem("ghs-redo");

    if (redoString != null) {
      redo = JSON.parse(redoString);
    }

    let undo: GameModel[] = [];
    const undoString: string | null = localStorage.getItem("ghs-undo");
    if (undoString != null) {
      undo = JSON.parse(undoString);

      if (undo.length > 0) {
        redo.push(this.game.toModel());
        const gameModel: GameModel = undo.splice(undo.length - 1, 1)[ 0 ];
        this.game.fromModel(gameModel);
      }
    }

    localStorage.setItem("ghs-redo", JSON.stringify(redo));
    localStorage.setItem("ghs-undo", JSON.stringify(undo));
    this.after();
  }

  hasRedo(): boolean {
    const redoString: string | null = localStorage.getItem("ghs-redo");
    return redoString != null && redoString != "[]";
  }

  redo() {
    window.document.body.classList.add('working');
    let undo: GameModel[] = [];
    const undoString: string | null = localStorage.getItem("ghs-undo");

    if (undoString != null) {
      undo = JSON.parse(undoString);
    }

    let redo: GameModel[] = [];
    const redoString: string | null = localStorage.getItem("ghs-redo");
    if (redoString != null) {
      redo = JSON.parse(redoString);

      if (redo.length > 0) {
        undo.push(this.game.toModel());
        const gameModel: GameModel = redo.splice(redo.length - 1, 1)[ 0 ];
        this.game.fromModel(gameModel);
      }
    }

    localStorage.setItem("ghs-redo", JSON.stringify(redo));
    localStorage.setItem("ghs-undo", JSON.stringify(undo));
    this.after();
  }

}