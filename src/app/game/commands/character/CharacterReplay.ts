import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { Character, GameCharacterModel } from 'src/app/game/model/Character';

export class CharacterReplayCommand extends CommandImpl {
  id: string = 'character.replay';
  requiredParameters: number = 3;

  model(edition: BASE_TYPE, name: BASE_TYPE, number: BASE_TYPE): GameCharacterModel | undefined {
    return (gameManager.game.party.availableCharacters || []).find(
      (model) => model.edition === edition && model.name === name && model.number === number
    );
  }

  character(model: GameCharacterModel): Character {
    const character = new Character(gameManager.getCharacterData(model.name, model.edition), model.level);
    character.fromModel(model);
    return character;
  }

  validParameters(edition: string, name: string, number: number): boolean {
    return !!this.model(edition, name, number);
  }

  executeWithParameters(edition: string, name: string, number: number) {
    const model = this.model(edition, name, number);
    if (model) {
      const character = this.character(model);
      gameManager.game.party.availableCharacters = gameManager.game.party.availableCharacters.filter((other) => other !== model);
      gameManager.game.figures.forEach((figure) => {
        if (figure instanceof Character && figure.number === character.number) {
          gameManager.game.party.availableCharacters.push(figure.toModel());
          gameManager.characterManager.removeCharacter(figure);
        }
      });
      gameManager.game.figures.push(character);
    } else {
      this.executionError('character not found');
    }
  }
}
