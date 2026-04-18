import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Ability } from 'src/app/game/model/data/Ability';
import { Monster } from 'src/app/game/model/Monster';
import { AbilityComponent } from 'src/app/ui/figures/ability/ability';
import { AbilityDialogComponent } from 'src/app/ui/figures/ability/ability-dialog';
import { MonsterStatsComponent } from 'src/app/ui/figures/monster/stats/stats';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, PointerInputDirective, TrackUUIDPipe, AbilityComponent, forwardRef(() => MonsterStatsComponent)],
  selector: 'ghs-stats-list',
  templateUrl: './stats-list.html',
  styleUrls: ['./stats-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsListComponent {
  dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  monster: Monster;
  abilities: Ability[] = [];
  hideStats: boolean;
  statEffectNote: string;

  data: { monster: Monster; hideStats: boolean; statEffectNote: string } = inject(DIALOG_DATA);

  constructor() {
    this.monster = this.data.monster;
    this.hideStats = this.data.hideStats;
    this.statEffectNote = this.data.statEffectNote || '';
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
