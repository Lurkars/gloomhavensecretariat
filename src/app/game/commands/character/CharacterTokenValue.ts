import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';

export class CharacterTokenValueCommand extends CommandImpl {
  id: string = 'character.tokenValue';
  requiredParameters: number = 3;

  validParameters(number: number, index: number, value: number): boolean {
    const character = findCharacter(number);
    return (
      !!character && typeof index === 'number' && index >= 0 && index < character.tokens.length && typeof value === 'number' && value !== 0
    );
  }

  newValue(character: Character, index: number, value: number): number {
    let tokenValue = Math.max(0, character.tokenValues[index] + value);
    if (
      character.name === 'blinkblade' &&
      character.tags.find((tag) => ['time_tokens', 'resonance_token'].indexOf(tag) >= 0) &&
      index === 0 &&
      tokenValue > 5
    ) {
      tokenValue = 5;
    }
    return tokenValue;
  }

  executeWithParameters(number: number, index: number, value: number) {
    const character = findCharacter(number);
    if (character) {
      character.tokenValues[index] = this.newValue(character, index, value);
    } else {
      this.executionError('character not found');
    }
  }
}
