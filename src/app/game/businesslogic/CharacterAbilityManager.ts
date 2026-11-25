import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { Game } from 'src/app/game/model/Game';

export class CharacterAbilityManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  abilityCardsToPick(character: Character): number {
    return Math.max(0, character.level - (character.progress.deck || []).length - 1);
  }

  // level of the next ability card to pick, 0 if the deck is complete
  abilityLevelToPick(character: Character): number {
    const cardsToPick = this.abilityCardsToPick(character);
    return cardsToPick ? character.level - cardsToPick + 1 : 0;
  }

  canToggleAbilityDeck(character: Character, index: number, force: boolean = false): boolean {
    const abilityCard = gameManager.editionManager.deckData(character).abilities[index];
    if (!Number.isInteger(index) || !abilityCard) {
      return false;
    }
    if (force || (character.progress.deck || []).includes(index)) {
      return true;
    }
    return (
      typeof abilityCard.level === 'number' &&
      abilityCard.level > 1 &&
      abilityCard.level <= this.abilityLevelToPick(character) &&
      this.abilityCardsToPick(character) > 0
    );
  }

  toggleAbilityDeck(character: Character, index: number, force: boolean = false): boolean {
    if (!this.canToggleAbilityDeck(character, index, force)) {
      return false;
    }
    const deck = character.progress.deck || [];
    character.progress.deck = deck.includes(index) ? deck.filter((value) => value !== index) : [...deck, index];
    return true;
  }

  canUndoAbilityDeck(character: Character): boolean {
    return (character.progress.deck || []).length > 0;
  }

  undoAbilityDeck(character: Character): boolean {
    if (!this.canUndoAbilityDeck(character)) {
      return false;
    }
    character.progress.deck = character.progress.deck.slice(0, -1);
    return true;
  }

  resetAbilityDeck(character: Character) {
    character.progress.deck = [];
  }
}
