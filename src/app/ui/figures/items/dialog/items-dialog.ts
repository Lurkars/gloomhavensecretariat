import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, labelManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { ItemData, ItemFlags, ItemSlot } from 'src/app/game/model/data/ItemData';
import { LootType, resourceLootTypes } from 'src/app/game/model/data/Loot';
import { ItemsBrewDialog } from 'src/app/ui/figures/items/brew/brew';
import { CharacterItemComponent } from 'src/app/ui/figures/items/character/item-character';
import { ItemDistillDialogComponent } from 'src/app/ui/figures/items/character/item-distill';
import { ItemShareDialogComponent } from 'src/app/ui/figures/items/character/item-share';
import { ItemDialogComponent } from 'src/app/ui/figures/items/dialog/item-dialog';
import { ItemComponent } from 'src/app/ui/figures/items/item/item';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsDialogClosingHelper, ghsTextSearch } from 'src/app/ui/helper/Static';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, FormsModule, GhsLabelDirective, PointerInputDirective, TrackUUIDPipe, ItemComponent, CharacterItemComponent],
  selector: 'ghs-items-dialog',
  templateUrl: './items-dialog.html',
  styleUrls: ['./items-dialog.scss']
})
export class ItemsDialogComponent implements OnInit {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  edition: string | undefined;
  currentEdition: string;
  editions: string[];
  editionItems: ItemData[] = [];
  items: ItemData[] = [];
  itemsMeta: {
    edition: string;
    id: number | string;
    canAdd: boolean;
    canBuy: boolean;
    canCraft: boolean;
    owned: boolean;
    assigned: number;
    countAvailable: number;
  }[] = [];
  selected: ItemData | undefined;
  character: Character | undefined;
  characters: Character[] = [];
  filter: string = '';
  all: boolean = false;
  owned: boolean = false;
  affordable: boolean = false;
  craftOnly: boolean = false;
  buyOnly: boolean = false;
  filteredOnly: boolean = false;
  sorted: boolean = false;
  itemSlots: (ItemSlot | 'undefined')[] = [];
  itemSlotUndefined: boolean = false;
  unlocks: ItemData[] = [];
  campaignMode: boolean = false;
  brewing: number = 0;
  lootTypes: LootType[] = [...resourceLootTypes];

  onlyEquipped: boolean = false;
  setup: boolean = false;
  specialItems: { item: ItemData; count: number }[] = [];

  ItemSlot: ItemSlot[] = Object.values(ItemSlot);
  ItemFlags = ItemFlags;

