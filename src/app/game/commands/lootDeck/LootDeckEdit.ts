import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { deckMoveCard, deckTargetValid, validSeed } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { enhancableLootTypes, Loot, LootDeckConfig, LootType } from 'src/app/game/model/data/Loot';

function remapLootCards(from: number, to: number) {
  gameManager.game.figures.forEach((figure) => {
    if (figure instanceof Character && figure.lootCards) {
      figure.lootCards = figure.lootCards
        .map((index) => {
          if (from < to && index > from && index <= to) {
            index--;
          } else if (from > to && index >= to && index < from) {
            index++;
          } else if (index === from) {
            index = to;
          }
          return index;
        })
        .sort((a, b) => a - b);
    }
  });
}

export function lootCardIndex(cardId: BASE_TYPE | undefined): number {
  return typeof cardId === 'number' ? gameManager.game.lootDeck.cards.findIndex((loot) => loot.cardId === cardId) : -1;
}

function dropUpcomingLootCards() {
  gameManager.game.figures.forEach((figure) => {
    if (figure instanceof Character) {
      figure.lootCards = figure.lootCards.filter((index) => index <= gameManager.game.lootDeck.current);
    }
  });
}

export class LootDeckShuffleCommand extends CommandImpl {
  id: string = 'lootDeck.shuffle';
  requiredParameters: number = 1;

  validParameters(seed: number, upcoming: boolean = false): boolean {
    return gameManager.game.lootDeck.cards.length > 0 && typeof upcoming === 'boolean' && validSeed(seed);
  }

  executeWithParameters(seed: number, upcoming: boolean = false) {
    gameManager.game.seed = seed;
    gameManager.lootManager.shuffleDeck(gameManager.game.lootDeck, upcoming);
    dropUpcomingLootCards();
  }
}

export class LootDeckMoveCommand extends CommandImpl {
  id: string = 'lootDeck.move';
  requiredParameters: number = 3;

  validParameters(cardId: number, toList: string, toIndex: number): boolean {
    return lootCardIndex(cardId) !== -1 && deckTargetValid(toList, toIndex);
  }

  executeWithParameters(cardId: number, toList: string, toIndex: number) {
    const deck = gameManager.game.lootDeck;
    const result = deckMoveCard(deck.current, lootCardIndex(cardId), toList, toIndex, deck.cards);
    deck.current = result.current;
    remapLootCards(result.from, result.to);
    dropUpcomingLootCards();
  }
}

export class LootDeckRemoveCardCommand extends CommandImpl {
  id: string = 'lootDeck.removeCard';
  requiredParameters: number = 1;

  validParameters(cardId: number): boolean {
    return lootCardIndex(cardId) !== -1;
  }

  executeWithParameters(cardId: number) {
    const deck = gameManager.game.lootDeck;
    const index = lootCardIndex(cardId);
    if (index <= deck.current) {
      deck.current--;
    }
    deck.cards.splice(index, 1);
    gameManager.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        figure.lootCards = figure.lootCards.filter((i) => i !== index).map((i) => (i < index ? i : i - 1));
      }
    });
  }
}

export class LootDeckEnhancementCommand extends CommandImpl {
  id: string = 'lootDeck.enhancement';
  requiredParameters: number = 2;

  enhancementDeck(): Loot[] {
    return gameManager.lootManager
      .fullLootDeck()
      .filter((loot) => enhancableLootTypes.includes(loot.type))
      .sort((a, b) => a.cardId - b.cardId);
  }

  validParameters(cardId: number, value: number): boolean {
    const loot = this.enhancementDeck().find((loot) => loot.cardId === cardId);
    return !!loot && (value === 1 || (value === -1 && loot.enhancements > 0));
  }

  executeWithParameters(cardId: number, value: number) {
    const enhancementDeck = this.enhancementDeck();
    const loot = enhancementDeck.find((loot) => loot.cardId === cardId);
    if (loot) {
      loot.enhancements += value;
      gameManager.game.lootDeckEnhancements = enhancementDeck.filter((loot) => loot.enhancements > 0);
    } else {
      this.executionError('loot card not found');
    }
  }
}

export class LootDeckFixedCommand extends CommandImpl {
  id: string = 'lootDeck.fixed';
  requiredParameters: number = 2;

  validParameters(type: string, value: boolean): boolean {
    return Object.values(LootType).includes(type as LootType) && typeof value === 'boolean';
  }

  executeWithParameters(type: LootType, value: boolean) {
    gameManager.game.lootDeckFixed = gameManager.game.lootDeckFixed.filter((fixed) => fixed !== type);
    if (value) {
      gameManager.game.lootDeckFixed.push(type);
    }
  }
}
export class LootDeckConfigCommand extends CommandImpl {
  id: string = 'lootDeck.config';
  requiredParameters: number = 3;

  pairs(): BASE_TYPE[] {
    return this.parameters.slice(1);
  }

  config(): LootDeckConfig {
    const pairs = this.pairs();
    const config: LootDeckConfig = {};
    for (let i = 0; i < pairs.length; i += 2) {
      config[pairs[i] as LootType] = pairs[i + 1] as number;
    }
    return config;
  }

  validParameters(seed: number): boolean {
    const pairs = this.pairs();
    return (
      pairs.length % 2 === 0 &&
      validSeed(seed) &&
      pairs.every((value, index) =>
        index % 2 === 0 ? Object.values(LootType).includes(value as LootType) : typeof value === 'number' && value >= 0
      )
    );
  }

  executeWithParameters(seed: number) {
    gameManager.game.seed = seed;
    gameManager.lootManager.apply(gameManager.game.lootDeck, this.config());
    dropUpcomingLootCards();
  }
}

export class LootDeckActiveCommand extends CommandImpl {
  id: string = 'lootDeck.active';
  requiredParameters: number = 1;

  validParameters(active: boolean): boolean {
    return typeof active === 'boolean';
  }

  executeWithParameters(active: boolean) {
    gameManager.game.lootDeck.active = active;
  }
}
