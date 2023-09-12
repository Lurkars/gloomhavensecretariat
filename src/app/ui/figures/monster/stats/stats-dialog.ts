import { Dialog, DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Monster } from "src/app/game/model/Monster";
import { MonsterStatDialogComponent } from "./stat-dialog";

@Component({
  selector: 'ghs-monster-stats-popup',
  templateUrl: './stats-dialog.html',
  styleUrls: ['./stats-dialog.scss']
})
export class MonsterStatsDialogComponent {

  settingsManager: SettingsManager = settingsManager;
  levels: number[] = [0, 1, 2, 3, 4, 5, 6, 7];

  constructor(@Inject(DIALOG_DATA) public monster: Monster, public dialogRef: DialogRef, private dialog: Dialog) { }

  getEdition(): string {
    return gameManager.getEdition(this.monster);
  }

  getMonsterForLevel(level: number): Monster {
    let monster: Monster = new Monster(this.monster, level);
    monster.isAlly = this.monster.isAlly;
    monster.isAllied = this.monster.isAllied;
    monster.errors = this.monster.errors;
    return monster;
  }

  openStatPopup(level: number) {
    const monster = new Monster(this.monster, level);
    this.dialog.open(MonsterStatDialogComponent, { panelClass: 'fullscreen-panel', data: { monster: monster, forceStats: true } });
  }
}