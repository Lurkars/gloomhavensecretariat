import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';

@Component({
	standalone: false,
  selector: 'ghs-stat-dialog',
  templateUrl: './stat-dialog.html',
  styleUrls: ['./stat-dialog.scss']
})
export class MonsterStatDialogComponent implements OnInit {

  opened: boolean = false;
  monster: Monster;
  forceStats: boolean;

  constructor(@Inject(DIALOG_DATA) public data: { monster: Monster, forceStats: boolean }, private dialogRef: DialogRef) {
    this.monster = data.monster;
    this.forceStats = data.forceStats;
  }

  ngOnInit(): void {
    this.opened = true;
  }

  close() {
    this.opened = false
    setTimeout(() => {
      this.dialogRef.close();
    }, settingsManager.settings.animations ? 1000 : 0);
  }

  getBackside(): Monster {
    let monster: Monster = new Monster(this.monster);
    if (monster.boss) {
      gameManager.monsterManager.addMonsterEntity(monster, 1, MonsterType.boss);
    } else {
      gameManager.monsterManager.addMonsterEntity(monster, 1, MonsterType.normal);
      gameManager.monsterManager.addMonsterEntity(monster, 1, MonsterType.elite);
    }
    monster.isAlly = this.monster.isAlly;
    monster.isAllied = this.monster.isAllied;
    monster.level = this.monster.level < 4 ? this.monster.level + 4 : this.monster.level - 4;
    monster.errors = this.monster.errors;
    return monster;
  }
}