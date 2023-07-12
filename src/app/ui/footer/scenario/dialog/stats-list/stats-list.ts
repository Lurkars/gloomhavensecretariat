import { Component, Inject } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { Monster } from 'src/app/game/model/Monster';
import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { AbilityDialogComponent } from 'src/app/ui/figures/ability/ability-dialog';
import { Ability } from 'src/app/game/model/data/Ability';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';

@Component({
  selector: 'ghs-stats-list',
  templateUrl: './stats-list.html',
  styleUrls: ['./stats-list.scss']
})
export class StatsListComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  constructor(@Inject(DIALOG_DATA) public monster: Monster, public dialogRef: DialogRef, private dialog: Dialog) { }

  openAbility(ability: Ability): void {
    this.dialog.open(AbilityDialogComponent, {
      data: { ability: ability, monster: this.monster, relative: true }
    });
  }
}