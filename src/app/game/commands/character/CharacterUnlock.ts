import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { CharacterData } from 'src/app/game/model/data/CharacterData';

export class CharacterUnlockCommand extends CommandImpl {
  id: string = 'character.unlock';
  requiredParameters: number = 3;

  characterData(edition: BASE_TYPE, name: BASE_TYPE): CharacterData | undefined {
    return typeof edition === 'string'
      ? gameManager.editionManager
          .charactersData(edition)
          .find((characterData) => characterData.name === name && characterData.edition === edition)
      : undefined;
  }

  validParameters(edition: string, name: string, unlocked: boolean): boolean {
    return !!this.characterData(edition, name) && typeof unlocked === 'boolean';
  }

  executeWithParameters(edition: string, name: string, unlocked: boolean) {
    const characterData = this.characterData(edition, name);
    if (characterData) {
      if (unlocked) {
        gameManager.characterManager.unlockCharacter(characterData.edition, characterData.name);
      } else {
        gameManager.characterManager.lockCharacter(characterData.edition, characterData.name);
      }
    } else {
      this.executionError('character not found');
    }
  }
}

export class CharacterUnlockAllCommand extends CommandImpl {
  id: string = 'character.unlockAll';
  requiredParameters: number = 1;

  locked(edition: BASE_TYPE): CharacterData[] {
    return typeof edition === 'string'
      ? gameManager.editionManager
          .charactersData(edition)
          .filter(
            (characterData) =>
              characterData.spoiler && !gameManager.characterManager.characterUnlocked(characterData.edition, characterData.name)
          )
      : [];
  }

  validParameters(edition: string): boolean {
    return this.locked(edition).length > 0;
  }

  executeWithParameters(edition: string) {
    this.locked(edition).forEach((characterData) =>
      gameManager.characterManager.unlockCharacter(characterData.edition, characterData.name)
    );
  }
}

export class CharacterUnlockResetCommand extends CommandImpl {
  id: string = 'character.unlockReset';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return true;
  }

  executeWithParameters() {
    gameManager.characterManager.lockAllCharacters();
  }
}
