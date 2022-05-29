import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { MonsterStat } from 'src/app/game/model/MonsterStat';
import { MonsterType } from 'src/app/game/model/MonsterType';
import { DialogComponent } from 'src/app/ui/dialog/dialog';

@Component({
  selector: 'ghs-monster-stats',
  templateUrl: './stats.html',
  styleUrls: [ './stats.scss', '../../../dialog/dialog.scss' ]
})
export class MonsterStatsComponent extends DialogComponent {

  @Input() monster!: Monster;
  MonsterType = MonsterType;

  stats: MonsterStat | undefined = undefined;
  eliteStats: MonsterStat | undefined = undefined;

  @ViewChild('normalButton', { read: ElementRef }) normalButton!: ElementRef;
  @ViewChild('eliteButton', { read: ElementRef }) eliteButton!: ElementRef;

  levels: number[] = [ 0, 1, 2, 3, 4, 5, 6, 7 ];

  override ngOnInit(): void {
    super.ngOnInit();
    this.setStats();
  }

  setStats() {
    if (this.monster.boss) {
      if (!this.monster.stats.some((monsterStat: MonsterStat) => {
        return monsterStat.level == this.monster.level && monsterStat.type == MonsterType.boss;
      })) {
        throw Error("Could not find stats for monster.")
      }

      this.stats = this.monster.stats.filter((monsterStat: MonsterStat) => {
        return monsterStat.level == this.monster.level && monsterStat.type == MonsterType.boss;
      })[ 0 ];
    } else {
      if (!this.monster.stats.some((monsterStat: MonsterStat) => {
        return monsterStat.level == this.monster.level && monsterStat.type == MonsterType.normal;
      }) || !this.monster.stats.some((monsterStat: MonsterStat) => {
        return monsterStat.level == this.monster.level && monsterStat.type == MonsterType.elite;
      })) {
        throw Error("Could not find stats for monster.")
      }

      this.stats = this.monster.stats.filter((monsterStat: MonsterStat) => {
        return monsterStat.level == this.monster.level && monsterStat.type == MonsterType.normal;
      })[ 0 ];

      this.eliteStats = this.monster.stats.filter((monsterStat: MonsterStat) => {
        return monsterStat.level == this.monster.level && monsterStat.type == MonsterType.elite;
      })[ 0 ];
    }
  }

  statsForType(type: MonsterType): MonsterStat {
    if (!this.monster.stats.some((monsterStat: MonsterStat) => {
      return monsterStat.level == this.monster.level && monsterStat.type == type;
    })) {
      throw Error("Could not find stats for monster.")
    }

    let stat: MonsterStat = this.monster.stats.filter((monsterStat: MonsterStat) => {
      return monsterStat.level == this.monster.level && monsterStat.type == type;
    })[ 0 ];

    return stat;
  }

  addMonsterEntity(number: number, type: MonsterType) {
    gameManager.stateManager.before();
    let parent: ElementRef | undefined = undefined;

    if (type == MonsterType.normal) {
      parent = this.normalButton;
    } else if (type == MonsterType.elite) {
      parent = this.eliteButton;
    }
    gameManager.stateManager.after();
  }

  setLevel(value: number) {
    if (value != this.monster.level) {
      gameManager.stateManager.before();
      this.monster.level = value;

      this.setStats();
      this.monster.entities.forEach((monsterEntity: MonsterEntity) => {
        let stat = this.stats;
        if (monsterEntity.type == MonsterType.elite) {
          stat = this.eliteStats;
        }

        if (stat == undefined) {
          throw Error("Could not find stats for monster.")
        }

        monsterEntity.level = this.monster.level;

        let maxHealth: number;
        if (typeof stat.health === "number") {
          maxHealth = stat.health;
        } else {
          maxHealth = EntityValueFunction(stat.health);
        }

        if (monsterEntity.health == monsterEntity.maxHealth) {
          monsterEntity.health = maxHealth;
        }

        monsterEntity.maxHealth = maxHealth;
        if (monsterEntity.health > monsterEntity.maxHealth) {
          monsterEntity.health = monsterEntity.maxHealth;
        }
      });
      gameManager.stateManager.after();
    }
  }



}