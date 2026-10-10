import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, findItem, validSeed } from 'src/app/game/commands/CommandHelper';
import { lootCardIndex } from 'src/app/game/commands/lootDeck/LootDeckEdit';
import { Character } from 'src/app/game/model/Character';
import { AdditionalIdentifier, Identifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';
import { GameScenarioModel } from 'src/app/game/model/Scenario';

const RANDOM_ITEM_MARKER = 'loot-random-item';

function applyRandomItem(character: Character, index: number, item: ItemData) {
  gameManager.itemManager.addItemCount(item);
  if (!character.lootCards.includes(index)) {
    character.lootCards.push(index);
    character.lootCards.sort((a, b) => a - b);
  }
  if (character.progress.items.some((existing) => existing.name === '' + item.id && existing.edition === item.edition)) {
    character.progress.gold += gameManager.itemManager.itemSellValue(item);
  } else {
    const itemIdentifier: Identifier = new Identifier(item.id, item.edition);
    character.progress.items.push(itemIdentifier);
    character.progress.equippedItems.push(
      new AdditionalIdentifier(itemIdentifier.name, itemIdentifier.edition, undefined, RANDOM_ITEM_MARKER)
    );
  }
}

function removeRandomItem(character: Character): AdditionalIdentifier | undefined {
  const randomItemIdentifier = character.progress.equippedItems.find((value) => value.marker === RANDOM_ITEM_MARKER);
  if (randomItemIdentifier) {
    character.progress.items = character.progress.items.filter(
      (value) => value.edition !== randomItemIdentifier.edition || value.name !== randomItemIdentifier.name
    );
    character.progress.equippedItems = character.progress.equippedItems.filter((value) => value !== randomItemIdentifier);
  }
  return randomItemIdentifier;
}

export class LootDeckAssignCommand extends CommandImpl {
  id: string = 'lootDeck.assign';
  requiredParameters: number = 3;

  holder(index: BASE_TYPE): Character | undefined {
    return gameManager.game.figures.find((figure) => figure instanceof Character && figure.lootCards.includes(index as number)) as
      Character | undefined;
  }

  validParameters(cardId: number, number: number, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    const index = lootCardIndex(cardId);
    const character = findCharacter(number);
    return index !== -1 && index <= gameManager.game.lootDeck.current && (number === -1 || !!character) && this.holder(index) !== character;
  }

  executeWithParameters(cardId: number, number: number, seed: number) {
    gameManager.game.seed = seed;
    const index = lootCardIndex(cardId);
    const loot = gameManager.game.lootDeck.cards[index];
    const holder = this.holder(index);
    const character = findCharacter(number);
    let randomItem: ItemData | undefined;

    if (holder) {
      holder.lootCards = holder.lootCards.filter((value) => value !== index);
      if (loot.type === LootType.money) {
        holder.loot -= gameManager.lootManager.getValue(loot);
      } else if (loot.type === LootType.random_item) {
        const randomItemIdentifier = removeRandomItem(holder);
        if (randomItemIdentifier) {
          randomItem = gameManager.itemManager.getItem(randomItemIdentifier.name, randomItemIdentifier.edition, true);
        }
      }
    }

    if (character) {
      if (loot.type === LootType.random_item && randomItem) {
        applyRandomItem(character, index, randomItem);
      } else {
        const result = gameManager.lootManager.applyLoot(loot, character, index);
        if (result) {
          applyRandomItem(character, index, result);
        }
      }
    }
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
      applyRandomItem(character, lootCardIndex(cardId), item);
    } else {
      this.executionError('character or item not found');
    }
  }
}

export class LootDeckSectionCommand extends CommandImpl {
  id: string = 'lootDeck.section';
  requiredParameters: number = 2;

  has(section: BASE_TYPE): boolean {
    return gameManager.game.party.conclusions.some((model) => model.edition === gameManager.currentEdition() && model.index === section);
  }

  validParameters(section: string, value: boolean): boolean {
    return typeof section === 'string' && !!section && typeof value === 'boolean' && this.has(section) !== value;
  }

  executeWithParameters(section: string, value: boolean) {
    if (!value) {
      gameManager.game.party.conclusions = gameManager.game.party.conclusions.filter(
        (model) => model.edition !== gameManager.currentEdition() || model.index !== section
      );
    } else {
      gameManager.game.lootDeckSections.push(section);
      gameManager.game.party.conclusions.push(new GameScenarioModel(section, gameManager.currentEdition()));
    }
  }
}
