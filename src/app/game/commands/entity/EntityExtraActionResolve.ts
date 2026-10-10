import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntity, findFigure } from 'src/app/game/commands/CommandHelper';
import { extraActionIndex, extraActions, setExtraActions } from 'src/app/game/commands/entity/EntityExtraActionRemove';
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
    return !!entity && typeof accept === 'boolean' && extraActionIndex(entity, ActionType.extra, value, persistent) !== -1;
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
      const index = extraActionIndex(entity, ActionType.extra, value, persistent);
      const action = extraActions(entity, persistent)[index];
      const actions = extraActions(entity, persistent).filter((other, i) => i !== index);
      if (accept && action.subActions) {
        actions.push(...action.subActions);
      }
      setExtraActions(entity, actions, persistent);
    } else {
      this.executionError('entity not found');
    }
  }
}
