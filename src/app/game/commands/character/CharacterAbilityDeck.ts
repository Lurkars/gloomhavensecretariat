import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';

export class CharacterAbilityDeckCommand extends CommandImpl {
  id: string = 'character.abilityDeck';
  requiredParameters: number = 3;

  abilityIndex(character: Character, cardId: BASE_TYPE): number {
    return typeof cardId === 'number'
      ? gameManager.editionManager.deckData(character).abilities.findIndex((abilityCard) => abilityCard.cardId === cardId)
      : -1;
  }

  validParameters(number: number, cardId: number, value: boolean, force: boolean = false): boolean {
    const character = findCharacter(number);
    if (!character || typeof value !== 'boolean' || typeof force !== 'boolean') {
      return false;
    }
    const index = this.abilityIndex(character, cardId);
    return (
      index !== -1 &&
      (character.progress.deck.includes(index) === value ||
        gameManager.characterAbilityManager.canToggleAbilityDeck(character, index, force))
    );
  }

  executeWithParameters(number: number, cardId: number, value: boolean, force: boolean = false) {
    const character = findCharacter(number);
    if (character) {
      const index = this.abilityIndex(character, cardId);
      if (character.progress.deck.includes(index) !== value) {
        gameManager.characterAbilityManager.toggleAbilityDeck(character, index, force);
      }
    } else {
      this.executionError('character not found');
    }
  }
}
