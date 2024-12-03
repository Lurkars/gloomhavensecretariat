import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { ItemData } from 'src/app/game/model/data/ItemData';

@Component({
	standalone: false,
  selector: 'ghs-item-dialog',
  templateUrl: './item-dialog.html',
  styleUrls: ['./item-dialog.scss'],
})
export class ItemDialogComponent implements OnInit {

  opened: boolean = false;

  gameManager: GameManager = gameManager;
  item: ItemData;
  character: Character | undefined;
  setup: boolean = false;

  constructor(@Inject(DIALOG_DATA) public data: { item: ItemData, character: Character | undefined, setup: boolean }, private dialogRef: DialogRef) {
    this.item = data.item;
    this.character = data.character;
    this.setup = data.setup || false;
  }

  ngOnInit(): void {
    this.opened = true;
  }

  close() {
    this.opened = false;
    setTimeout(() => {
      this.dialogRef.close();
    }, settingsManager.settings.animations ? 1000 : 0);
  }
}