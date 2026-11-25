import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntity, findFigure } from 'src/app/game/commands/CommandHelper';

export class EntityExtraActionRemoveCommand extends CommandImpl {
  id: string = 'entity.extraAction.remove';
  requiredParameters: number = 4;

  validParameters(
    figureId: string | number,
    entityId: string | number,
    type: string,
    value: string | number,
    persistent: boolean = false
  ): boolean {
    const entity = findEntity(findFigure(figureId), entityId);
    return (
      !!entity &&
      gameManager.actionsManager.canRemoveExtraAction(
        entity,
        gameManager.actionsManager.extraActionIndex(entity, type, value, !!persistent),
        !!persistent
      )
    );
  }

  executeWithParameters(
    figureId: string | number,
    entityId: string | number,
    type: string,
    value: string | number,
    persistent: boolean = false
  ) {
    const entity = findEntity(findFigure(figureId), entityId);
    if (entity) {
      gameManager.actionsManager.removeExtraAction(
        entity,
        gameManager.actionsManager.extraActionIndex(entity, type, value, !!persistent),
        !!persistent
      );
    } else {
      this.executionError('entity not found');
    }
  }
}
