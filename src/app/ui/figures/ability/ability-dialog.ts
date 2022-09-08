import { Component, Inject } from '@angular/core';
import { Ability } from 'src/app/game/model/Ability';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Monster } from 'src/app/game/model/Monster';

@Component({
  selector: 'ghs-ability-dialog',
  templateUrl: './ability-dialog.html',
  styleUrls: [ './ability-dialog.scss' ]
})
export class AbilityDialogComponent {

  ability: Ability;
  monster: Monster;

  constructor(@Inject(DIALOG_DATA) private data: { ability: Ability, monster: Monster }, private dialogRef: DialogRef) {
    this.ability = data.ability;
    this.monster = data.monster;
  }

  close() {
    this.dialogRef.close();
  }
}