import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { Element, ElementModel } from 'src/app/game/model/data/Element';

export class ElementToggleCommand extends CommandImpl {
  id: string = 'element.toggle';
  requiredParameters: number = 1;
  elements: Element[] = [Element.fire, Element.ice, Element.air, Element.earth, Element.light, Element.dark];

  constructor(...parameters: BASE_TYPE[]) {
    super(...parameters);
  }

  validParameters(element: number): boolean {
    return element > 0 && element < 7;
  }

  executeWithParameters(element: number) {
    const elementType = this.elements[element - 1];
    const elementModel = gameManager.game.elementBoard.find((value) => value.type === elementType);
    if (elementModel) {
      gameManager.applyElementState(elementModel, gameManager.nextElementState(elementModel));
    }
  }

  override before(): BASE_TYPE[] {
    const elementModel = new ElementModel(this.elements[(this.parameters[0] as number) - 1]);
    const elementState = gameManager.nextElementState(elementModel);
    return ['updateElement', 'game.element.' + elementModel.type, 'game.element.state.' + elementState];
  }
}
