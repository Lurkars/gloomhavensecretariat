import { Game } from "../model/Game";
import { LootType } from "../model/Loot";
import { gameManager } from "./GameManager";

export class LootManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  drawCard() {
    this.game.lootDeck.current++;
    if (this.game.lootDeck.current >= this.game.lootDeck.cards.length) {
      this.game.lootDeck.current = this.game.lootDeck.cards.length - 1;
    }
  }

  shuffleDeck() {
    this.game.lootDeck.current = -1;
    this.game.lootDeck.cards = this.game.lootDeck.cards
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

  }

  draw(): void {
    this.shuffleDeck();
  }

  next(): void {
  }

}
