import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { AbilityCardHalf, AbilityCardPile, ActiveAbilityCard, CharacterAbilityCards } from 'src/app/game/model/CharacterAbilityCards';
import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { Game, GameState } from 'src/app/game/model/Game';

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

  canEnableAbilityCards(character: Character): boolean {
    return gameManager.editionManager.deckData(character, true).abilities.length > 0;
  }

  enableAbilityCards(character: Character, enable: boolean): boolean {
    if (enable && !this.canEnableAbilityCards(character)) {
      return false;
    }
    character.abilityCards = enable ? character.abilityCards || new CharacterAbilityCards() : undefined;
    return true;
  }

  handSize(character: Character): number {
    return typeof character.handSize === 'number' ? character.handSize : parseInt(character.handSize) || 0;
  }

  // level 1 and X cards plus the cards picked into the deck
  availableAbilityCards(character: Character): number[] {
    const deck = character.progress.deck || [];
    return gameManager.editionManager
      .deckData(character)
      .abilities.map((abilityCard, index) => (abilityCard.level === 1 || abilityCard.level === 'X' || deck.includes(index) ? index : -1))
      .filter((index) => index !== -1);
  }

  // hand is editable until the first card left the hand
  handEditable(character: Character): boolean {
    const cards = character.abilityCards;
    return (
      !!cards &&
      this.game.state === GameState.draw &&
      !cards.selected.length &&
      !cards.discard.length &&
      !cards.lost.length &&
      !cards.active.length
    );
  }

  handComplete(character: Character): boolean {
    return !character.abilityCards || character.abilityCards.hand.length >= this.handSize(character);
  }

  // characters with digital ability cards still choosing their hand
  handPending(): boolean {
    return this.game.figures.some(
      (figure) => figure instanceof Character && !figure.absent && this.handEditable(figure) && !this.handComplete(figure)
    );
  }

  canToggleHand(character: Character, index: number, force: boolean = false): boolean {
    const cards = character.abilityCards;
    if (!cards || !this.abilityCard(character, index) || (!force && !this.handEditable(character))) {
      return false;
    }
    if (force || cards.hand.includes(index)) {
      return true;
    }
    return this.availableAbilityCards(character).includes(index) && !this.handComplete(character);
  }

  toggleHand(character: Character, index: number, force: boolean = false): boolean {
    if (!this.canToggleHand(character, index, force) || !character.abilityCards) {
      return false;
    }
    const cards = character.abilityCards;
    cards.hand = cards.hand.includes(index) ? cards.hand.filter((value) => value !== index) : [...cards.hand, index];
    return true;
  }

  canSelectCard(character: Character, index: number, force: boolean = false): boolean {
    const cards = character.abilityCards;
    if (!cards || (!force && (this.game.state !== GameState.draw || character.exhausted || character.absent))) {
      return false;
    }
    if (cards.selected.includes(index)) {
      return true;
    }
    return cards.hand.includes(index) && cards.selected.length < 2 && (force || !character.longRest);
  }

  // toggles a card between hand and selection, initiative is taken from the leading card
  toggleSelectCard(character: Character, index: number, force: boolean = false): boolean {
    if (!this.canSelectCard(character, index, force) || !character.abilityCards) {
      return false;
    }
    const cards = character.abilityCards;
    if (cards.selected.includes(index)) {
      cards.selected = cards.selected.filter((value) => value !== index);
      cards.hand.push(index);
    } else {
      cards.hand = cards.hand.filter((value) => value !== index);
      cards.selected.push(index);
    }
    cards.shortRest = [];
    this.updateInitiative(character);
    return true;
  }

  canSetLeadingCard(character: Character, index: number, force: boolean = false): boolean {
    const cards = character.abilityCards;
    return !!cards && cards.selected.includes(index) && (force || this.game.state === GameState.draw);
  }

  setLeadingCard(character: Character, index: number, force: boolean = false): boolean {
    if (!this.canSetLeadingCard(character, index, force) || !character.abilityCards) {
      return false;
    }
    const cards = character.abilityCards;
    cards.selected = [index, ...cards.selected.filter((value) => value !== index)];
    this.updateInitiative(character);
    return true;
  }

  // returns the selected cards to the hand, e.g. when declaring a long rest
  clearSelection(character: Character) {
    const cards = character.abilityCards;
    if (cards && cards.selected.length) {
      cards.hand.push(...cards.selected);
      cards.selected = [];
    }
  }

  cardInitiative(character: Character, index: number): number {
    const abilityCard = this.abilityCard(character, index);
    if (!abilityCard) {
      return 0;
    }
    return (abilityCard.identityInitiative && abilityCard.identityInitiative[character.identity]) || abilityCard.initiative;
  }

  // the second card must use the other half than the first one
  canPlayCard(character: Character, index: number, half: AbilityCardHalf, force: boolean = false): boolean {
    const cards = character.abilityCards;
    if (!cards || !cards.selected.includes(index)) {
      return false;
    }
    return force || (this.game.state === GameState.next && (!cards.played || this.bottomHalf(cards.played) !== this.bottomHalf(half)));
  }

  // moves a selected card to discard, lost or active pile depending on the played half
  playCard(character: Character, index: number, half: AbilityCardHalf, force: boolean = false): AbilityCardPile | undefined {
    if (!this.canPlayCard(character, index, half, force) || !character.abilityCards) {
      return undefined;
    }
    const cards = character.abilityCards;
    cards.selected = cards.selected.filter((value) => value !== index);
    cards.played = cards.played || half;
    const abilityCard = this.abilityCard(character, index);
    if (half === 'defaultTop' || half === 'defaultBottom' || !abilityCard) {
      cards.discard.push(index);
      return 'discard';
    }
    const bottom = half === 'bottom';
    if (bottom ? abilityCard.bottomPersistent || abilityCard.bottomRound : abilityCard.persistent || abilityCard.round) {
      cards.active.push(new ActiveAbilityCard(index, bottom));
      return 'active';
    }
    return this.discardOrLose(cards, abilityCard, index, bottom);
  }

  canRemoveActiveCard(character: Character, index: number): boolean {
    return !!character.abilityCards && character.abilityCards.active.some((activeCard) => activeCard.index === index);
  }

  // e.g. persistent ability with all charges used
  removeActiveCard(character: Character, index: number): AbilityCardPile | undefined {
    const cards = character.abilityCards;
    const activeCard = cards && cards.active.find((value) => value.index === index);
    if (!cards || !activeCard) {
      return undefined;
    }
    cards.active = cards.active.filter((value) => value !== activeCard);
    const abilityCard = this.abilityCard(character, index);
    if (!abilityCard) {
      cards.discard.push(index);
      return 'discard';
    }
    return this.discardOrLose(cards, abilityCard, index, activeCard.bottom);
  }

  canShortRest(character: Character, force: boolean = false): boolean {
    const cards = character.abilityCards;
    return !!cards && cards.discard.length >= 2 && (force || (this.game.state === GameState.draw && !cards.selected.length));
  }

  // loses a random card from discard and returns the others to hand, returns the lost card
  shortRest(character: Character, force: boolean = false): number | undefined {
    if (!this.canShortRest(character, force) || !character.abilityCards) {
      return undefined;
    }
    const cards = character.abilityCards;
    const lost = cards.discard[gameManager.randomManager.int(cards.discard.length)];
    const returned = cards.discard.filter((value) => value !== lost);
    cards.lost.push(lost);
    cards.hand.push(...returned);
    cards.discard = [];
    cards.shortRest = [lost, ...returned];
    return lost;
  }

  canRerollShortRest(character: Character): boolean {
    const cards = character.abilityCards;
    return !!cards && cards.shortRest.length > 1 && cards.lost.includes(cards.shortRest[0]) && gameManager.entityManager.isAlive(character);
  }

  // suffer 1 damage to lose a different random card of the last short rest, returns the new lost card
  rerollShortRest(character: Character): number | undefined {
    if (!this.canRerollShortRest(character) || !character.abilityCards) {
      return undefined;
    }
    const cards = character.abilityCards;
    const [previous, ...returned] = cards.shortRest;
    const lost = returned[gameManager.randomManager.int(returned.length)];
    cards.lost = [...cards.lost.filter((value) => value !== previous), lost];
    cards.hand = [...cards.hand.filter((value) => value !== lost), previous];
    cards.shortRest = [];
    gameManager.entityManager.changeHealth(character, character, -1);
    return lost;
  }

  canLongRest(character: Character, lostIndex: number, force: boolean = false): boolean {
    const cards = character.abilityCards;
    return (
      !!cards &&
      cards.discard.length >= 2 &&
      cards.discard.includes(lostIndex) &&
      (force || (this.game.state === GameState.next && character.longRest))
    );
  }

  // loses the chosen card from discard and returns the others to hand
  longRest(character: Character, lostIndex: number, force: boolean = false): boolean {
    if (!this.canLongRest(character, lostIndex, force) || !character.abilityCards) {
      return false;
    }
    const cards = character.abilityCards;
    cards.lost.push(lostIndex);
    cards.hand.push(...cards.discard.filter((value) => value !== lostIndex));
    cards.discard = [];
    return true;
  }

  // one card from hand or two cards from discard to negate damage
  canLoseCardsForDamage(character: Character, indices: number[]): boolean {
    const cards = character.abilityCards;
    if (!cards) {
      return false;
    }
    return (
      (indices.length === 1 && cards.hand.includes(indices[0])) ||
      (indices.length === 2 && indices[0] !== indices[1] && indices.every((index) => cards.discard.includes(index)))
    );
  }

  loseCardsForDamage(character: Character, indices: number[]): boolean {
    if (!this.canLoseCardsForDamage(character, indices) || !character.abilityCards) {
      return false;
    }
    const cards = character.abilityCards;
    cards.hand = cards.hand.filter((value) => !indices.includes(value));
    cards.discard = cards.discard.filter((value) => !indices.includes(value));
    cards.lost.push(...indices);
    return true;
  }

  // neither two cards to play nor two cards to rest
  cardsExhausted(character: Character): boolean {
    const cards = character.abilityCards;
    return !!cards && cards.hand.length + cards.selected.length < 2 && cards.discard.length < 2;
  }

  // unplayed cards are discarded, round bonus cards leave the active area
  endRound(character: Character) {
    const cards = character.abilityCards;
    if (!cards) {
      return;
    }
    cards.discard.push(...cards.selected);
    cards.selected = [];
    cards.played = undefined;
    cards.shortRest = [];
    cards.active
      .filter((activeCard) => {
        const abilityCard = this.abilityCard(character, activeCard.index);
        return abilityCard && (activeCard.bottom ? abilityCard.bottomRound : abilityCard.round);
      })
      .forEach((activeCard) => this.removeActiveCard(character, activeCard.index));
    if (!character.exhausted && !character.absent && this.cardsExhausted(character)) {
      gameManager.entityManager.setExhausted(character, true);
    }
  }

  // all cards return to hand, so the last hand is preselected for the next scenario
  resetAbilityCards(character: Character) {
    const cards = character.abilityCards;
    if (!cards) {
      return;
    }
    const hand = [...cards.hand, ...cards.selected, ...cards.discard, ...cards.lost, ...cards.active.map((activeCard) => activeCard.index)];
    character.abilityCards = new CharacterAbilityCards();
    character.abilityCards.hand = hand.filter((index) => this.abilityCard(character, index));
  }

  private abilityCard(character: Character, index: number): AbilityCard | undefined {
    return Number.isInteger(index) ? gameManager.editionManager.deckData(character).abilities[index] : undefined;
  }

  private bottomHalf(half: AbilityCardHalf): boolean {
    return half === 'bottom' || half === 'defaultBottom';
  }

  private discardOrLose(cards: CharacterAbilityCards, abilityCard: AbilityCard, index: number, bottom: boolean): AbilityCardPile {
    if (bottom ? abilityCard.bottomLost || abilityCard.bottomLoss : abilityCard.lost || abilityCard.loss) {
      cards.lost.push(index);
      return 'lost';
    }
    cards.discard.push(index);
    return 'discard';
  }

  private updateInitiative(character: Character) {
    const cards = character.abilityCards;
    if (cards) {
      gameManager.roundManager.setInitiative(
        character,
        cards.selected.length === 2 ? this.cardInitiative(character, cards.selected[0]) : 0
      );
      // a leading card with initiative 99 is no long rest
      character.longRest = false;
    }
  }
}
