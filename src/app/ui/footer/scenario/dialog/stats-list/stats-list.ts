import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Ability } from 'src/app/game/model/data/Ability';
import { Monster } from 'src/app/game/model/Monster';
import { AbilityDialogComponent } from 'src/app/ui/figures/ability/ability-dialog';
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
  abilities: Ability[] = [];
  hideStats: boolean;
  statEffectNote: string;

  constructor(@Inject(DIALOG_DATA) public data: { monster: Monster, hideStats: boolean, statEffectNote: string }, public dialogRef: DialogRef, private dialog: Dialog) {
    this.monster = data.monster;
    this.hideStats = data.hideStats;
    this.statEffectNote = data.statEffectNote || "";
    this.abilities = gameManager.deckData(this.monster).abilities;
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