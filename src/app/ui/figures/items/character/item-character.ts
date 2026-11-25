import { NgClass } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { LOOT_RANDOM_ITEM_MARKER } from 'src/app/game/businesslogic/LootManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemData, ItemFlags } from 'src/app/game/model/data/ItemData';
import { GameState } from 'src/app/game/model/Game';
import { ItemComponent } from 'src/app/ui/figures/items/item/item';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

@Component({
  imports: [ItemComponent, NgClass, PointerInputDirective],
  selector: 'ghs-character-item',
  templateUrl: './item-character.html',
  styleUrls: ['./item-character.scss']
})
export class CharacterItemComponent {
  private ghsManager = inject(GhsManager);

  readonly inputCharacter = input.required<Character>({ alias: 'character' });
  get character(): Character {
    return this.inputCharacter();
  }

  readonly inputItem = input.required<ItemData>({ alias: 'item' });
  get item(): ItemData {
    return this.inputItem();
  }

  readonly flipped = input<boolean>(true);
  readonly setup = input<boolean>(false);
  readonly dialog = input<boolean>(false);
  readonly selected = input<boolean | undefined>(undefined);
  readonly clicked = output<boolean>();

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  ItemFlags = ItemFlags;
  GameState = GameState;

  equipped(): AdditionalIdentifier | undefined {
    return this.character.progress.equippedItems.find(
      (identifier) => identifier.name === '' + this.item.id && identifier.edition === this.item.edition
    );
  }

  bbBlocked(): boolean {
    return gameManager.itemManager.equipBlocked(this.item, this.character);
  }

  isLootRandomItem() {
    return this.character.progress.equippedItems.find(
      (identifier) =>
        identifier.name === '' + this.item.id && identifier.edition === this.item.edition && identifier.marker === LOOT_RANDOM_ITEM_MARKER
    );
  }

  toggleEquippedItem(force: boolean = false) {
    if ((this.setup() || force) && gameManager.itemManager.canToggleEquippedItem(this.item, this.character, force)) {
      gameManager.stateManager.before(
        this.equipped() ? 'unequipItem' : 'equipItem',
        gameManager.characterManager.characterName(this.character, true, true),
        this.item.id,
        this.item.edition
      );
      gameManager.itemManager.toggleEquippedItemWithOwnership(this.item, this.character, force);
      gameManager.stateManager.after();

      if (settingsManager.settings.animations) {
        setTimeout(() => {
          this.ghsManager.triggerUiChange();
        }, 500 * settingsManager.settings.animationSpeed);
      }
    }
  }

  bodyClicked(event: Event, force: boolean) {
    if (!(event.target instanceof Element) || !event.target.closest('.interactive')) {
      this.clicked.emit(force);
    }
  }

  countFlag(flag: string): number {
    return gameManager.itemManager.itemFlagCount(this.item, this.character, flag as ItemFlags);
  }

  toggleFlag(force: boolean, flag: string) {
    if (gameManager.itemManager.itemFlagBlocked(this.item, force)) {
      return;
    }

    if ((!this.setup() && gameManager.game.state === GameState.next) || force) {
      const equipped = this.equipped();
      if (equipped && (gameManager.itemManager.itemUsable(this.item) || force)) {
        equipped.tags = equipped.tags || [];
        gameManager.stateManager.before(
          (!equipped.tags.includes(flag) ? 'characterItemApply.' : 'characterItemUnapply.') + flag,
          gameManager.characterManager.characterName(this.character, true, true),
          this.item.id,
          this.item.edition,
          this.item.name
        );
        gameManager.itemManager.setItemFlag(this.item, this.character, flag as ItemFlags, !equipped.tags.includes(flag), force);
        gameManager.stateManager.after();

        if (settingsManager.settings.animations) {
          setTimeout(() => {
            this.ghsManager.triggerUiChange();
          }, 500 * settingsManager.settings.animationSpeed);
        }
      }
    }
  }

  toggleFlagCount(index: number, flag: string) {
    if (!this.setup() && gameManager.game.state === GameState.next) {
      const equipped = this.equipped();
      if (equipped) {
        const count = this.countFlag(flag);
        gameManager.stateManager.before(
          (count <= index ? 'characterItemApply.' : 'characterItemUnapply.') + flag,
          gameManager.characterManager.characterName(this.character, true, true),
          this.item.id,
          this.item.edition,
          this.item.name
        );
        gameManager.itemManager.setItemFlagCount(this.item, this.character, flag as ItemFlags, index);
        gameManager.stateManager.after();

        if (settingsManager.settings.animations) {
          setTimeout(() => {
            this.ghsManager.triggerUiChange();
          }, 500 * settingsManager.settings.animationSpeed);
        }
      }
    }
  }

  slotsMarked(flag: string): string[] {
    const marked: string[] = [];
    for (let i = 0; i < this.countFlag(flag); i++) {
      marked.push(this.character.name);
    }
    return marked;
  }
}
