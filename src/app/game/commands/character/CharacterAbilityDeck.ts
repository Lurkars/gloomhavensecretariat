import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';

export class CharacterAbilityDeckCommand extends CommandImpl {
  id: string = 'character.abilityDeck';
  requiredParameters: number = 3;

  abilityIndex(character: Character, cardId: BASE_TYPE): number {
    return typeof cardId === 'number'
      ? gameManager.deckData(character).abilities.findIndex((abilityCard) => abilityCard.cardId === cardId)
      : -1;
  }

  validParameters(number: number, cardId: number, value: boolean): boolean {
    const character = findCharacter(number);
    return !!character && this.abilityIndex(character, cardId) !== -1 && typeof value === 'boolean';
  }

  executeWithParameters(number: number, cardId: number, value: boolean) {
    const character = findCharacter(number);
    if (character) {
      const index = this.abilityIndex(character, cardId);
      character.progress.deck = character.progress.deck.filter((ability) => ability !== index);
      if (value) {
        character.progress.deck.push(index);
      }
    } else {
      this.executionError('character not found');
    }
  }
}
