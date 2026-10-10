import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntity, findFigure } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { ConditionName, ConditionType, EntityConditionState } from 'src/app/game/model/data/Condition';
import { Summon } from 'src/app/game/model/Summon';

export class EntitySpecialActionCommand extends CommandImpl {
  id: string = 'entity.specialAction';
  requiredParameters: number = 4;

  validParameters(figureId: string | number, entityId: string | number, name: string, value: boolean): boolean {
    const figure = findFigure(figureId);
    const entity = findEntity(figure, entityId);
    return (
      typeof value === 'boolean' &&
      figure instanceof Character &&
      !!entity &&
      !!figure.specialActions &&
      figure.specialActions.some(
        (specialAction) =>
          specialAction.name === name &&
          !specialAction.noTag &&
          (!specialAction.level || specialAction.level <= figure.level) &&
          ((entity instanceof Character && !specialAction.summon) || (entity instanceof Summon && specialAction.summon))
      )
    );
  }

  executeWithParameters(figureId: string | number, entityId: string | number, name: string, value: boolean) {
    const character = findFigure(figureId);
    const entity = findEntity(character, entityId);
    if (character instanceof Character && entity) {
      if (entity.tags.includes(name) === value) {
        return;
      }
      if (!value) {
        gameManager.specialActionsManager.removeSpecialAction(entity, character, name);
      } else {
        gameManager.specialActionsManager.addSpecialAction(entity, character, name);
        if (entity instanceof Character) {
          if (entity.name === 'lightning' && name === 'careless-charge') {
            entity.immunities = gameManager.conditionsForTypes('character', 'negative').map((condition) => condition.name);
            entity.immunities.push(ConditionName.curse);
          }

          if (entity.name === 'shackles' && name === 'delayed_malady') {
            entity.entityConditions.forEach((condition) => {
              if (
                condition.types.includes(ConditionType.negative) &&
                !condition.types.includes(ConditionType.amDeck) &&
                !condition.expired &&
                condition.state !== EntityConditionState.removed &&
                !entity.immunities.includes(condition.name)
              ) {
                entity.immunities.push(condition.name);
              }
            });
          }
        }
      }
    } else {
      this.executionError('entity not found');
    }
  }
}
