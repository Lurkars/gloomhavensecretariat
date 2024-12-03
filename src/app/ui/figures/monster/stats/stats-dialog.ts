import { DIALOG_DATA, Dialog, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { EntityValueFunction } from "src/app/game/model/Entity";
import { Monster } from "src/app/game/model/Monster";
import { StatsListComponent } from "src/app/ui/footer/scenario/dialog/stats-list/stats-list";
import { MonsterStatDialogComponent } from "./stat-dialog";

@Component({
	standalone: false,
  selector: 'ghs-monster-stats-popup',
  templateUrl: './stats-dialog.html',
  styleUrls: ['./stats-dialog.scss']
})
export class MonsterStatsDialogComponent {

  settingsManager: SettingsManager = settingsManager;
  levels: number[] = [0, 1, 2, 3, 4, 5, 6, 7];
  monsters: Monster[] = [];
  edition: string = "";
  EntityValueFunction = EntityValueFunction;

  constructor(@Inject(DIALOG_DATA) public monster: Monster, public dialogRef: DialogRef, private dialog: Dialog) {
    this.levels.forEach((level) => {
      this.monsters.push(this.getMonsterForLevel(level));
    })
    this.edition = gameManager.getEdition(this.monster);
  }

  getMonsterForLevel(level: number): Monster {
    let monster: Monster = new Monster(this.monster, level);
    monster.isAlly = this.monster.isAlly;
    monster.isAllied = this.monster.isAllied;
    monster.errors = this.monster.errors;
    monster.statEffect = this.monster.statEffect;
    monster.flying = this.monster.flying && (!this.monster.statEffect || this.monster.statEffect.flying != 'disabled') || this.monster.statEffect != undefined && this.monster.statEffect.flying == true;
    return monster;
  }

  toggleAlly() {
    gameManager.stateManager.before(this.monster.isAlly ? "unsetAlly" : "setAlly", "data.monster." + this.monster.name);
    this.monster.isAlly = !this.monster.isAlly;
    gameManager.stateManager.after();
  }

  toggleallied() {
    gameManager.stateManager.before(this.monster.isAllied ? "unsetAllied" : "setAllied", "data.monster." + this.monster.name);
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
      this.dialog.open(StatsListComponent, { panelClass: ['dialog'], data: { monster: monster, hideStats: true, statEffectNote: monster.statEffect.note } });
    }
  }
}