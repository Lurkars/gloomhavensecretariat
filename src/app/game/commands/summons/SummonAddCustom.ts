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
      typeof summonNumber === 'number' &&
      gameManager.summonManager.canAddCustomSummon(character, name, summonNumber, color as SummonColor)
    );
  }

  executeWithParameters(number: number, name: string, summonNumber: number, color: SummonColor, seed: number) {
    gameManager.game.seed = seed;
    const character = findCharacter(number);
    if (character) {
      gameManager.summonManager.addCustomSummon(character, name, summonNumber, color);
    } else {
      this.executionError('character not found');
    }
  }
}
