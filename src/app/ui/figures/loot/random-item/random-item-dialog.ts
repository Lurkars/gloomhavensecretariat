import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { ItemDialogComponent } from '../../items/dialog/item-dialog';

@Component({
  standalone: false,
  selector: 'ghs-random-item-dialog',
  templateUrl: './random-item-dialog.html',
  styleUrls: ['./random-item-dialog.scss'],
})
export class LootRandomItemDialogComponent {

  settingsManager: SettingsManager = settingsManager;
  gameManager: GameManager = gameManager;
  item: ItemData;
  character: Character;
  autoSell: boolean = false;

  constructor(@Inject(DIALOG_DATA) public data: { item: ItemData, character: Character }, private dialogRef: DialogRef, private dialog: Dialog) {
    this.item = data.item;
    this.character = data.character;
    this.autoSell = this.character != undefined && this.character.progress.items.find((existing) => existing.name == '' + this.item.id && existing.edition == this.item.edition) != undefined;
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