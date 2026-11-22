import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, validSeed } from 'src/app/game/commands/CommandHelper';
import { SummonColor } from 'src/app/game/model/Summon';

export class SummonAddCustomCommand extends CommandImpl {
  id: string = 'summon.addCustom';
  requiredParameters: number = 5;

  validParameters(number: number, name: string, summonNumber: number, color: string, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    const character = findCharacter(number);
    return (
      !!character &&
      typeof name === 'string' &&
      typeof summonNumber === 'number' &&
      summonNumber > 0 &&
      Object.values(SummonColor).includes(color as SummonColor) &&
      !character.summons.some(
        (summon) =>
          gameManager.entityManager.isAlive(summon) && summon.name === name && summon.number === summonNumber && summon.color === color
      )
    );
  }

  executeWithParameters(number: number, name: string, summonNumber: number, color: SummonColor, seed: number) {
    gameManager.game.seed = seed;
    const character = findCharacter(number);
    if (character) {
      gameManager.characterManager.addCustomSummon(character, name, summonNumber, color);
    } else {
      this.executionError('character not found');
    }
  }
}
