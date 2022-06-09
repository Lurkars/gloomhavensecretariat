import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { MonsterStat } from 'src/app/game/model/MonsterStat';
import { MonsterType } from 'src/app/game/model/MonsterType';

@Component({
  selector: 'ghs-monster',
  templateUrl: './monster.html',
  styleUrls: [ './monster.scss' ]
})
export class MonsterComponent {

  @Input() monster!: Monster;
  MonsterType = MonsterType;
  addMonsterEntityFunction!: Function;
  removeMonsterEntityFunction!: Function;

  constructor() { }



  emptyEntities(): boolean {
    return this.monster.entities.length == 0 || this.monster.entities.every((monsterEntity: MonsterEntity) => monsterEntity.dead);
  }

  monsterOff(): boolean {
    return this.monster.off || this.monster.entities.every((monsterEntity: MonsterEntity) => monsterEntity.dead);
  }

  removeMonsterEntity(monsterEntity: MonsterEntity) {
    monsterEntity.dead = true;
    setTimeout(() => {
      gameManager.stateManager.before();
      gameManager.monsterManager.removeMonsterEntity(this.monster, monsterEntity);
      gameManager.stateManager.after(1000);
    }, 2000);
  }

  sortedEntites(): MonsterEntity[] {
    return this.monster.entities.sort((a: MonsterEntity, b: MonsterEntity) => {
      if (a.type == MonsterType.elite && b.type == MonsterType.normal) {
        return -1;
      } else if (a.type == MonsterType.normal && b.type == MonsterType.elite) {
        return 1;
      }
      return a.number < b.number ? -1 : 1;
    })
  }

  isNormal() {
    return this.monster.stats.some((monsterStat: MonsterStat) => {
      return monsterStat.type == MonsterType.normal || monsterStat.type == MonsterType.elite;
    });
  }

  getEntities(type: MonsterType): MonsterEntity[] {
    return this.monster.entities.filter((value: MonsterEntity) => value.type == type).sort((a: MonsterEntity, b: MonsterEntity) => a.number - b.number);
  }

}