import { Component, Inject, OnInit } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Monster } from 'src/app/game/model/Monster';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { MonsterType } from 'src/app/game/model/MonsterType';

@Component({
  selector: 'ghs-stat-dialog',
  templateUrl: './stat-dialog.html',
  styleUrls: ['./stat-dialog.scss']
})
export class MonsterStatDialogComponent implements OnInit {

  opened: boolean = false;

  constructor(@Inject(DIALOG_DATA) public monster: Monster, private dialogRef: DialogRef) { }

  ngOnInit(): void {
    this.opened = true;
  }

  close() {
    this.opened = false
    setTimeout(() => {
      this.dialogRef.close();
    }, 1000);
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
    monster.level = this.monster.level < 4 ? this.monster.level + 4 : this.monster.level - 4;
    monster.errors = this.monster.errors;
    return monster;
  }
}