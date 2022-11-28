import { Game } from "../model/Game";
import { fullLootDeck, Loot, LootDeck, LootDeckConfig, LootType } from "../model/Loot";

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

  fullLootDeck(): Loot[] {
    let availableCards: Loot[] = JSON.parse(JSON.stringify(fullLootDeck));

    this.game.lootDeckEnhancements.forEach((loot) => {
      if (loot.enhancements > 0) {
        const replacement = availableCards.find((other) => other.type == loot.type && other.value == loot.value && other.enhancements == 0);
        if (!replacement) {
          console.warn('Enhancement of non-available loot card: ' + loot.type + ' / ' + loot.value);
          return;
        }

        availableCards.splice(availableCards.indexOf(replacement), 1, JSON.parse(JSON.stringify(loot)));
      }
    })

    return availableCards;
  }

  apply(deck: LootDeck, config: LootDeckConfig = {}) {
    deck.cards = [];
    Object.values(LootType).forEach((type) => {
      if (config[type]) {
        let availableTypes = this.fullLootDeck().filter((loot) => loot.type == type).map((value) => ({ value, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ value }) => value);;
        const count = Math.min(Math.max(config[type] || 0), availableTypes.length);
        for (let i = 0; i < count; i++) {
          deck.cards.push(availableTypes[i]);
        }
      }
    })
    this.shuffleDeck(deck);
  }

}
