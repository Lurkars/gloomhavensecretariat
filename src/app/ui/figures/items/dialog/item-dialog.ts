import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { CharacterItemComponent } from 'src/app/ui/figures/items/character/item-character';
import { ItemComponent } from 'src/app/ui/figures/items/item/item';

@Component({
  imports: [NgClass, ItemComponent, CharacterItemComponent],
  selector: 'ghs-item-dialog',
  templateUrl: './item-dialog.html',
  styleUrls: ['./item-dialog.scss']
})
export class ItemDialogComponent implements OnInit {
  private dialogRef = inject(DialogRef);

  opened: boolean = false;

  gameManager: GameManager = gameManager;
  item: ItemData;
  character: Character | undefined;
  count: number;
  setup: boolean = false;

  data: { item: ItemData; character: Character | undefined; setup: boolean; count: number | undefined } = inject(DIALOG_DATA);

  constructor() {
    this.item = this.data.item;
    this.character = this.data.character;
    this.setup = this.data.setup || false;
    this.count = this.data.count || 0;
  }

  ngOnInit(): void {
    this.opened = true;
  }

  close() {
    this.opened = false;
    setTimeout(
      () => {
        this.dialogRef.close();
      },
      settingsManager.settings.animations ? 1000 * settingsManager.settings.animationSpeed : 0
    );
  }
}
