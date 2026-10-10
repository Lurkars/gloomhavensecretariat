import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { BASE_TYPE } from 'src/app/game/commands/Command';
import { CharacterItemCommandImpl } from 'src/app/game/commands/character/CharacterItem';
import { Character } from 'src/app/game/model/Character';
import { ItemData, ItemFlags } from 'src/app/game/model/data/ItemData';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';

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
      equipped.tags = equipped.tags || [];
      if (equipped.tags.includes(flag) === value) {
        return;
      }
      if (value) {
        const wasConsumed = equipped.tags.includes(ItemFlags.consumed);
        if (
          !force &&
          gameManager.challengesManager.apply &&
          gameManager.challengesManager.isActive(1507, 'fh') &&
          flag === ItemFlags.spent
        ) {
          equipped.tags.push(ItemFlags.consumed);
        } else {
          equipped.tags.push(flag);
        }
        if (!wasConsumed && equipped.tags.includes(ItemFlags.consumed) && item.slot) {
          gameManager.personalQuestManager.trackPersonalQuestProgress(
            character,
            PersonalQuestAutotrackType.itemConsumed,
            item.slot as string
          );
        }
      } else {
        equipped.tags = equipped.tags.filter((tag) => tag !== flag);
        if (flag === ItemFlags.spent) {
          equipped.tags = equipped.tags.filter((tag) => tag !== ItemFlags.slot && tag !== ItemFlags.slotBack);
        }
      }

      if (
        (flag === ItemFlags.consumed || flag === ItemFlags.spent) &&
        equipped.tags.includes(flag) &&
        settingsManager.settings.characterItemsApply
      ) {
        gameManager.itemManager.applyItemEffects(character, item, true);
      }
    } else {
      this.executionError('character or equipped item not found');
    }
  }
}

export class CharacterItemFlagCountCommand extends CharacterItemCommandImpl {
  id: string = 'character.item.flagCount';
  requiredParameters: number = 5;

  count(character: Character, item: ItemData, flag: BASE_TYPE): number {
    const equipped = this.equipped(character, item);
    return (equipped && equipped.tags && equipped.tags.filter((tag) => tag === flag).length) || 0;
  }

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
      equipped.tags = equipped.tags || [];
      const count = this.count(character, item, flag);
      if (count <= index) {
        for (let i = count; i <= index; i++) {
          equipped.tags.push(flag);
        }
        if (flag === ItemFlags.slot && this.count(character, item, flag) === item.slots) {
          if (item.spent && !this.count(character, item, ItemFlags.spent)) {
            equipped.tags.push(ItemFlags.spent);
          } else if (item.consumed && !this.count(character, item, ItemFlags.consumed)) {
            equipped.tags.push(ItemFlags.consumed);
          }
        }
      } else {
        for (let i = index; i < count; i++) {
          equipped.tags.splice(equipped.tags.indexOf(flag), 1);
        }
      }
    } else {
      this.executionError('character or equipped item not found');
    }
  }
}
