import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntity, findFigure } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';

export class EntitySpecialActionCommand extends CommandImpl {
  id: string = 'entity.specialAction';
  requiredParameters: number = 4;

  validParameters(figureId: string | number, entityId: string | number, name: string, value: boolean): boolean {
    const figure = findFigure(figureId);
    const entity = findEntity(figure, entityId);
    return figure instanceof Character && !!entity && gameManager.specialActionsManager.canSetSpecialAction(figure, entity, name, value);
  }

  executeWithParameters(figureId: string | number, entityId: string | number, name: string, value: boolean) {
    const character = findFigure(figureId);
    const entity = findEntity(character, entityId);
    if (
      !(character instanceof Character) ||
      !entity ||
      !gameManager.specialActionsManager.setSpecialAction(character, entity, name, value)
    ) {
      this.executionError('special action not changeable');
    }
  }
}
