import { Game, GameModel } from "../model/Game";

export class StateManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  reset() {
    this.game = new Game();
    localStorage.removeItem("ghs-game");
    localStorage.removeItem("ghs-undo");
    localStorage.removeItem("ghs-redo");
  }

  before() {
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

  after(timeout: number = 0) {
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