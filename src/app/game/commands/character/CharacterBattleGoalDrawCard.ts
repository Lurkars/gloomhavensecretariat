import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, validSeed } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';

export class CharacterBattleGoalDrawCardCommand extends CommandImpl {
  id: string = 'character.battleGoal.drawCard';
  requiredParameters: number = 2;

  trial356(character: Character): boolean {
    return (
      (gameManager.trialsManager.apply &&
        gameManager.trialsManager.trialsEnabled &&
        character.progress.trial &&
        character.progress.trial.edition === 'fh' &&
        character.progress.trial.name === '356') ||
      false
    );
  }

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
      gameManager.battleGoalManager.drawBattleGoal(character, this.trial356(character));
    } else {
      this.executionError('character not found');
    }
  }
}
