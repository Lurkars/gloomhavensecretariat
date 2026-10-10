import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { CharacterData } from 'src/app/game/model/data/CharacterData';

function unlockId(characterData: CharacterData): string {
  return characterData.edition + ':' + characterData.name;
}

function addUnlockEvents(characterData: CharacterData) {
  if (settingsManager.settings.events && characterData.unlockEvent) {
    characterData.unlockEvent.split('|').forEach((unlockEvent) => {
      if (unlockEvent.split(':').length > 1) {
        gameManager.eventCardManager.addEvent(unlockEvent.split(':')[0], unlockEvent.split(':')[1], true);
      } else {
        gameManager.eventCardManager.addEvent('city', unlockEvent, true);
        gameManager.eventCardManager.addEvent('road', unlockEvent, true);
      }
    });
  }
}

export class CharacterUnlockCommand extends CommandImpl {
  id: string = 'character.unlock';
  requiredParameters: number = 3;

  characterData(edition: BASE_TYPE, name: BASE_TYPE): CharacterData | undefined {
    return typeof edition === 'string'
      ? gameManager.charactersData(edition).find((characterData) => characterData.name === name && characterData.edition === edition)
      : undefined;
  }

  validParameters(edition: string, name: string, unlocked: boolean): boolean {
    return !!this.characterData(edition, name) && typeof unlocked === 'boolean';
  }

  executeWithParameters(edition: string, name: string, unlocked: boolean) {
    const characterData = this.characterData(edition, name);
    if (characterData) {
      const id = unlockId(characterData);
      if (gameManager.game.unlockedCharacters.includes(id) === unlocked) {
        return;
      }
      if (!unlocked) {
        gameManager.game.unlockedCharacters.splice(gameManager.game.unlockedCharacters.indexOf(id), 1);
      } else {
        gameManager.game.unlockedCharacters.push(id);
        addUnlockEvents(characterData);
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
      ? gameManager
          .charactersData(edition)
          .filter((characterData) => characterData.spoiler && !gameManager.game.unlockedCharacters.includes(unlockId(characterData)))
      : [];
  }

  validParameters(edition: string): boolean {
    return this.locked(edition).length > 0;
  }

  executeWithParameters(edition: string) {
    this.locked(edition).forEach((characterData) => {
      gameManager.game.unlockedCharacters.push(unlockId(characterData));
      addUnlockEvents(characterData);
    });
  }
}

export class CharacterUnlockResetCommand extends CommandImpl {
  id: string = 'character.unlockReset';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return true;
  }

  executeWithParameters() {
    gameManager.game.unlockedCharacters = [];
  }
}
