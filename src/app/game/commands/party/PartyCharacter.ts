import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { Character, GameCharacterModel } from 'src/app/game/model/Character';

function retired(edition: BASE_TYPE, name: BASE_TYPE): GameCharacterModel | undefined {
  return gameManager.game.party.retirements.find((model) => model.edition === edition && model.name === name);
}

export class PartyCharacterReactivateCommand extends CommandImpl {
  id: string = 'party.character.reactivate';
  requiredParameters: number = 2;

  validParameters(edition: string, name: string): boolean {
    return (
      !!retired(edition, name) &&
      !gameManager.game.figures.some((figure) => figure instanceof Character && figure.name === name && figure.edition === edition) &&
      !gameManager.game.party.availableCharacters.some((model) => model.name === name && model.edition === edition)
    );
  }

  executeWithParameters(edition: string, name: string) {
    const characterModel = retired(edition, name);
    if (characterModel) {
      const character = new Character(gameManager.getCharacterData(characterModel.name, characterModel.edition), characterModel.level);
      character.fromModel(characterModel);
      character.progress.retired = false;
      character.progress.personalQuestProgress = [];
      gameManager.game.figures.push(character);
      gameManager.game.party.retirements.splice(gameManager.game.party.retirements.indexOf(characterModel), 1);
    } else {
      this.executionError('retired character not found');
    }
  }
}

export class PartyCharacterPlayerNumberCommand extends CommandImpl {
  id: string = 'party.character.playerNumber';
  requiredParameters: number = 4;

  model(edition: BASE_TYPE, name: BASE_TYPE, number: BASE_TYPE): GameCharacterModel | undefined {
    return [...gameManager.game.party.retirements, ...(gameManager.game.party.availableCharacters || [])].find(
      (model) => model.edition === edition && model.name === name && model.number === number
    );
  }

  validParameters(edition: string, name: string, number: number, newNumber: number): boolean {
    return !!this.model(edition, name, number) && typeof newNumber === 'number' && newNumber > 0 && newNumber !== number;
  }

  executeWithParameters(edition: string, name: string, number: number, newNumber: number) {
    const model = this.model(edition, name, number);
    if (model) {
      model.number = newNumber;
    } else {
      this.executionError('character not found');
    }
  }
}

export class PartyCharacterEnhancementsCommand extends CommandImpl {
  id: string = 'party.character.enhancements';
  requiredParameters: number = 3;

  enhancements(json: BASE_TYPE) {
    try {
      const enhancements = JSON.parse(json as string);
      return Array.isArray(enhancements) ? enhancements : undefined;
    } catch {
      return undefined;
    }
  }

  validParameters(edition: string, name: string, json: string): boolean {
    const characterModel = retired(edition, name);
    return !!characterModel && !!characterModel.progress && !!this.enhancements(json);
  }

  executeWithParameters(edition: string, name: string, json: string) {
    const characterModel = retired(edition, name);
    const enhancements = this.enhancements(json);
    if (characterModel && characterModel.progress && enhancements) {
      characterModel.progress.enhancements = enhancements;
      const current = gameManager.game.figures.find(
        (figure) => figure instanceof Character && figure.edition === edition && figure.name === name
      ) as Character | undefined;
      if (current) {
        gameManager.characterManager.previousEnhancements(current, gameManager.enhancementsManager.temporary);
      }
    } else {
      this.executionError('retired character not found');
    }
  }
}
