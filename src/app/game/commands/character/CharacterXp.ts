import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';

export class CharacterXpCommand extends CommandImpl {
  id: string = 'character.xp';
  requiredParameters: number = 2;

  constructor(...parameters: BASE_TYPE[]) {
    super(...parameters);
  }

  validParameters(number: number, xp: number): boolean {
    const character = findCharacter(number);
    return !!character && typeof xp === 'number' && gameManager.characterManager.canChangeExperience(character, xp);
  }

  executeWithParameters(number: number, xp: number) {
    const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.number === number) as Character;
    if (character) {
      gameManager.characterManager.changeExperience(character, xp);
    } else {
      this.executionError('character not found or invalid');
    }
  }

  override before(): BASE_TYPE[] {
    const character = gameManager.game.figures.find(
      (figure) => figure instanceof Character && figure.number === this.parameters[0]
    ) as Character;
    if (character) {
      return ['command.' + this.id, gameManager.characterManager.characterName(character, true, true), this.parameters[1]];
    }

    return ['command.invalid.' + this.id, ...this.parameters];
  }
}
