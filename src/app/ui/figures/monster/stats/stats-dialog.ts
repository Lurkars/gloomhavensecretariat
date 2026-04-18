import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, inject } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Monster } from 'src/app/game/model/Monster';
import { ActionsComponent } from 'src/app/ui/figures/actions/actions';
import { MonsterStatDialogComponent } from 'src/app/ui/figures/monster/stats/stat-dialog';
import { MonsterStatsComponent } from 'src/app/ui/figures/monster/stats/stats';
import { StatsListComponent } from 'src/app/ui/footer/scenario/dialog/stats-list/stats-list';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';
import { ValueSignDirective } from 'src/app/ui/helper/ValueSign';

@Component({
  imports: [
    NgClass,
    GhsLabelDirective,
    TrackUUIDPipe,
    ValueSignDirective,
    forwardRef(() => ActionsComponent),
    forwardRef(() => MonsterStatsComponent)
  ],
  selector: 'ghs-monster-stats-popup',
  templateUrl: './stats-dialog.html',
  styleUrls: ['./stats-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonsterStatsDialogComponent {
  dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);

  settingsManager: SettingsManager = settingsManager;
  levels: number[] = [0, 1, 2, 3, 4, 5, 6, 7];
  monsters: Monster[] = [];
  edition: string = '';
  EntityValueFunction = EntityValueFunction;
  dormant: boolean = false;

  monster: Monster = inject(DIALOG_DATA);

  constructor() {
    this.levels.forEach((level) => {
      this.monsters.push(this.getMonsterForLevel(level));
    });
    this.edition = gameManager.getEdition(this.monster);
    this.dormant = this.monster.entities.every((e) => e.dormant);
  }

  getMonsterForLevel(level: number): Monster {
    const monster: Monster = new Monster(this.monster, level);
    monster.isAlly = this.monster.isAlly;
    monster.isAllied = this.monster.isAllied;
    monster.errors = this.monster.errors;
    monster.statEffect = this.monster.statEffect;
    monster.flying =
      (this.monster.flying && (!this.monster.statEffect || this.monster.statEffect.flying != 'disabled')) ||
      (this.monster.statEffect != undefined && this.monster.statEffect.flying == true);
    return monster;
  }

  toggleAlly() {
    gameManager.stateManager.before(this.monster.isAlly ? 'unsetAlly' : 'setAlly', 'data.monster.' + this.monster.name);
    this.monster.isAlly = !this.monster.isAlly;
    gameManager.stateManager.after();
  }

  toggleDormant() {
    gameManager.stateManager.before(this.dormant ? 'unsetDormant' : 'setDormant', 'data.monster.' + this.monster.name);
    this.dormant = !this.dormant;
    this.monster.entities.forEach((e) => (e.dormant = this.dormant));
    gameManager.stateManager.after();
  }

  toggleAllied() {
    gameManager.stateManager.before(this.monster.isAllied ? 'unsetAllied' : 'setAllied', 'data.monster.' + this.monster.name);
    this.monster.isAllied = !this.monster.isAllied;
    gameManager.stateManager.after();
  }

  openStatPopup(level: number) {
    const monster = new Monster(this.monster, level);
    this.dialog.open(MonsterStatDialogComponent, {
      panelClass: ['fullscreen-panel'],
      disableClose: true,
      data: { monster: monster, forceStats: true }
    });
  }

  openAbilities(): void {
    const monster = new Monster(this.monster, this.monster.level);
    monster.statEffect = this.monster.statEffect;
    gameManager.monsterManager.resetMonsterAbilities(monster);
    if (monster.statEffect) {
      this.dialog.open(StatsListComponent, {
        panelClass: ['dialog'],
        data: { monster: monster, hideStats: true, statEffectNote: monster.statEffect.note }
      });
    }
  }
}
