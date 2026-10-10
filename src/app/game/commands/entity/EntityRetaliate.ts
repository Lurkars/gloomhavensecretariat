import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure, isAllEntities } from 'src/app/game/commands/CommandHelper';
import {
  createRetaliateAction,
  retaliateActions,
  setRetaliateActions,
  shieldRetaliateEnabled
} from 'src/app/game/commands/entity/shieldRetaliate';
import { Action } from 'src/app/game/model/data/Action';

export class EntityRetaliateCommand extends CommandImpl {
  id: string = 'entity.retaliate';
  requiredParameters: number = 4;

  retaliate(): Action[] {
    const retaliate: Action[] = [];
    for (let i = 3; i < this.parameters.length; i += 2) {
      retaliate.push(createRetaliateAction(this.parameters[i] as number, (this.parameters[i + 1] as number) || 1));
    }
    return retaliate;
  }

  validParameters(figureId: string | number, entityId: string | number, persistent: boolean, ...values: number[]): boolean {
    return (
      values.every((value) => typeof value === 'number') &&
      values.filter((value, index) => index % 2 === 1).every((range) => range > 0) &&
      findEntities(findFigure(figureId), entityId).some((entity) => shieldRetaliateEnabled(entity))
    );
  }

  executeWithParameters(figureId: string | number, entityId: string | number, persistent: boolean) {
    const entities = findEntities(findFigure(figureId), entityId);
    if (entities.length) {
      const retaliate = this.retaliate();
      entities
        .filter((entity) => shieldRetaliateEnabled(entity))
        .forEach((entity) =>
          setRetaliateActions(
            entity,
            persistent,
            retaliate,
            isAllEntities(findFigure(figureId), entityId) && retaliateActions(entity, persistent).length > 0
          )
        );
    } else {
      this.executionError('entity not found');
    }
  }
}
