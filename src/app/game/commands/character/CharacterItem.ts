import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, findItem } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';

export abstract class CharacterItemCommandImpl extends CommandImpl {
  character(): Character | undefined {
    return findCharacter(this.parameters[0]);
  }

  item(): ItemData | undefined {
    return findItem(this.parameters[1], this.parameters[2]);
  }

  owned(character: Character, item: ItemData): boolean {
    return character.progress.items.some((identifier) => identifier.name === '' + item.id && identifier.edition === item.edition);
  }

  equipped(character: Character, item: ItemData): AdditionalIdentifier | undefined {
    return character.progress.equippedItems.find((identifier) => identifier.name === '' + item.id && identifier.edition === item.edition);
  }
}

export class CharacterItemAddCommand extends CharacterItemCommandImpl {
  id: string = 'character.item.add';
  requiredParameters: number = 3;

  validParameters(): boolean {
    const character = this.character();
    const item = this.item();
    return !!character && !!item && !this.owned(character, item);
  }

  executeWithParameters() {
    const character = this.character();
    const item = this.item();
    if (character && item) {
      gameManager.itemManager.addItem(item, character);
    } else {
      this.executionError('character or item not found');
    }
  }
}

export class CharacterItemBuyCommand extends CharacterItemCommandImpl {
  id: string = 'character.item.buy';
  requiredParameters: number = 3;

  validParameters(): boolean {
    const character = this.character();
    const item = this.item();
    return !!character && !!item && gameManager.itemManager.canBuy(item, character);
  }

  executeWithParameters() {
    const character = this.character();
    const item = this.item();
    if (character && item) {
      gameManager.itemManager.buyItem(item, character);
    } else {
      this.executionError('character or item not found');
    }
  }
}

export class CharacterItemCraftCommand extends CharacterItemCommandImpl {
  id: string = 'character.item.craft';
  requiredParameters: number = 3;

  validParameters(): boolean {
    const character = this.character();
    const item = this.item();
    return !!character && !!item && gameManager.itemManager.canCraft(item, character);
  }

  executeWithParameters() {
    const character = this.character();
    const item = this.item();
    if (character && item) {
      gameManager.itemManager.craftItem(item, character);
    } else {
      this.executionError('character or item not found');
    }
  }
}

export class CharacterItemRemoveCommand extends CharacterItemCommandImpl {
  id: string = 'character.item.remove';
  requiredParameters: number = 3;

  validParameters(): boolean {
    const character = this.character();
    const item = this.item();
    return !!character && !!item && this.owned(character, item);
  }

  executeWithParameters() {
    const character = this.character();
    const item = this.item();
    if (character && item) {
      gameManager.itemManager.removeItem(item, character);
    } else {
      this.executionError('character or item not found');
    }
  }
}

export class CharacterItemSellCommand extends CharacterItemCommandImpl {
  id: string = 'character.item.sell';
  requiredParameters: number = 3;

  validParameters(): boolean {
    const character = this.character();
    const item = this.item();
    return !!character && !!item && this.owned(character, item) && gameManager.itemManager.itemSellValue(item) > 0;
  }

  executeWithParameters() {
    const character = this.character();
    const item = this.item();
    if (character && item) {
      gameManager.itemManager.sellItem(item, character);
    } else {
      this.executionError('character or item not found');
    }
  }
}

export class CharacterItemEquipCommand extends CharacterItemCommandImpl {
  id: string = 'character.item.equip';
  requiredParameters: number = 4;

  validParameters(number: number, edition: string, id: string | number, value: boolean, force: boolean = false): boolean {
    const character = this.character();
    const item = this.item();
    return !!character && !!item && typeof value === 'boolean' && (!value || this.owned(character, item) || gameManager.bbRules() || force);
  }

  executeWithParameters(number: number, edition: string, id: string | number, value: boolean, force: boolean = false) {
    const character = this.character();
    const item = this.item();
    if (character && item) {
      if (!!this.equipped(character, item) === value) {
        return;
      }
      const owned = this.owned(character, item);
      gameManager.itemManager.toggleEquippedItem(item, character, force);
      if (gameManager.bbRules()) {
        if (!this.equipped(character, item) && owned) {
          gameManager.itemManager.removeItem(item, character);
        } else if (this.equipped(character, item) && !owned) {
          gameManager.itemManager.addItem(item, character);
        }
      }
    } else {
      this.executionError('character or item not found');
    }
  }
}

export class CharacterItemDistillCommand extends CharacterItemCommandImpl {
  id: string = 'character.item.distill';
  requiredParameters: number = 4;

  validParameters(number: number, edition: string, id: string | number, resource: string): boolean {
    const character = this.character();
    const item = this.item();
    if (!character || !item || !this.owned(character, item) || !gameManager.itemManager.canDistill(item)) {
      return false;
    }
    if (item.resourcesAny && item.resourcesAny.length) {
      return true;
    }
    return Object.keys(item.resources || {}).includes(resource);
  }

  executeWithParameters(number: number, edition: string, id: string | number, resource: string) {
    const character = this.character();
    const item = this.item();
    if (character && item) {
      const lootType = resource as keyof typeof character.progress.loot;
      gameManager.itemManager.removeItem(item, character);
      character.progress.loot[lootType] = (character.progress.loot[lootType] || 0) + 1;
    } else {
      this.executionError('character or item not found');
    }
  }
}

export class CharacterItemShareCommand extends CharacterItemCommandImpl {
  id: string = 'character.item.share';
  requiredParameters: number = 4;

  validParameters(number: number, edition: string, id: string | number, target: number): boolean {
    const character = this.character();
    const item = this.item();
    const targetCharacter = findCharacter(target);
    return (
      !!character &&
      !!item &&
      !!targetCharacter &&
      character !== targetCharacter &&
      this.owned(character, item) &&
      !this.owned(targetCharacter, item)
    );
  }

  executeWithParameters(number: number, edition: string, id: string | number, target: number) {
    const character = this.character();
    const item = this.item();
    const targetCharacter = findCharacter(target);
    if (character && item && targetCharacter) {
      gameManager.itemManager.removeItem(item, character);
      gameManager.itemManager.addItem(item, targetCharacter);
    } else {
      this.executionError('character or item not found');
    }
  }
}
