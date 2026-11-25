import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, findItem } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';

export abstract class CharacterItemCommandImpl extends CommandImpl {
  character(): Character | undefined {
    return findCharacter(this.parameters[0]);
  }

  item(): ItemData | undefined {
    return findItem(this.parameters[1], this.parameters[2]);
  }

  equipped(character: Character, item: ItemData): AdditionalIdentifier | undefined {
    return gameManager.itemManager.equippedItem(item, character);
  }
}

abstract class SimpleItemCommandImpl extends CharacterItemCommandImpl {
  abstract valid(character: Character, item: ItemData): boolean;

  abstract apply(character: Character, item: ItemData): void;

  validParameters(): boolean {
    const character = this.character();
    const item = this.item();
    return !!character && !!item && this.valid(character, item);
  }

  executeWithParameters() {
    const character = this.character();
    const item = this.item();
    if (character && item) {
      this.apply(character, item);
    } else {
      this.executionError('character or item not found');
    }
  }
}

export class CharacterItemAddCommand extends SimpleItemCommandImpl {
  id: string = 'character.item.add';
  requiredParameters: number = 3;

  force(): boolean {
    return this.parameters[3] === true;
  }

  valid(character: Character, item: ItemData): boolean {
    return (
      [undefined, true, false].includes(this.parameters[3] as boolean) && gameManager.itemManager.canAddItem(item, character, this.force())
    );
  }

  apply(character: Character, item: ItemData) {
    gameManager.itemManager.addItem(item, character, this.force());
  }
}

export class CharacterItemBuyCommand extends SimpleItemCommandImpl {
  id: string = 'character.item.buy';
  requiredParameters: number = 3;

  valid(character: Character, item: ItemData): boolean {
    return gameManager.itemManager.canBuy(item, character);
  }

  apply(character: Character, item: ItemData) {
    gameManager.itemManager.buyItem(item, character);
  }
}

export class CharacterItemCraftCommand extends SimpleItemCommandImpl {
  id: string = 'character.item.craft';
  requiredParameters: number = 3;

  valid(character: Character, item: ItemData): boolean {
    return gameManager.itemManager.canCraft(item, character);
  }

  apply(character: Character, item: ItemData) {
    gameManager.itemManager.craftItem(item, character);
  }
}

export class CharacterItemRemoveCommand extends SimpleItemCommandImpl {
  id: string = 'character.item.remove';
  requiredParameters: number = 3;

  valid(character: Character, item: ItemData): boolean {
    return gameManager.itemManager.canRemoveItem(item, character);
  }

  apply(character: Character, item: ItemData) {
    gameManager.itemManager.removeItem(item, character);
  }
}

export class CharacterItemSellCommand extends SimpleItemCommandImpl {
  id: string = 'character.item.sell';
  requiredParameters: number = 3;

  valid(character: Character, item: ItemData): boolean {
    return gameManager.itemManager.canSellItem(item, character);
  }

  apply(character: Character, item: ItemData) {
    gameManager.itemManager.sellItem(item, character);
  }
}

export class CharacterItemEquipCommand extends SimpleItemCommandImpl {
  id: string = 'character.item.equip';
  requiredParameters: number = 4;

  force(): boolean {
    return this.parameters[4] === true;
  }

  valid(character: Character, item: ItemData): boolean {
    const value = this.parameters[3];
    return (
      typeof value === 'boolean' &&
      [undefined, true, false].includes(this.parameters[4] as boolean) &&
      gameManager.itemManager.isEquipped(item, character) !== value &&
      gameManager.itemManager.canToggleEquippedItem(item, character, this.force())
    );
  }

  apply(character: Character, item: ItemData) {
    gameManager.itemManager.toggleEquippedItemWithOwnership(item, character, this.force());
  }
}

export class CharacterItemDistillCommand extends SimpleItemCommandImpl {
  id: string = 'character.item.distill';
  requiredParameters: number = 4;

  valid(character: Character, item: ItemData): boolean {
    return gameManager.itemManager.canDistillItem(item, character, this.parameters[3] as LootType);
  }

  apply(character: Character, item: ItemData) {
    gameManager.itemManager.distillItem(item, character, this.parameters[3] as LootType);
  }
}

export class CharacterItemShareCommand extends SimpleItemCommandImpl {
  id: string = 'character.item.share';
  requiredParameters: number = 4;

  valid(character: Character, item: ItemData): boolean {
    const target = findCharacter(this.parameters[3]);
    return !!target && gameManager.itemManager.canShareItem(item, character, target);
  }

  apply(character: Character, item: ItemData) {
    const target = findCharacter(this.parameters[3]);
    if (target) {
      gameManager.itemManager.shareItem(item, character, target);
    } else {
      this.executionError('target character not found');
    }
  }
}