  data: {
    edition: string | undefined;
    select: Character | undefined;
    affordable: boolean;
    craftOnly: boolean;
    buyOnly: boolean;
    owned: boolean | undefined;
  } = inject(DIALOG_DATA);

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
    this.selected = undefined;
    this.character = this.data.select;
    this.sorted = this.character !== undefined && this.character.progress.items.length > 0;
    this.edition = this.data.edition;
    this.affordable = this.data.affordable || false;
    this.craftOnly = this.data.craftOnly || false;
    this.buyOnly = this.data.buyOnly || false;
    this.campaignMode = (this.edition && gameManager.game.party.campaignMode) || false;
    this.editions = this.edition ? gameManager.itemManager.itemEditions(this.edition) : gameManager.itemManager.itemEditions();
    this.all = this.edition === undefined;
    this.currentEdition = this.edition || this.editions[0];
    if (this.buyOnly) {
      this.lootTypes = [];
    }
    this.setup = this.isSetup();
    this.owned = this.data.owned ?? this.defaultOwned();
    this.onlyEquipped = this.owned && !this.setup;
    if (this.owned) {
      this.affordable = false;
    }
  }

  defaultOwned(): boolean {
    return !!this.character && !this.craftOnly && !this.buyOnly && (this.character.progress.items.length > 0 || gameManager.bbRules());
  }

  isSetup(): boolean {
    return !gameManager.scenarioManager.scenarioRunning();
  }

  ngOnInit() {
    this.updateEditionItems();
  }

  setEdition(edition: string) {
    this.currentEdition = edition;
    this.updateEditionItems();
  }

  updateEditionItems() {
    if (!this.all) {
      this.editions = this.edition && !this.campaignMode ? gameManager.itemManager.itemEditions(this.edition) : [];
    } else {
      this.editions = gameManager.itemManager.itemEditions();
    }

    if (!this.editions.includes(this.currentEdition)) {
      this.currentEdition = this.edition || this.editions[0];
    }

    this.editionItems =
      this.edition && this.campaignMode && !this.all
        ? gameManager.itemManager.getItems(this.edition)
        : gameManager.itemManager.getItems(this.currentEdition, this.all).filter((itemData) => itemData.edition === this.currentEdition);
    if (this.all) {
      this.sorted = false;
    }
    this.update();
  }

  brewDialog(force: boolean = false) {
    if (!gameManager.itemManager.brewingBlocked() || force) {
      this.dialog.open(ItemsBrewDialog, {
        panelClass: ['dialog'],
        data: this.character
      });
    }
  }

  matchesFilter(itemData: ItemData): boolean {
    return (
      !this.filter ||
      ghsTextSearch(itemData.name, this.filter) ||
      ghsTextSearch(labelManager.getLabel('data.items.' + itemData.edition + '-' + itemData.id), this.filter) ||
      ghsTextSearch(
        '' +
          (typeof itemData.id === 'number' && itemData.id < 100 ? '0' : '') +
          (typeof itemData.id === 'number' && itemData.id < 10 ? '0' : '') +
          itemData.id,
        this.filter
      )
    );
  }

  applySlotFilter() {
    this.itemSlotUndefined = this.items.find((itemData) => !itemData.slot) !== undefined;

    if (!this.itemSlotUndefined) {
      this.itemSlots = this.itemSlots.filter((value) => value !== 'undefined');
    }

    if (this.itemSlots.length > 0) {
      this.items = this.items.filter(
        (itemData) => (itemData.slot && this.itemSlots.includes(itemData.slot)) || (!itemData.slot && this.itemSlots.includes('undefined'))
      );
    }
  }

  updateMeta(character: Character, ownedOnly: boolean = false) {
    this.itemsMeta = this.items.map((itemData) => ({
      edition: itemData.edition,
      id: itemData.id,
      canAdd: gameManager.itemManager.canAdd(itemData, character),
      canBuy: gameManager.itemManager.canBuy(itemData, character),
      canCraft: gameManager.itemManager.canCraft(itemData, character),
      owned: ownedOnly || gameManager.itemManager.owned(itemData, character),
      assigned: gameManager.itemManager.assigned(itemData),
      countAvailable: gameManager.itemManager.countAvailable(itemData)
    }));
  }

  update(onlyAffordable: boolean = false) {
    this.unlocks = [];
    this.selected = undefined;
    this.brewing = 0;
    this.specialItems = [];
    this.setup = this.isSetup();
    this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character);

    if (this.character && this.owned) {
      this.updateOwned(this.character);
      return;
    }

    this.items = this.editionItems
      .filter((itemData) => !this.affordable || gameManager.itemManager.assigned(itemData) < itemData.count)
      .filter(
        (itemData) =>
          !this.affordable ||
          (this.character &&
            gameManager.itemManager.canAdd(itemData, this.character) &&
            (gameManager.itemManager.canBuy(itemData, this.character) || gameManager.itemManager.canCraft(itemData, this.character)))
      )
      .filter((itemData) => (!this.craftOnly || itemData.requiredBuilding === 'craftsman') && (!this.buyOnly || itemData.cost));

    if (this.character && this.edition && this.campaignMode && !this.all && !this.affordable) {
      this.character.progress.items.forEach((identifier) => {
        if (
          identifier.edition === this.edition &&
          !this.items.find((itemData) => itemData.id === +identifier.name && itemData.edition === identifier.edition)
        ) {
          const item = gameManager.itemManager.getItem(identifier.name, identifier.edition, true);
          if (item) {
            this.items.push(item);
          }
        }
      });

      this.items = this.items.filter(
        (itemData) => (!this.craftOnly || itemData.requiredBuilding === 'craftsman') && (!this.buyOnly || itemData.cost)
      );
    }

    this.items = this.items.filter((itemData) => this.matchesFilter(itemData));

    if (!this.all) {
      this.items = this.items.filter(
        (itemData) =>
          !itemData.solo ||
          !this.character ||
          (!!this.character && itemData.solo === this.character.name && itemData.edition === this.character.edition)
      );
    }

    if (this.all && this.filteredOnly) {
      this.items = this.items.filter((itemData) => this.filtered(itemData));
    }

    this.applySlotFilter();

    if (this.campaignMode && this.edition && !this.all && !this.affordable) {
      this.unlocks = gameManager.itemManager
        .getItems(this.edition, true)
        .filter(
          (itemData) =>
            ('' + itemData.id === this.filter || '0' + itemData.id === this.filter || '00' + itemData.id === this.filter) &&
            !this.items.find((item) => item.id === itemData.id && item.edition === itemData.edition)
        );
    }

    if (!onlyAffordable && this.affordable && this.items.length === 0) {
      this.affordable = false;
      this.sorted = this.character !== undefined && this.character.progress.items.length > 0;
      this.update();
    } else {
      this.itemsMeta = [];
      if (this.character) {
        this.updateMeta(this.character);
        this.brewing = gameManager.itemManager.brewingHerbs();
      }

      this.items.sort((a, b) => {
        if (this.sorted) {
          if (this.character) {
            const A = this.itemsMeta.find((value) => value.edition === a.edition && value.id === a.id);
            const B = this.itemsMeta.find((value) => value.edition === b.edition && value.id === b.id);

            if (!A || !B) {
              return 0;
            }

            if (A.owned && !B.owned) {
              return -1;
            } else if (!A.owned && B.owned) {
              return 1;
            } else if (A.owned && B.owned && a.slot && b.slot) {
              return Object.values(ItemSlot).indexOf(a.slot) - Object.values(ItemSlot).indexOf(b.slot);
            } else if ((A.canBuy || A.canCraft) && !B.canBuy && !B.canCraft) {
              return -1;
            } else if ((B.canBuy || B.canCraft) && !A.canBuy && !A.canCraft) {
              return 1;
            } else if (A.canAdd && !B.canAdd) {
              return -1;
            } else if (!A.canAdd && B.canAdd) {
              return 1;
            } else if (a.slot && !b.slot) {
              return -1;
            } else if (b.slot && !a.slot) {
              return 1;
            }
          }

          if (a.slot && b.slot) {
            return Object.values(ItemSlot).indexOf(a.slot) - Object.values(ItemSlot).indexOf(b.slot);
          }

          return 0;
        } else {
          if (a.edition !== b.edition) {
            return a.edition === this.currentEdition ? -1 : 1;
          }

          return gameManager.itemManager.sortItems(a, b);
        }
      });

      this.itemsMeta.sort((a, b) => {
        const A = this.items.find((value) => value.edition === a.edition && value.id === a.id);
        const B = this.items.find((value) => value.edition === b.edition && value.id === b.id);

        if (!A || !B) {
          return 0;
        }

        return this.items.indexOf(A) - this.items.indexOf(B);
      });
    }
  }

  updateOwned(character: Character) {
    const bb = gameManager.bbRules();
    this.items = (
      bb
        ? gameManager.itemManager.getItems('bb')
        : character.progress.items
            .map((identifier) => gameManager.itemManager.getItem(identifier.name, identifier.edition, true))
            .filter((itemData) => itemData)
            .map((itemData) => itemData as ItemData)
    ).filter((itemData) => this.matchesFilter(itemData));

    this.applySlotFilter();

    if (this.onlyEquipped) {
      this.items = this.items.filter((itemData) => gameManager.itemManager.isEquipped(itemData, character));
    }

    this.items.sort((a, b) => {
      if (!this.setup) {
        const equippedA = gameManager.itemManager.isEquipped(a, character);
        const equippedB = gameManager.itemManager.isEquipped(b, character);
        if (equippedA !== equippedB) {
          return equippedA ? -1 : 1;
        }
      }
      if (a.slot && b.slot) {
        return Object.values(ItemSlot).indexOf(a.slot) - Object.values(ItemSlot).indexOf(b.slot);
      } else if (a.slot || b.slot) {
        return a.slot ? -1 : 1;
      }
      return 0;
    });

    this.updateMeta(character, bb);
    this.brewing = gameManager.itemManager.brewingHerbs();

    this.specialItems = gameManager.game.party.specialItems.map((value, i, self) => {
      const itemData = gameManager.itemManager.getItem(value.name, value.edition, true) || new ItemData();
      const count = self.filter((other) => other.edition === value.edition && other.name === value.name).indexOf(value) + 1;
      return { item: itemData, count: count };
    });
  }

  ownedCount(): number {
    return this.character ? this.character.progress.items.length : 0;
  }

  toggleOwned() {
    this.onlyEquipped = this.owned && !this.setup;
    if (this.owned) {
      this.affordable = false;
    }
    this.update(true);
  }

  showAvailable() {
    this.owned = false;
    this.toggleOwned();
  }

  spent(itemData: ItemData): boolean {
    return !!this.character && gameManager.itemManager.itemFlagCount(itemData, this.character, ItemFlags.spent) > 0;
  }

  toggleItemSlotFilter(slot: ItemSlot | 'undefined', add: boolean = false) {
    if (!this.itemSlots.includes(slot)) {
      if (add) {
        this.itemSlots.push(slot);
      } else {
        this.itemSlots = [slot];
      }
    } else {
      this.itemSlots = this.itemSlots.filter((value) => value !== slot);
    }
    this.update(true);
  }

  select(itemData: ItemData, force: boolean = false) {
    if (!force && !this.setup) {
      this.selected = undefined;
    } else if (this.character) {
      if (
        this.selected !== itemData &&
        (force ||
          (this.character &&
            (gameManager.itemManager.owned(itemData, this.character) || gameManager.itemManager.canAdd(itemData, this.character))))
      ) {
        this.selected = itemData;
      } else {
        this.selected = undefined;
      }
    }
  }

  unlocked(item: ItemData): boolean {
    return !!gameManager.itemManager.unlockedItem(item);
  }

  unlockItemReveal(item: ItemData, revealed: boolean) {
    if (this.unlocks.includes(item) && revealed) {
      if (!this.unlocked(item)) {
        gameManager.stateManager.before('addUnlockedItem', item.edition, item.id, item.name);
        gameManager.itemManager.setItemUnlocked(item, true);
        gameManager.stateManager.after();
        this.updateEditionItems();
      }
    }
  }

  removeUnlocked(itemData: ItemData) {
    if (this.unlocked(itemData)) {
      gameManager.stateManager.before('removeUnlockedItem', itemData.edition, itemData.id, itemData.name);
      gameManager.itemManager.setItemUnlocked(itemData, false);
      gameManager.stateManager.after();
      this.updateEditionItems();
    }
  }

  filtered(itemData: ItemData): boolean {
    return gameManager.itemManager.itemFiltered(itemData);
  }

  filterItem(itemData: ItemData) {
    if (!this.filtered(itemData)) {
      gameManager.stateManager.before('filterItem', itemData.edition, itemData.id, itemData.name);
      gameManager.itemManager.setItemFiltered(itemData, true);
      gameManager.stateManager.after();
      this.updateEditionItems();
    }
  }

  removeFilterItem(itemData: ItemData) {
    if (this.filtered(itemData)) {
      gameManager.stateManager.before('removeFilterItem', itemData.edition, itemData.id, itemData.name);
      gameManager.itemManager.setItemFiltered(itemData, false);
      gameManager.stateManager.after();
      this.updateEditionItems();
    }
  }

  addItem(itemData: ItemData, force: boolean = false) {
    if (this.character && gameManager.itemManager.canAddItem(itemData, this.character, force)) {
      gameManager.stateManager.before(
        'addItem',
        gameManager.characterManager.characterName(this.character, true, true),
        itemData.id,
        itemData.edition
      );
      gameManager.itemManager.addItem(itemData, this.character, force);
      gameManager.stateManager.after();
      this.update();
    }
  }

  buyItem(itemData: ItemData) {
    if (this.character && gameManager.itemManager.canBuy(itemData, this.character)) {
      gameManager.stateManager.before(
        'buyItem',
        gameManager.characterManager.characterName(this.character, true, true),
        itemData.id,
        itemData.edition
      );
      gameManager.itemManager.buyItem(itemData, this.character);
      gameManager.stateManager.after();
      this.update();
    }
  }

  craftItem(itemData: ItemData) {
    if (this.character && gameManager.itemManager.canCraft(itemData, this.character)) {
      gameManager.stateManager.before(
        'craftItem',
        gameManager.characterManager.characterName(this.character, true, true),
        itemData.id,
        itemData.edition
      );
      gameManager.itemManager.craftItem(itemData, this.character);
      gameManager.stateManager.after();
      this.update();
    }
  }

  removeItem(itemData: ItemData) {
    if (this.character && gameManager.itemManager.canRemoveItem(itemData, this.character)) {
      gameManager.stateManager.before(
        'removeItem',
        gameManager.characterManager.characterName(this.character, true, true),
        '' + itemData.id,
        itemData.edition
      );
      gameManager.itemManager.removeItem(itemData, this.character);
      gameManager.stateManager.after();
      this.update();
    }
  }

  sellItem(itemData: ItemData) {
    if (this.character && gameManager.itemManager.canSellItem(itemData, this.character)) {
      gameManager.stateManager.before(
        'sellItem',
        gameManager.characterManager.characterName(this.character, true, true),
        '' + itemData.id,
        itemData.edition
      );
      gameManager.itemManager.sellItem(itemData, this.character);
      gameManager.stateManager.after();
      this.update();
    }
  }

  distillItem(itemData: ItemData) {
    if (this.character) {
      this.dialog.open(ItemDistillDialogComponent, {
        panelClass: ['dialog'],
        data: { character: this.character, item: itemData }
      });
    }
  }

  shareItem(itemData: ItemData) {
    if (
      this.character &&
      settingsManager.settings.characterItemsShareHouseRule &&
      gameManager.itemManager.owned(itemData, this.character)
    ) {
      this.dialog.open(ItemShareDialogComponent, {
        panelClass: ['dialog'],
        data: { character: this.character, item: itemData }
      });
    }
  }

  toggleCharacter(char: Character) {
    if (this.character === char) {
      this.character = undefined;
    } else {
      this.character = char;
    }
    this.update(this.affordable);
  }

  openItemDialog(item: ItemData) {
    const owned = !!this.character && gameManager.itemManager.owned(item, this.character);
    this.dialog.open(ItemDialogComponent, {
      panelClass: ['fullscreen-panel'],
      data: owned ? { item: item, character: this.character, setup: this.setup } : { item: item }
    });
  }

  openSpecialItemDialog(item: ItemData, count: number) {
    this.dialog.open(ItemDialogComponent, {
      panelClass: ['fullscreen-panel'],
      data: { item: item, count: count }
    });
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }
}
