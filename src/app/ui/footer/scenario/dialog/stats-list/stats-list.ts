import { Component, Inject } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { Monster } from 'src/app/game/model/Monster';
import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { AbilityDialogComponent } from 'src/app/ui/figures/ability/ability-dialog';
import { Ability } from 'src/app/game/model/data/Ability';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
	standalone: false,
  selector: 'ghs-stats-list',
  templateUrl: './stats-list.html',
  styleUrls: ['./stats-list.scss']
})
export class StatsListComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  monster: Monster;
  hideStats: boolean;
  statEffectNote: string;

  constructor(@Inject(DIALOG_DATA) public data: { monster: Monster, hideStats: boolean, statEffectNote: string }, public dialogRef: DialogRef, private dialog: Dialog) {
    this.monster = data.monster;
    this.hideStats = data.hideStats;
    this.statEffectNote = data.statEffectNote || "";
  }

  openAbility(ability: Ability): void {
    this.dialog.open(AbilityDialogComponent, {
      panelClass: ['fullscreen-panel'],
      disableClose: true,
      data: { ability: ability, monster: this.monster, relative: true }
    });
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }
}