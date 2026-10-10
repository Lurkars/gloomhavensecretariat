import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { Element, ElementModel, ElementState } from 'src/app/game/model/data/Element';

export class ElementStateCommand extends CommandImpl {
  id: string = 'element.state';
  requiredParameters: number = 2;

  element(type: BASE_TYPE): ElementModel | undefined {
    return gameManager.game.elementBoard.find((element) => element.type === type);
  }

  validParameters(type: string, state: string): boolean {
    return (
      Object.values(Element).includes(type as Element) &&
      !!this.element(type) &&
      Object.values(ElementState).includes(state as ElementState)
    );
  }

  executeWithParameters(type: string, state: ElementState) {
    const element = this.element(type);
    if (element) {
      gameManager.applyElementState(element, state);
    } else {
      this.executionError('element not found');
    }
  }
}
