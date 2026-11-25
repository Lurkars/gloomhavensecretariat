import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject, input, OnInit } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { ItemsBrewDialog } from 'src/app/ui/figures/items/brew/brew';
import { ItemDistillDialogComponent } from 'src/app/ui/figures/items/character/item-distill';
import { ItemDialogComponent } from 'src/app/ui/figures/items/dialog/item-dialog';
import { ItemsDialogComponent } from 'src/app/ui/figures/items/dialog/items-dialog';
import { ConfirmDialogComponent } from 'src/app/ui/helper/confirm/confirm';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsTooltipDirective, PointerInputDirective, TrackUUIDPipe],
  selector: 'ghs-character-items',
  templateUrl: 'items.html',
  styleUrls: ['../sheet.scss', './items.scss']
})
export class CharacterItemsComponent implements OnInit {
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  readonly inputCharacter = input.required<Character>({ alias: 'character' });
  get character(): Character {
    return this.inputCharacter();
  }

  items: ItemData[] = [];
  itemEdition: string = '';
  brewing: number = 0;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.updateItems());
  }

  ngOnInit() {
    this.updateItems();
    this.itemEdition = gameManager.editionManager.currentEdition(this.character.edition);
  }

  updateItems() {
    this.items = [];
    if (this.character.progress.items) {
      this.character.progress.items.forEach((item) => {
        const itemData = gameManager.itemManager.getItem(item.name, item.edition, true);
        if (itemData) {
          this.items.push(itemData);
        } else {
          console.warn("Unknown Item for edition '" + item.edition + "': " + item.name);
        }
      });

      this.items.sort(gameManager.itemManager.sortItems);
    }

    this.brewing = gameManager.itemManager.brewingHerbs();
  }

  brewDialog(force: boolean = false) {
    if (!gameManager.itemManager.brewingBlocked() || force) {
      this.dialog.open(ItemsBrewDialog, {
        panelClass: ['dialog'],
        data: this.character
      });
    }
  }

  itemDialog() {
    this.dialog.open(ItemsDialogComponent, {
      panelClass: ['dialog'],
      data: { edition: gameManager.game.edition, select: this.character, owned: false }
    });
  }

  openItem(itemData: ItemData) {
    this.dialog.open(ItemDialogComponent, {
      panelClass: ['fullscreen-panel'],
      data: {
        character: settingsManager.settings.characterItems ? this.character : undefined,
        item: itemData,
        setup: !gameManager.scenarioManager.scenarioRunning()
      }
    });
  }

  removeItem(itemData: ItemData) {
    const item = this.character.progress.items.find(
      (identifier) => identifier.name === '' + itemData.id && identifier.edition === itemData.edition
    );
    if (item) {
      this.dialog
        .open(ConfirmDialogComponent, {
          panelClass: ['dialog'],
          data: {
            label: 'game.items.remove',
            args: ['data.items.' + item.edition + '-' + itemData.id]
          }
        })
        .closed.subscribe({
          next: (result) => {
            if (result && gameManager.itemManager.canRemoveItem(itemData, this.character)) {
              gameManager.stateManager.before(
                'removeItem',
                gameManager.characterManager.characterName(this.character, true, true),
                item.name,
                item.edition
              );
              gameManager.itemManager.removeItem(itemData, this.character);
              gameManager.stateManager.after();
              this.updateItems();
            }
          }
        });
    }
  }

  sellItem(itemData: ItemData) {
    const item = this.character.progress.items.find(
      (identifier) => identifier.name === '' + itemData.id && identifier.edition === itemData.edition
    );
    if (item && gameManager.itemManager.canSellItem(itemData, this.character)) {
      this.dialog
        .open(ConfirmDialogComponent, {
          panelClass: ['dialog'],
          data: {
            label: 'game.items.sell',
            args: ['data.items.' + item.edition + '-' + itemData.id, gameManager.itemManager.itemSellValue(itemData)]
          }
        })
        .closed.subscribe({
          next: (result) => {
            if (result && gameManager.itemManager.canSellItem(itemData, this.character)) {
              gameManager.stateManager.before(
                'sellItem',
                gameManager.characterManager.characterName(this.character, true, true),
                item.name,
                item.edition
              );
              gameManager.itemManager.sellItem(itemData, this.character);
              gameManager.stateManager.after();
              this.updateItems();
            }
          }
        });
    }
  }

  distillItem(itemData: ItemData) {
    this.dialog.open(ItemDistillDialogComponent, {
      panelClass: ['dialog'],
      data: { character: this.character, item: itemData }
    });
  }

  isEquipped(item: ItemData) {
    return this.character.progress.equippedItems.find(
      (identifier) => identifier.name === '' + item.id && identifier.edition === item.edition
    );
  }

  toggleEquippedItem(itemData: ItemData, force: boolean = false) {
    if (
      gameManager.itemManager.owned(itemData, this.character) &&
      gameManager.itemManager.canToggleEquippedItem(itemData, this.character, force)
    ) {
      gameManager.stateManager.before(
        gameManager.itemManager.isEquipped(itemData, this.character) ? 'unequipItem' : 'equipItem',
        gameManager.characterManager.characterName(this.character, true, true),
        itemData.id,
        itemData.edition
      );
      gameManager.itemManager.toggleEquippedItem(itemData, this.character, force);
      gameManager.stateManager.after();
    }
  }

  setItemNotes(event: any) {
    if (
      this.character.progress.itemNotes !== event.target.value &&
      gameManager.characterManager.canSetProgressValue(this.character, 'itemNotes', event.target.value)
    ) {
      gameManager.stateManager.before(
        'setItems',
        gameManager.characterManager.characterName(this.character, true, true),
        event.target.value
      );
      gameManager.characterManager.setProgressValue(this.character, 'itemNotes', event.target.value);
      gameManager.stateManager.after();
    }
  }
}
