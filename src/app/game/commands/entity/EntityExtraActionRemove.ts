import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findEntity, findFigure } from 'src/app/game/commands/CommandHelper';
import { Action } from 'src/app/game/model/data/Action';
import { Entity } from 'src/app/game/model/Entity';

export function extraActions(entity: Entity, persistent: BASE_TYPE | undefined): Action[] {
  return persistent ? entity.extraActionsPersistent : entity.extraActions;
}

export function extraActionIndex(
  entity: Entity,
  type: BASE_TYPE | undefined,
  value: BASE_TYPE | undefined,
  persistent: BASE_TYPE | undefined
) {
  return extraActions(entity, persistent).findIndex((action) => action.type === type && '' + action.value === '' + value);
}

export function setExtraActions(entity: Entity, actions: Action[], persistent: BASE_TYPE | undefined) {
  if (persistent) {
    entity.extraActionsPersistent = actions;
  } else {
    entity.extraActions = actions;
  }
}

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
    return !!entity && extraActionIndex(entity, type, value, persistent) !== -1;
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
      const index = extraActionIndex(entity, type, value, persistent);
      setExtraActions(
        entity,
        extraActions(entity, persistent).filter((action, i) => i !== index),
        persistent
      );
    } else {
      this.executionError('entity not found');
    }
  }
}
