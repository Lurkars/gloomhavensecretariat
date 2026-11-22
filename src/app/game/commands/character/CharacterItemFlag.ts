import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CharacterItemCommandImpl } from 'src/app/game/commands/character/CharacterItem';
import { ItemFlags } from 'src/app/game/model/data/ItemData';

export class CharacterItemFlagCommand extends CharacterItemCommandImpl {
  id: string = 'character.item.flag';
  requiredParameters: number = 5;

  validParameters(number: number, edition: string, id: string | number, flag: string, value: boolean): boolean {
    const character = this.character();
    const item = this.item();
    return (
      typeof value === 'boolean' &&
      !!character &&
      !!item &&
      !!this.equipped(character, item) &&
      Object.values(ItemFlags).includes(flag as ItemFlags) &&
      flag !== ItemFlags.slot &&
      flag !== ItemFlags.slotBack
    );
  }

  executeWithParameters(number: number, edition: string, id: string | number, flag: ItemFlags, value: boolean, force: boolean = false) {
    const character = this.character();
    const item = this.item();
    const equipped = character && item && this.equipped(character, item);
    if (character && item && equipped) {
      gameManager.itemManager.setItemFlag(item, character, flag, value, force);
    } else {
      this.executionError('character or equipped item not found');
    }
  }
}

export class CharacterItemFlagCountCommand extends CharacterItemCommandImpl {
  id: string = 'character.item.flagCount';
  requiredParameters: number = 5;

  validParameters(number: number, edition: string, id: string | number, flag: string, index: number): boolean {
    const character = this.character();
    const item = this.item();
    return (
      !!character &&
      !!item &&
      !!this.equipped(character, item) &&
      (flag === ItemFlags.slot || flag === ItemFlags.slotBack) &&
      typeof index === 'number' &&
      index >= 0
    );
  }

  executeWithParameters(number: number, edition: string, id: string | number, flag: ItemFlags, index: number) {
    const character = this.character();
    const item = this.item();
    const equipped = character && item && this.equipped(character, item);
    if (character && item && equipped) {
      gameManager.itemManager.setItemFlagCount(item, character, flag, index);
    } else {
      this.executionError('character or equipped item not found');
    }
  }
}
