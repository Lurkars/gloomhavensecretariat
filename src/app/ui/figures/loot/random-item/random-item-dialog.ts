import { Component, Inject } from '@angular/core';
import { DialogRef, DIALOG_DATA, Dialog } from '@angular/cdk/dialog';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { Character } from 'src/app/game/model/Character';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ItemDialogComponent } from '../../items/dialog/item-dialog';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

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