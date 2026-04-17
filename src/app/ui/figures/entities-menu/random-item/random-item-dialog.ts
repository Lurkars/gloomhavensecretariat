import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { ItemDialogComponent } from 'src/app/ui/figures/items/dialog/item-dialog';
import { ItemComponent } from 'src/app/ui/figures/items/item/item';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
  imports: [NgClass, GhsLabelDirective, ItemComponent],
  selector: 'ghs-event-random-item-dialog',
  templateUrl: './random-item-dialog.html',
  styleUrls: ['./random-item-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventRandomItemDialogComponent {
  settingsManager: SettingsManager = settingsManager;
  gameManager: GameManager = gameManager;
  item: ItemData;
  blueprint: boolean = false;

  data: { item: ItemData; blueprint: boolean } = inject(DIALOG_DATA);

  constructor(
    private dialogRef: DialogRef,
    private dialog: Dialog
  ) {
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
    ghsDialogClosingHelper(this.dialogRef, this.item);
  }
}
