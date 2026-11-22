import { gameManager } from 'src/app/game/businesslogic/Managers';
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
      gameManager.characterManager.replayCharacter(this.character(model));
    } else {
      this.executionError('character not found');
    }
  }
}
