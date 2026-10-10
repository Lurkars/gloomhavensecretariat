import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure } from 'src/app/game/commands/CommandHelper';
import { EntityValueFunction } from 'src/app/game/model/Entity';

export class EntityMaxHpCommand extends CommandImpl {
  id: string = 'entity.maxHp';
  requiredParameters: number = 3;

  validParameters(figureId: string | number, entityId: string | number, value: number): boolean {
    return (
      typeof value === 'number' &&
      value !== 0 &&
      findEntities(findFigure(figureId), entityId).every((entity) => EntityValueFunction(entity.maxHealth) + value >= 1) &&
      findEntities(findFigure(figureId), entityId).length > 0
    );
  }

  executeWithParameters(figureId: string | number, entityId: string | number, value: number) {
    const entities = findEntities(findFigure(figureId), entityId);
    if (entities.length) {
      entities.forEach((entity) => {
        if (entity.health === EntityValueFunction(entity.maxHealth)) {
          entity.health += value;
        }
        entity.maxHealth = EntityValueFunction(entity.maxHealth) + value;
        if (entity.health > entity.maxHealth) {
          entity.health = entity.maxHealth;
        }
      });
    } else {
      this.executionError('entity not found');
    }
  }
}
