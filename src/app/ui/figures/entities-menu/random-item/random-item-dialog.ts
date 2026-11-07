import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CountIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { ItemDialogComponent } from 'src/app/ui/figures/items/dialog/item-dialog';
import { ItemComponent } from 'src/app/ui/figures/items/item/item';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper, ghsValueSign } from 'src/app/ui/helper/Static';

/**
 * Shows a random item (or blueprint) and unlocks it for the party on accept. Without an item, FH rules grant one inspiration instead.
 */
export function openEventRandomItemDialog(dialog: Dialog, item: ItemData | undefined, blueprint: boolean = false) {
  dialog
    .open(EventRandomItemDialogComponent, {
      panelClass: ['dialog'],
      data: { item: item, blueprint: blueprint }
    })
    .closed.subscribe({
      next: (result: unknown) => {
        if (result === true) {
          if (gameManager.fhRules()) {
            gameManager.stateManager.before('eventEffect.inspiration', ghsValueSign(1));
            gameManager.game.party.inspiration += 1;
            gameManager.stateManager.after();
          }
        } else if (result) {
          const itemData = result as ItemData;
          gameManager.stateManager.before(
            'eventEffect.drawRandomItem' + (blueprint ? 'Blueprint' : ''),
            itemData.id,
            itemData.edition,
            itemData.name
          );
          gameManager.game.party.unlockedItems.push(new CountIdentifier(itemData.id, itemData.edition));
          gameManager.stateManager.after();
        }
      }
    });
}

@Component({
  imports: [NgClass, GhsLabelDirective, ItemComponent],
  selector: 'ghs-event-random-item-dialog',
  templateUrl: './random-item-dialog.html',
  styleUrls: ['./random-item-dialog.scss']
})
export class EventRandomItemDialogComponent {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);

  settingsManager: SettingsManager = settingsManager;
  gameManager: GameManager = gameManager;
  item: ItemData | undefined;
  blueprint: boolean = false;

  data: { item: ItemData | undefined; blueprint: boolean } = inject(DIALOG_DATA);

  constructor() {
    if (!this.data.item && !this.data.blueprint) {
      this.dialogRef.close();
    }
    this.item = this.data.item;
    this.blueprint = this.data.blueprint;
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
    ghsDialogClosingHelper(this.dialogRef, this.item || true);
  }
}
