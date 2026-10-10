import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure } from 'src/app/game/commands/CommandHelper';
import { Condition, ConditionName, ConditionType } from 'src/app/game/model/data/Condition';

export class EntityConditionValueCommand extends CommandImpl {
  id: string = 'entity.condition.value';
  requiredParameters: number = 4;

  validParameters(figureId: string | number, entityId: string | number, name: string, value: number): boolean {
    if (!Object.values(ConditionName).includes(name as ConditionName)) {
      return false;
    }
    const condition = new Condition(name);
    return (
      (condition.types.includes(ConditionType.stack) || condition.types.includes(ConditionType.upgrade)) &&
      typeof value === 'number' &&
      value >= 0 &&
      findEntities(findFigure(figureId), entityId).length > 0
    );
  }

  executeWithParameters(figureId: string | number, entityId: string | number, name: ConditionName, value: number) {
    const figure = findFigure(figureId);
    const entities = findEntities(figure, entityId);
    if (figure && entities.length) {
      entities.forEach((entity) => {
        const entityCondition = entity.entityConditions.find(
          (entityCondition) => entityCondition.name === name && !entityCondition.expired
        );
        if (value <= 0) {
          if (entityCondition) {
            gameManager.entityManager.removeCondition(entity, figure, entityCondition, entityCondition.permanent);
          }
        } else if (entityCondition) {
          entityCondition.value = value;
          if (entityCondition.name === ConditionName.plague && entityCondition.value > 3) {
            entityCondition.value = 3;
          }
        } else {
          gameManager.entityManager.addCondition(entity, figure, new Condition(name, value));
        }
      });
    } else {
      this.executionError('entity not found');
    }
  }
}
