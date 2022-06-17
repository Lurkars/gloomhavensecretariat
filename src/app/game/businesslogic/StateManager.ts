import { Game, GameModel } from "../model/Game";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class StateManager {

  game: Game;
  ws: WebSocket | undefined;

  constructor(game: Game) {
    this.game = game;
  }

  init() {
    if (settingsManager.settings.serverHost && settingsManager.settings.serverPort && settingsManager.settings.serverPassword && settingsManager.settings.serverAutoconnect) {
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
    if (settingsManager.settings.serverHost && settingsManager.settings.serverPort && settingsManager.settings.serverPassword) {
      this.disconnect();
      const protocol = settingsManager.settings.serverWss ? "wss://" : "ws://";
      this.ws = new WebSocket(protocol + settingsManager.settings.serverHost + ":" + settingsManager.settings.serverPort);
      this.ws.onmessage = this.onMessage;
      this.ws.onopen = this.request;
    }
  }

  disconnect() {
    if (this.ws && this.ws.readyState != WebSocket.CLOSED) {
      this.ws.close();
    }
  }

  onMessage(ev: MessageEvent<any>): any {
    try {
      console.debug("[GHS] " + "WS receive", ev.data);
      let gameModel: GameModel = JSON.parse(ev.data);
      gameManager.stateManager.addToUndo();
      gameManager.game.fromModel(gameModel);
      gameManager.stateManager.saveLocal(0);
    } catch (e) {
      console.error("[GHS] " + ev.data);
    }
  }

  request(ev: Event) {
    const ws = ev.target as WebSocket;
    if (ws && ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword) {
      let message = {
        "password": settingsManager.settings.serverPassword,
        "type": "request"
      }
      console.debug("[GHS] " + "WS send", JSON.stringify(message));
      ws.send(JSON.stringify(message));
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
      console.debug("[GHS] " + "WS send", JSON.stringify(message));
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