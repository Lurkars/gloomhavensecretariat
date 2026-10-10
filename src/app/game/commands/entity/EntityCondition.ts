import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { Condition, ConditionName, ConditionType } from 'src/app/game/model/data/Condition';

export class EntityConditionCommand extends CommandImpl {
  id: string = 'entity.condition';
  requiredParameters: number = 4;

  validParameters(figureId: string | number, entityId: string | number, name: string, value: boolean): boolean {
    return (
      typeof value === 'boolean' &&
      Object.values(ConditionName).includes(name as ConditionName) &&
      name !== ConditionName.invalid &&
      !new Condition(name).types.includes(ConditionType.amDeck) &&
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
          .filter((entity) => gameManager.entityManager.hasCondition(entity, new Condition(name), permanent))
          .forEach((entity) => gameManager.entityManager.removeCondition(entity, figure, new Condition(name), permanent));
      } else {
        entities
          .filter((entity) => !gameManager.entityManager.hasCondition(entity, new Condition(name), permanent))
          .forEach((entity) => {
            let condition = new Condition(name);
            if (
              entity instanceof Character &&
              condition.name === ConditionName.muddle &&
              entity.progress.equippedItems.find((identifier) => identifier.edition === 'gh' && identifier.name === '108')
            ) {
              condition = new Condition(ConditionName.strengthen);
            }
            const shacklesImmunity =
              entity instanceof Character &&
              entity.name === 'shackles' &&
              !entity.absent &&
              entity.tags.includes('delayed_malady') &&
              condition.types.includes(ConditionType.negative);
            gameManager.entityManager.addCondition(entity, figure, condition, permanent, shacklesImmunity);
            if (shacklesImmunity && !entity.immunities.includes(condition.name)) {
              entity.immunities.push(condition.name);
            }
          });
      }
    } else {
      this.executionError('entity not found');
    }
  }
}
