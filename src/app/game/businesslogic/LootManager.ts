import { Game } from "../model/Game";
import { LootDeck } from "../model/Loot";

export class LootManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  drawCard(deck: LootDeck) {
    deck.current++;
    if (deck.current >= deck.cards.length) {
      deck.current = deck.cards.length - 1;
    }
  }

  shuffleDeck(deck: LootDeck) {
    deck.current = -1;
    deck.cards = deck.cards
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

  }

  draw(): void {
    this.shuffleDeck(this.game.lootDeck);
  }

  next(): void {
  }

}
