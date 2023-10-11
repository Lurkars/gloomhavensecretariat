import { Component, Inject, OnInit } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { ItemData } from 'src/app/game/model/data/ItemData';

@Component({
  selector: 'ghs-item-dialog',
  templateUrl: './item-dialog.html',
  styleUrls: ['./item-dialog.scss'],
})
export class ItemDialogComponent implements OnInit {

  opened: boolean = false;

  gameManager: GameManager = gameManager;
  item: ItemData;

  constructor(@Inject(DIALOG_DATA) public data: { item: ItemData }, private dialogRef: DialogRef) {
    this.item = data.item;
  }

  ngOnInit(): void {
    this.opened = true;
  }

  close() {
    this.opened = false;
    setTimeout(() => {
      this.dialogRef.close();
    }, 1000);
  }
}