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

    if (Object.keys(this.game.lootDeck.loot).length > 0 && this.game.lootDeck.cards.length == 0) {
      this.shuffleDeck();
    }

    if (this.game.lootDeck.current >= this.game.lootDeck.cards.length) {
      this.game.lootDeck.current = this.game.lootDeck.cards.length - 1;
    }
  }

  shuffleDeck() {
    this.game.lootDeck.cards = [];

    Object.values(LootType).forEach((type) => {
      if (this.game.lootDeck) {
        if (this.game.lootDeck.loot[type]) {
          const loot = this.game.lootDeck.loot[type] || 0;
          for (let i = 0; i < loot; i++) {
            this.game.lootDeck.cards.push(type);
          }
        }
      }
    })

    this.game.lootDeck.current = -1;
    this.game.lootDeck.cards = this.game.lootDeck.cards
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

  }

  draw(): void {

  }

  next(): void {
  }

}
