import { Component, Inject, OnInit } from '@angular/core';
import { Ability } from 'src/app/game/model/data/Ability';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Monster } from 'src/app/game/model/Monster';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';

@Component({
  selector: 'ghs-ability-dialog',
  templateUrl: './ability-dialog.html',
  styleUrls: ['./ability-dialog.scss'],
})
export class AbilityDialogComponent implements OnInit {

  ability: Ability;
  monster: Monster;

  opened: boolean = false;

  gameManager: GameManager = gameManager;

  constructor(@Inject(DIALOG_DATA) data: { ability: Ability, monster: Monster }, private dialogRef: DialogRef) {
    this.ability = data.ability;
    this.monster = data.monster;
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