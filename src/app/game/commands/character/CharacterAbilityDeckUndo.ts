import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterAbilityDeckUndoCommand extends CommandImpl {
  id: string = 'character.abilityDeck.undo';
  requiredParameters: number = 1;

  validParameters(number: number): boolean {
    const character = findCharacter(number);
    return !!character && gameManager.characterAbilityManager.canUndoAbilityDeck(character);
  }

  executeWithParameters(number: number) {
    const character = findCharacter(number);
    if (character) {
      gameManager.characterAbilityManager.undoAbilityDeck(character);
    } else {
      this.executionError('character not found');
    }
  }
}
