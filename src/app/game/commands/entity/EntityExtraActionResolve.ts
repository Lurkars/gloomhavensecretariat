import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntity, findFigure } from 'src/app/game/commands/CommandHelper';
import { ActionType } from 'src/app/game/model/data/Action';

export class EntityExtraActionResolveCommand extends CommandImpl {
  id: string = 'entity.extraAction.resolve';
  requiredParameters: number = 4;

  validParameters(
    figureId: string | number,
    entityId: string | number,
    value: string | number,
    accept: boolean,
    persistent: boolean = false
  ): boolean {
    const entity = findEntity(findFigure(figureId), entityId);
    return (
      !!entity &&
      typeof accept === 'boolean' &&
      gameManager.actionsManager.canResolveExtraAction(
        entity,
        gameManager.actionsManager.extraActionIndex(entity, ActionType.extra, value, !!persistent),
        !!persistent
      )
    );
  }

  executeWithParameters(
    figureId: string | number,
    entityId: string | number,
    value: string | number,
    accept: boolean,
    persistent: boolean = false
  ) {
    const entity = findEntity(findFigure(figureId), entityId);
    if (entity) {
      gameManager.actionsManager.resolveExtraAction(
        entity,
        gameManager.actionsManager.extraActionIndex(entity, ActionType.extra, value, !!persistent),
        accept,
        !!persistent
      );
    } else {
      this.executionError('entity not found');
    }
  }
}
