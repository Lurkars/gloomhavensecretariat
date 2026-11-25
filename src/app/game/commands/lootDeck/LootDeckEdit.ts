import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { deckTargetValid, validSeed } from 'src/app/game/commands/CommandHelper';
import { Loot, LootDeckConfig, LootType } from 'src/app/game/model/data/Loot';
import { deckCardList } from 'src/app/game/util/deck';

export function lootCardIndex(cardId: BASE_TYPE | undefined): number {
  return typeof cardId === 'number' ? gameManager.game.lootDeck.cards.findIndex((loot) => loot.cardId === cardId) : -1;
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
    gameManager.lootManager.dropUpcomingLootCards(gameManager.game.lootDeck);
  }
}

export class LootDeckMoveCommand extends CommandImpl {
  id: string = 'lootDeck.move';
  requiredParameters: number = 3;

  validParameters(cardId: number, toList: string, toIndex: number): boolean {
    const deck = gameManager.game.lootDeck;
    const index = lootCardIndex(cardId);
    if (index === -1 || !deckTargetValid(toList, toIndex)) {
      return false;
    }
    const position = deckCardList(deck.current, index);
    return gameManager.lootManager.canMoveCard(deck, position.list, position.index, toList, toIndex);
  }

  executeWithParameters(cardId: number, toList: string, toIndex: number) {
    const deck = gameManager.game.lootDeck;
    const position = deckCardList(deck.current, lootCardIndex(cardId));
    gameManager.lootManager.moveCard(deck, position.list, position.index, toList, toIndex);
  }
}

export class LootDeckRemoveCardCommand extends CommandImpl {
  id: string = 'lootDeck.removeCard';
  requiredParameters: number = 1;

  validParameters(cardId: number): boolean {
    return gameManager.lootManager.canRemoveCard(gameManager.game.lootDeck, lootCardIndex(cardId));
  }

  executeWithParameters(cardId: number) {
    gameManager.lootManager.removeCard(gameManager.game.lootDeck, lootCardIndex(cardId));
  }
}

export class LootDeckEnhancementCommand extends CommandImpl {
  id: string = 'lootDeck.enhancement';
  requiredParameters: number = 2;

  enhancementDeck(): Loot[] {
    return gameManager.lootManager.enhancementDeck();
  }

  validParameters(cardId: number, value: number): boolean {
    const loot = this.enhancementDeck().find((loot) => loot.cardId === cardId);
    return !!loot && (value === 1 || (value === -1 && loot.enhancements > 0));
  }

  executeWithParameters(cardId: number, value: number) {
    const enhancementDeck = this.enhancementDeck();
    const loot = enhancementDeck.find((loot) => loot.cardId === cardId);
    if (loot) {
      gameManager.lootManager.changeEnhancement(enhancementDeck, loot, value);
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
    gameManager.lootManager.setFixed(type, value);
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
    gameManager.lootManager.dropUpcomingLootCards(gameManager.game.lootDeck);
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
