import { Component, Inject } from '@angular/core';
import { DialogRef, DIALOG_DATA, Dialog } from '@angular/cdk/dialog';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ItemDialogComponent } from '../../../items/dialog/item-dialog';

@Component({
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
    this.dialogRef.close();
  }

  openDialog() {
    this.dialog.open(ItemDialogComponent, { data: { item: this.item } });
  }

  apply() {
    this.dialogRef.close(this.item);
  }

}