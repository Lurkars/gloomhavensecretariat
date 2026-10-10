import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Summon } from 'src/app/game/model/Summon';

const SUMMON_STATS: string[] = ['maxHp', 'attack', 'movement', 'range', 'trapDamage', 'trapHeal'];

export class SummonStatCommand extends CommandImpl {
  id: string = 'summon.stat';
  requiredParameters: number = 4;

  summon(character: Character | undefined, uuid: BASE_TYPE): Summon | undefined {
    return character && character.summons.find((summon) => summon.uuid === uuid);
  }

  validParameters(number: number, uuid: string, stat: string, value: number): boolean {
    const summon = this.summon(findCharacter(number), uuid);
    if (!summon || !SUMMON_STATS.includes(stat) || typeof value !== 'number' || value === 0) {
      return false;
    }
    switch (stat) {
      case 'maxHp':
        return EntityValueFunction(summon.maxHealth) + value >= 0;
      case 'attack':
        return typeof summon.attack === 'number' && summon.attack + value >= 0;
      case 'trapHeal':
        return summon.trap && summon.attack !== 'X' && +summon.attack + value >= 0;
      case 'movement':
        return summon.movement + value > 0;
      case 'trapDamage':
        return summon.trap && summon.movement + value >= 0;
      case 'range':
        return summon.range + value > 0;
    }
    return false;
  }

  executeWithParameters(number: number, uuid: string, stat: string, value: number) {
    const summon = this.summon(findCharacter(number), uuid);
    if (summon) {
      switch (stat) {
        case 'maxHp':
          summon.maxHealth += value;
          break;
        case 'attack':
          summon.attack = +summon.attack + value;
          break;
        case 'trapHeal':
          summon.attack = +summon.attack + value;
          break;
        case 'movement':
        case 'trapDamage':
          summon.movement += value;
          break;
        case 'range':
          summon.range += value;
          break;
      }
    } else {
      this.executionError('summon not found');
    }
  }
}
