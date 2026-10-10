import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { Character, GameCharacterModel } from 'src/app/game/model/Character';

export class CharacterImportCommand extends CommandImpl {
  id: string = 'character.import';
  requiredParameters: number = 2;

  model(character: Character, json: BASE_TYPE): GameCharacterModel | undefined {
    try {
      const characterModel: GameCharacterModel = Object.assign(
        new Character(character, character.level).toModel(),
        JSON.parse(json as string)
      );
      if (characterModel.name === character.name && characterModel.edition === character.edition) {
        return characterModel;
      }
    } catch (e) {
      console.warn(e);
    }
    return undefined;
  }

  validParameters(number: number, json: string): boolean {
    const character = findCharacter(number);
    return !!character && typeof json === 'string' && !!this.model(character, json);
  }

  executeWithParameters(number: number, json: string) {
    const character = findCharacter(number);
    const characterModel = character && this.model(character, json);
    if (character && characterModel) {
      character.fromModel(characterModel);
    } else {
      this.executionError('character not found or invalid model');
    }
  }
}
