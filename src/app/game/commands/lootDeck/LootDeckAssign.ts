import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, findItem, validSeed } from 'src/app/game/commands/CommandHelper';
import { lootCardIndex } from 'src/app/game/commands/lootDeck/LootDeckEdit';
import { LootType } from 'src/app/game/model/data/Loot';

export class LootDeckAssignCommand extends CommandImpl {
  id: string = 'lootDeck.assign';
  requiredParameters: number = 3;

  validParameters(cardId: number, number: number, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    const index = lootCardIndex(cardId);
    const character = findCharacter(number);
    return (
      index !== -1 &&
      index <= gameManager.game.lootDeck.current &&
      (number === -1 || !!character) &&
      gameManager.lootManager.lootCardHolder(index) !== character
    );
  }

  executeWithParameters(cardId: number, number: number, seed: number) {
    gameManager.game.seed = seed;
    gameManager.lootManager.assignLootCard(lootCardIndex(cardId), findCharacter(number), true);
  }
}

export class LootDeckRandomItemCommand extends CommandImpl {
  id: string = 'lootDeck.randomItem';
  requiredParameters: number = 4;

  validParameters(cardId: number, number: number, edition: string, id: string | number): boolean {
    const loot = gameManager.game.lootDeck.cards[lootCardIndex(cardId)];
    return !!loot && loot.type === LootType.random_item && !!findCharacter(number) && !!findItem(edition, id);
  }

  executeWithParameters(cardId: number, number: number, edition: string, id: string | number) {
    const character = findCharacter(number);
    const item = findItem(edition, id);
    if (character && item) {
      gameManager.lootManager.applyRandomItem(character, lootCardIndex(cardId), item);
    } else {
      this.executionError('character or item not found');
    }
  }
}

export class LootDeckSectionCommand extends CommandImpl {
  id: string = 'lootDeck.section';
  requiredParameters: number = 2;

  validParameters(section: string, value: boolean): boolean {
    return (
      typeof section === 'string' &&
      !!section &&
      typeof value === 'boolean' &&
      gameManager.lootManager.lootDeckSectionApplied(section) !== value
    );
  }

  executeWithParameters(section: string, value: boolean) {
    if (value) {
      gameManager.lootManager.addLootDeckSection(section);
    } else {
      gameManager.lootManager.removeLootDeckSection(section);
    }
  }
}
