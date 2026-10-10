import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure, isAllEntities } from 'src/app/game/commands/CommandHelper';
import { setShieldAction, shieldAction, shieldRetaliateEnabled } from 'src/app/game/commands/entity/shieldRetaliate';

export class EntityShieldCommand extends CommandImpl {
  id: string = 'entity.shield';
  requiredParameters: number = 3;

  validParameters(figureId: string | number, entityId: string | number, value: number): boolean {
    return typeof value === 'number' && findEntities(findFigure(figureId), entityId).some((entity) => shieldRetaliateEnabled(entity));
  }

  executeWithParameters(figureId: string | number, entityId: string | number, value: number, persistent: boolean = false) {
    const entities = findEntities(findFigure(figureId), entityId);
    if (entities.length) {
      entities
        .filter((entity) => shieldRetaliateEnabled(entity))
        .forEach((entity) =>
          setShieldAction(entity, persistent, value, isAllEntities(findFigure(figureId), entityId) && !!shieldAction(entity, persistent))
        );
    } else {
      this.executionError('entity not found');
    }
  }
}
