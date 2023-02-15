import { ghsShuffleArray } from "src/app/ui/helper/Static";
import { Character } from "../model/Character";
import { Game } from "../model/Game";
import { appliableLootTypes, fullLootDeck, Loot, LootDeck, LootDeckConfig, LootType } from "../model/Loot";
import { settingsManager } from "./SettingsManager";

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

    if (settingsManager.settings.applyLoot && !settingsManager.settings.alwaysLootApplyDialog) {
      const activeCharacter = this.game.figures.find((figure) => figure instanceof Character && figure.active);
      const loot = deck.cards[deck.current];
      if (activeCharacter instanceof Character && loot) {
        activeCharacter.lootCards = activeCharacter.lootCards || [];
        if (loot.type == LootType.money || loot.type == LootType.special1 || loot.type == LootType.special2) {
          activeCharacter.loot += this.getValue(loot);
        }
        activeCharacter.lootCards.push(deck.current);
      }
    }
  }

  shuffleDeck(deck: LootDeck) {
    deck.current = -1;
    ghsShuffleArray(deck.cards);
  }

  addCharacterLoot(character: Character, loot: Loot) {
    const value = this.getValue(loot);
    if (loot.type == LootType.money || loot.type == LootType.special1 || loot.type == LootType.special2) {
      character.loot += value;
    } else if (appliableLootTypes.indexOf(loot.type) != -1) {
      const current = character.progress.loot[loot.type] || 0;
      if (current + value >= 0) {
        character.progress.loot[loot.type] = current + value;
      }
    }
  }

  getValue(loot: Loot): number {
    const charCount = this.game.figures.filter((figure) => figure instanceof Character && !figure.absent).length;
    let value = loot.value4P;
    if (charCount <= 2) {
      value = loot.value2P;
    } else if (charCount == 3) {
      value = loot.value3P;
    }

    value += loot.enhancements;

    return value;
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
        const replacement = availableCards.find((other) => other.type == loot.type && other.value2P == loot.value2P && other.value3P == loot.value3P && other.value4P == loot.value4P && other.enhancements == 0);
        if (!replacement) {
          console.warn('Enhancement of non-available loot card: ' + loot.type + ':' + loot.value4P + ':' + loot.value3P + ':' + loot.value2P);
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
      let availableTypes: Loot[] = ghsShuffleArray(this.fullLootDeck().filter((loot) => loot.type == type)) as Loot[];
      const count = Math.min(Math.max(config[type] || 0), availableTypes.length);
      if (type != LootType.special1 && type != LootType.special2) {
        for (let i = 0; i < count; i++) {
          const loot: Loot = availableTypes[i];
          deck.cards.push(loot);
        }
      } else if (count > 0) {
        const loot: Loot = availableTypes[0];
        deck.cards.push(loot);
        if (this.game.lootDeckFixed.indexOf(loot.type) == -1) {
          this.game.lootDeckFixed.push(loot.type);
        }
      } else {
        this.game.lootDeckFixed = this.game.lootDeckFixed.filter((lootType) => lootType != type);
        deck.cards = deck.cards.filter((loot) => loot.type != type);
      }
    })
    this.shuffleDeck(deck);
  }

  valueLabel(loot: Loot): string {
    if (loot.value4P == loot.value3P && loot.value3P == loot.value2P) {
      return "" + (loot.value4P > 0 ? loot.value4P : "")
    } else if (loot.value4P == loot.value3P && loot.value3P != loot.value2P) {
      return "%game.loot.player.3-4% +" + loot.value4P + "/%game.loot.player.2% +" + loot.value2P;
    } else if (loot.value4P != loot.value3P && loot.value3P == loot.value2P) {
      return "%game.loot.player.4% +" + loot.value4P + "/%game.loot.player.2-3% +" + loot.value2P;
    } else {
      return "%game.loot.player.4% +" + loot.value4P + "/%game.loot.player.3% +" + loot.value3P + "/%game.loot.player.2% +" + loot.value2P;
    }
  }

}
