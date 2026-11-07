import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { AdditionalIdentifier, Identifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { openEventRandomItemDialog } from 'src/app/ui/figures/entities-menu/random-item/random-item-dialog';
import { ItemDialogComponent } from 'src/app/ui/figures/items/dialog/item-dialog';
import { ItemComponent } from 'src/app/ui/figures/items/item/item';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

/**
 * Handles a random item drawn from a loot card: with character items enabled, the character receives (or auto-sells) the item,
 * otherwise the item is unlocked for the party via the event random item dialog.
 * `previous` is the character the loot card (and its random item) is moved from.
 */
export function openLootRandomItemDialog(dialog: Dialog, item: ItemData, character: Character, index: number, previous?: Character) {
  if (!settingsManager.settings.characterItems || !settingsManager.settings.applyLootRandomItem) {
    openEventRandomItemDialog(dialog, item);
    return;
  }

  dialog
    .open(LootRandomItemDialogComponent, {
      panelClass: ['dialog'],
      data: { item: item, character: character }
    })
    .closed.subscribe({
      next: (result) => {
        if (!result) {
          character.lootCards = character.lootCards.filter((value) => value !== index);
          return;
        }

        gameManager.stateManager.before(
          'lootRandomItem',
          item.id,
          item.edition,
          item.name,
          gameManager.characterManager.characterName(character, true, true)
        );
        gameManager.itemManager.addItemCount(item);
        if (!character.lootCards.includes(index)) {
          character.lootCards.push(index);
          character.lootCards.sort((a, b) => a - b);
        }
        const identifier = new Identifier(item.id, item.edition);
        if (character.progress.items.some((existing) => existing.name === identifier.name && existing.edition === identifier.edition)) {
          character.progress.gold += gameManager.itemManager.itemSellValue(item);
        } else {
          character.progress.items.push(identifier);
          character.progress.equippedItems.push(
            new AdditionalIdentifier(identifier.name, identifier.edition, undefined, 'loot-random-item')
          );
        }

        if (previous) {
          previous.lootCards = previous.lootCards.filter((value) => value !== index);
          previous.progress.items = previous.progress.items.filter(
            (value) => value.edition !== identifier.edition || value.name !== identifier.name
          );
          previous.progress.equippedItems = previous.progress.equippedItems.filter((value) => value.marker !== 'loot-random-item');
        }
        gameManager.stateManager.after();
      }
    });
}

@Component({
  imports: [NgClass, GhsLabelDirective, ItemComponent],
  selector: 'ghs-random-item-dialog',
  templateUrl: './random-item-dialog.html',
  styleUrls: ['./random-item-dialog.scss']
})
export class LootRandomItemDialogComponent {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);

  settingsManager: SettingsManager = settingsManager;
  gameManager: GameManager = gameManager;
  item: ItemData;
  character: Character;
  autoSell: boolean = false;

  data: { item: ItemData; character: Character } = inject(DIALOG_DATA);

  constructor() {
    this.item = this.data.item;
    this.character = this.data.character;
    this.autoSell =
      this.character !== undefined &&
      this.character.progress.items.find((existing) => existing.name === '' + this.item.id && existing.edition === this.item.edition) !=
        undefined;
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }

  openDialog() {
    this.dialog.open(ItemDialogComponent, {
      panelClass: ['fullscreen-panel'],
      disableClose: true,
      data: { item: this.item }
    });
  }

  apply() {
    ghsDialogClosingHelper(this.dialogRef, this.item);
  }
}
