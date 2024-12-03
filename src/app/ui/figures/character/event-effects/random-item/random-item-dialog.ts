import { Component, Inject } from '@angular/core';
import { DialogRef, DIALOG_DATA, Dialog } from '@angular/cdk/dialog';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ItemDialogComponent } from '../../../items/dialog/item-dialog';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
	standalone: false,
  selector: 'ghs-event-random-item-dialog',
  templateUrl: './random-item-dialog.html',
  styleUrls: ['./random-item-dialog.scss'],
})
export class EventRandomItemDialogComponent {

  settingsManager: SettingsManager = settingsManager;
  gameManager: GameManager = gameManager;
  item: ItemData;
  blueprint: boolean = false;

  constructor(@Inject(DIALOG_DATA) public data: { item: ItemData, blueprint: boolean }, private dialogRef: DialogRef, private dialog: Dialog) {
    this.item = data.item;
    this.blueprint = data.blueprint;
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