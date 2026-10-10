import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, findEntity, findFigure } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { Condition, EntityConditionState } from 'src/app/game/model/data/Condition';
import { Summon } from 'src/app/game/model/Summon';

export class SummonTrapCommand extends CommandImpl {
  id: string = 'summon.trap';
  requiredParameters: number = 4;

  trap(character: Character | undefined, uuid: BASE_TYPE): Summon | undefined {
    return character && character.summons.find((summon) => summon.uuid === uuid && summon.trap);
  }

  validParameters(number: number, uuid: string, targetFigureId: string | number, targetEntityId: string | number): boolean {
    const trap = this.trap(findCharacter(number), uuid);
    const target = findEntity(findFigure(targetFigureId), targetEntityId);
    return !!trap && !!target && target !== trap;
  }

  executeWithParameters(number: number, uuid: string, targetFigureId: string | number, targetEntityId: string | number) {
    const character = findCharacter(number);
    const trap = this.trap(character, uuid);
    const targetFigure = findFigure(targetFigureId);
    const target = findEntity(targetFigure, targetEntityId);
    if (character && trap && targetFigure && target) {
      const damage = trap.movement;
      const heal = trap.attack === 'X' ? 0 : +trap.attack;
      if (damage) {
        gameManager.entityManager.changeHealth(target, targetFigure, -damage);
      }
      if (heal) {
        gameManager.entityManager.changeHealth(target, targetFigure, heal);
      }
      trap.entityConditions
        .filter((entityCondition) => !entityCondition.expired && entityCondition.state !== EntityConditionState.removed)
        .forEach((entityCondition) => {
          gameManager.entityManager.addCondition(target, targetFigure, new Condition(entityCondition.name, entityCondition.value));
        });
      trap.dead = true;
      gameManager.characterManager.removeSummon(character, trap);
    } else {
      this.executionError('trap or target not found');
    }
  }
}
