import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { ElementModel, ElementState } from 'src/app/game/model/data/Element';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { Game, GameState } from 'src/app/game/model/Game';

export class ElementManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  nextElementState(element: ElementModel, double: boolean = false, draw: boolean = false): ElementState {
    if (gameManager.bbRules()) {
      if (element.state !== ElementState.strong) {
        return ElementState.strong;
      } else {
        return ElementState.inert;
      }
    }

    if (this.game.state === GameState.draw || draw) {
      if (element.state === ElementState.new) {
        if (!double) {
          return ElementState.strong;
        }
      }
      if (element.state === ElementState.new || element.state === ElementState.strong) {
        if (!double) {
          return ElementState.waning;
        }
      } else if (element.state === ElementState.waning) {
        return ElementState.inert;
      } else {
        if (double) {
          return ElementState.waning;
        } else {
          return ElementState.new;
        }
      }
    } else {
      if (element.state === ElementState.new) {
        if (!double) {
          return ElementState.strong;
        }
      }
      if (element.state === ElementState.strong) {
        if (double) {
          return ElementState.waning;
        }
      } else if (element.state === ElementState.waning) {
        if (double) {
          return ElementState.new;
        }
      } else {
        if (double) {
          return ElementState.waning;
        } else {
          return ElementState.new;
        }
      }
    }

    return ElementState.inert;
  }

  applyElementState(element: ElementModel, elementState: ElementState) {
    element.state = elementState;
    if (elementState === ElementState.new) {
      const activeFigure = this.game.figures.find((figure) => figure.active);
      if (activeFigure instanceof Character) {
        gameManager.personalQuestManager.trackPersonalQuestProgress(activeFigure, PersonalQuestAutotrackType.element, element.type);
      }
    }
  }
}
