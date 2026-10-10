import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { Summon } from 'src/app/game/model/Summon';

export class SummonInitCommand extends CommandImpl {
  id: string = 'summon.init';
  requiredParameters: number = 2;

  summon(character: Character | undefined, uuid: BASE_TYPE): Summon | undefined {
    return character && character.summons.find((summon) => summon.uuid === uuid && summon.init);
  }

  validParameters(number: number, uuid: string, ...values: number[]): boolean {
    return !!this.summon(findCharacter(number), uuid) && values.every((value) => typeof value === 'number');
  }

  executeWithParameters(
    number: number,
    uuid: string,
    health: number = 0,
    maxHp: number = 0,
    attack: number = 0,
    movement: number = 0,
    range: number = 0
  ) {
    const character = findCharacter(number);
    const summon = this.summon(character, uuid);
    if (character && summon) {
      gameManager.characterManager.removeSummon(character, summon);
      summon.init = false;
      if (health !== 0) {
        gameManager.entityManager.changeHealth(summon, character, health);
      }
      if (attack !== 0 && typeof summon.attack === 'number') {
        summon.attack += attack;
      }
      if (movement !== 0) {
        summon.movement += movement;
      }
      if (range !== 0) {
        summon.range += range;
      }
      if (maxHp) {
        if (summon.maxHealth + maxHp < summon.maxHealth || summon.health === summon.maxHealth) {
          summon.health = summon.maxHealth + maxHp;
        }
        summon.maxHealth += maxHp;
      }
      gameManager.characterManager.addSummon(character, summon);
    } else {
      this.executionError('summon not found');
    }
  }
}
