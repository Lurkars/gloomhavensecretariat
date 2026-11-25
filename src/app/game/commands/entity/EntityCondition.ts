import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure } from 'src/app/game/commands/CommandHelper';
import { Condition, ConditionName } from 'src/app/game/model/data/Condition';

export class EntityConditionCommand extends CommandImpl {
  id: string = 'entity.condition';
  requiredParameters: number = 4;

  validParameters(figureId: string | number, entityId: string | number, name: string, value: boolean): boolean {
    return (
      typeof value === 'boolean' &&
      Object.values(ConditionName).includes(name as ConditionName) &&
      gameManager.conditionManager.canAddManualCondition(new Condition(name)) &&
      findEntities(findFigure(figureId), entityId).length > 0
    );
  }

  executeWithParameters(
    figureId: string | number,
    entityId: string | number,
    name: ConditionName,
    value: boolean,
    permanent: boolean = false
  ) {
    const figure = findFigure(figureId);
    const entities = findEntities(figure, entityId);
    if (figure && entities.length) {
      if (!value) {
        entities
          .filter((entity) => gameManager.conditionManager.hasCondition(entity, new Condition(name), permanent))
          .forEach((entity) => gameManager.conditionManager.removeCondition(entity, figure, new Condition(name), permanent));
      } else {
        entities
          .filter((entity) => !gameManager.conditionManager.hasCondition(entity, new Condition(name), permanent))
          .forEach((entity) => gameManager.conditionManager.addManualCondition(entity, figure, new Condition(name), permanent));
      }
    } else {
      this.executionError('entity not found');
    }
  }
}
