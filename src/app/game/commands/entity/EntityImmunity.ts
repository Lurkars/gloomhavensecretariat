import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure } from 'src/app/game/commands/CommandHelper';
import { ConditionName } from 'src/app/game/model/data/Condition';

export class EntityImmunityCommand extends CommandImpl {
  id: string = 'entity.immunity';
  requiredParameters: number = 4;

  validParameters(figureId: string | number, entityId: string | number, name: string, value: boolean): boolean {
    return (
      typeof value === 'boolean' &&
      Object.values(ConditionName).includes(name as ConditionName) &&
      name !== ConditionName.invalid &&
      findEntities(findFigure(figureId), entityId).length > 0
    );
  }

  executeWithParameters(figureId: string | number, entityId: string | number, name: ConditionName, value: boolean) {
    const entities = findEntities(findFigure(figureId), entityId);
    if (entities.length) {
      if (!value) {
        entities.forEach((entity) => (entity.immunities = entity.immunities.filter((immunity) => immunity !== name)));
      } else {
        entities.filter((entity) => !entity.immunities.includes(name)).forEach((entity) => entity.immunities.push(name));
      }
    } else {
      this.executionError('entity not found');
    }
  }
}
