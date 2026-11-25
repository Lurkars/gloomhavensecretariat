import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure } from 'src/app/game/commands/CommandHelper';
import { ConditionName } from 'src/app/game/model/data/Condition';

export class EntityImmunityCommand extends CommandImpl {
  id: string = 'entity.immunity';
  requiredParameters: number = 4;

  validParameters(figureId: string | number, entityId: string | number, name: string, value: boolean): boolean {
    return (
      typeof value === 'boolean' &&
      gameManager.conditionManager.canSetImmunity(name) &&
      findEntities(findFigure(figureId), entityId).length > 0
    );
  }

  executeWithParameters(figureId: string | number, entityId: string | number, name: ConditionName, value: boolean) {
    const entities = findEntities(findFigure(figureId), entityId);
    if (entities.length) {
      gameManager.conditionManager.setImmunity(entities, name, value);
    } else {
      this.executionError('entity not found');
    }
  }
}
