import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntity, findFigure } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { Summon } from 'src/app/game/model/Summon';

export class EntitySpecialActionCommand extends CommandImpl {
  id: string = 'entity.specialAction';
  requiredParameters: number = 4;

  validParameters(figureId: string | number, entityId: string | number, name: string, value: boolean): boolean {
    const figure = findFigure(figureId);
    const entity = findEntity(figure, entityId);
    return (
      typeof value === 'boolean' &&
      figure instanceof Character &&
      !!entity &&
      !!figure.specialActions &&
      figure.specialActions.some(
        (specialAction) =>
          specialAction.name === name &&
          !specialAction.noTag &&
          (!specialAction.level || specialAction.level <= figure.level) &&
          ((entity instanceof Character && !specialAction.summon) || (entity instanceof Summon && specialAction.summon))
      )
    );
  }

  executeWithParameters(figureId: string | number, entityId: string | number, name: string, value: boolean) {
    const character = findFigure(figureId);
    const entity = findEntity(character, entityId);
    if (character instanceof Character && entity) {
      if (entity.tags.includes(name) === value) {
        return;
      }
      if (!value) {
        gameManager.specialActionsManager.removeSpecialAction(entity, character, name);
      } else {
        gameManager.specialActionsManager.addSpecialAction(entity, character, name);
      }
    } else {
      this.executionError('entity not found');
    }
  }
}
