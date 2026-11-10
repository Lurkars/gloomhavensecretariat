import { gameManager } from 'src/app/game/businesslogic/GameManager';
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
    const tokenValue = Math.max(0, character.tokenValues[index] + value);
    const maxTokenValue = gameManager.specialActionsManager.maxTokenValue(character, index);
    return maxTokenValue !== undefined ? Math.min(tokenValue, maxTokenValue) : tokenValue;
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
