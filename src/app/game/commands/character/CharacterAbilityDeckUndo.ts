import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterAbilityDeckUndoCommand extends CommandImpl {
  id: string = 'character.abilityDeck.undo';
  requiredParameters: number = 1;

  validParameters(number: number): boolean {
    const character = findCharacter(number);
    return !!character && character.progress.deck.length > 0;
  }

  executeWithParameters(number: number) {
    const character = findCharacter(number);
    if (character) {
      character.progress.deck.splice(-1, 1);
    } else {
      this.executionError('character not found');
    }
  }
}
