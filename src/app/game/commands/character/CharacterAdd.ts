import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';

export class CharacterAddCommand extends CommandImpl {
  id: string = 'character.add';
  requiredParameters: number = 4;

  validParameters(edition: string, name: string, level: number, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return (
      (edition && name && level && level < 10 && gameManager.charactersData(edition).find((char) => char.name === name) !== undefined) ||
      false
    );
  }

  executeWithParameters(edition: string, name: string, level: number, seed: number) {
    gameManager.game.seed = seed;
    const characterData = gameManager.charactersData(edition).find((char) => char.name === name);
    if (characterData) {
      gameManager.characterManager.addCharacter(characterData, level);
    } else {
      this.executionError('character not found');
    }
  }
}
