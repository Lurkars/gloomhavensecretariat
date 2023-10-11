import { Component, Inject } from '@angular/core';
import { DialogRef, DIALOG_DATA, Dialog } from '@angular/cdk/dialog';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { Character } from 'src/app/game/model/Character';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Loot } from 'src/app/game/model/data/Loot';
import { ItemDialogComponent } from '../../items/dialog/item-dialog';

@Component({
  selector: 'ghs-random-item-dialog',
  templateUrl: './random-item-dialog.html',
  styleUrls: ['./random-item-dialog.scss'],
})
export class LootRandomItemDialogComponent {


  settingsManager: SettingsManager = settingsManager;
  gameManager: GameManager = gameManager;
  item: ItemData;
  loot: Loot;
  character: Character;
  autoSell: boolean = false;

  constructor(@Inject(DIALOG_DATA) public data: { item: ItemData, loot: Loot, index: number, character: Character }, private dialogRef: DialogRef, private dialog: Dialog) {
    this.item = data.item;
    this.loot = data.loot;
    this.character = data.character;
    this.autoSell = this.character.progress.items.find((existing) => existing.name == '' + this.item.id && existing.edition == this.item.edition) != undefined;
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