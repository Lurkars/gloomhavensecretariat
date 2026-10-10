import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, validSeed } from 'src/app/game/commands/CommandHelper';

export class CharacterBattleGoalDrawCommand extends CommandImpl {
  id: string = 'character.battleGoal.draw';
  requiredParameters: number = 2;

  validParameters(number: number, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    const character = findCharacter(number);
    return (
      settingsManager.settings.battleGoals && !!character && gameManager.battleGoalManager.getUnrevealedBattleGoals(character).length > 0
    );
  }

  executeWithParameters(number: number, seed: number) {
    gameManager.game.seed = seed;
    const character = findCharacter(number);
    if (character) {
      character.battleGoals = [];
      character.battleGoal = false;
      gameManager.battleGoalManager.drawBattleGoal(character);
      if (!gameManager.trialsManager.apply || !gameManager.trialsManager.activeTrial('fh', 360)) {
        gameManager.battleGoalManager.drawBattleGoal(character);
        if (gameManager.fhRules(true) || settingsManager.settings.battleGoalsFh) {
          gameManager.battleGoalManager.drawBattleGoal(character);
        }
      }
    } else {
      this.executionError('character not found');
    }
  }
}
