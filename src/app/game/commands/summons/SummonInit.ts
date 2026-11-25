import { gameManager } from 'src/app/game/businesslogic/Managers';
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
      gameManager.summonManager.initSummon(character, summon, { health, maxHp, attack, movement, range });
    } else {
      this.executionError('summon not found');
    }
  }
}
