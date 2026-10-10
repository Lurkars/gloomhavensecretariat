import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findEntity, findFigure } from 'src/app/game/commands/CommandHelper';
import { EntityCondition } from 'src/app/game/model/data/Condition';
import { Entity } from 'src/app/game/model/Entity';

export class EntityConditionApplyCommand extends CommandImpl {
  id: string = 'entity.condition.apply';
  requiredParameters: number = 3;

  entityCondition(entity: Entity | undefined, name: BASE_TYPE): EntityCondition | undefined {
    return entity && entity.entityConditions.find((entityCondition) => entityCondition.name === name && !entityCondition.expired);
  }

  validParameters(figureId: string | number, entityId: string | number, name: string): boolean {
    return !!this.entityCondition(findEntity(findFigure(figureId), entityId), name);
  }

  executeWithParameters(
    figureId: string | number,
    entityId: string | number,
    name: string,
    decline: boolean = false,
    double: boolean = false
  ) {
    const figure = findFigure(figureId);
    const entity = findEntity(figure, entityId);
    const entityCondition = this.entityCondition(entity, name);
    if (figure && entity && entityCondition) {
      if (decline) {
        gameManager.entityManager.declineApplyCondition(entity, figure, entityCondition);
      } else {
        gameManager.entityManager.applyCondition(entity, figure, entityCondition);
        if (double) {
          gameManager.entityManager.applyCondition(entity, figure, entityCondition);
        }
      }
    } else {
      this.executionError('entity or condition not found');
    }
  }
}
