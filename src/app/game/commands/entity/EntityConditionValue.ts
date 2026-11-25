import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure } from 'src/app/game/commands/CommandHelper';
import { ConditionName } from 'src/app/game/model/data/Condition';

export class EntityConditionValueCommand extends CommandImpl {
  id: string = 'entity.condition.value';
  requiredParameters: number = 4;

  validParameters(figureId: string | number, entityId: string | number, name: string, value: number): boolean {
    return gameManager.conditionManager.canSetConditionValue(name, value) && findEntities(findFigure(figureId), entityId).length > 0;
  }

  executeWithParameters(figureId: string | number, entityId: string | number, name: ConditionName, value: number) {
    const figure = findFigure(figureId);
    const entities = findEntities(figure, entityId);
    if (figure && entities.length) {
      entities.forEach((entity) => gameManager.conditionManager.setConditionValue(entity, figure, name, value));
    } else {
      this.executionError('entity not found');
    }
  }
}
