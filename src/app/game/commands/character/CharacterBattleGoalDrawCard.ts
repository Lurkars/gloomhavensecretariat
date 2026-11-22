import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, validSeed } from 'src/app/game/commands/CommandHelper';

export class CharacterBattleGoalDrawCardCommand extends CommandImpl {
  id: string = 'character.battleGoal.drawCard';
  requiredParameters: number = 2;

  validParameters(number: number, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return (
      settingsManager.settings.battleGoals && !!findCharacter(number) && gameManager.battleGoalManager.getUnrevealedBattleGoals().length > 0
    );
  }

  executeWithParameters(number: number, seed: number) {
    gameManager.game.seed = seed;
    const character = findCharacter(number);
    if (character) {
      gameManager.battleGoalManager.drawAdditionalBattleGoal(character);
    } else {
      this.executionError('character not found');
    }
  }
}
