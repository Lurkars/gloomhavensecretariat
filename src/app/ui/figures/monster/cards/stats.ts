import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Ability } from 'src/app/game/model/Ability';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { FigureError, FigureErrorType } from 'src/app/game/model/FigureError';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterStat } from 'src/app/game/model/MonsterStat';
import { MonsterType } from 'src/app/game/model/MonsterType';
import { DialogComponent } from 'src/app/ui/dialog/dialog';
import { PopupComponent } from 'src/app/ui/popup/popup';

@Component({
  selector: 'ghs-monster-stats',
  templateUrl: './stats.html',
  styleUrls: [ './stats.scss', '../../../dialog/dialog.scss' ]
})
export class MonsterStatsComponent extends DialogComponent {

  @Input() monster!: Monster;
  @Input() showName: boolean = false;
  @Input() forceStats: boolean = false;
  MonsterType = MonsterType;

  stats: MonsterStat | undefined = undefined;
  eliteStats: MonsterStat | undefined = undefined;
  statOverview: boolean = false;

  @ViewChild('normalButton', { read: ElementRef }) normalButton!: ElementRef;
  @ViewChild('eliteButton', { read: ElementRef }) eliteButton!: ElementRef;

  levels: number[] = [ 0, 1, 2, 3, 4, 5, 6, 7 ];

  override ngOnInit(): void {
    super.ngOnInit();
    this.setStats();
  }

  hideStats(type: MonsterType) {
    return !this.forceStats && settingsManager.settings.hideStats && this.monster.entities.every((monsterEntity) => monsterEntity.dead || monsterEntity.type != type);
  }

  setStats() {
    if (this.monster.boss) {
      const stats = this.monster.stats.find((monsterStat) => {
        return monsterStat.level == this.monster.level && monsterStat.type == MonsterType.boss;
      });
      if (!stats) {
        this.monster.errors = this.monster.errors || [];
        if (!this.monster.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !this.monster.errors.find((figureError) => figureError.type == FigureErrorType.stat)) {
          console.error("Could not find '" + MonsterType.boss + "' stats for monster: " + this.monster.name + " level: " + this.monster.level);
          this.monster.errors.push(new FigureError(FigureErrorType.stat, "monster", this.monster.name, this.monster.edition, MonsterType.boss, "" + this.monster.level));
        }
      }

      this.stats = stats;
    } else {
      const stats = this.monster.stats.find((monsterStat) => {
        return monsterStat.level == this.monster.level && monsterStat.type == MonsterType.normal;
      });
      if (!stats) {
        this.monster.errors = this.monster.errors || [];
        if (!this.monster.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !this.monster.errors.find((figureError) => figureError.type == FigureErrorType.stat)) {
          console.error("Could not find '" + MonsterType.normal + "' stats for monster: " + this.monster.name + " level: " + this.monster.level);
          this.monster.errors.push(new FigureError(FigureErrorType.stat, "monster", this.monster.name, this.monster.edition, MonsterType.normal, "" + this.monster.level));
        }
      }

      const eliteStats = this.monster.stats.find((monsterStat) => {
        return monsterStat.level == this.monster.level && monsterStat.type == MonsterType.elite;
      });
      if (!eliteStats) {
        this.monster.errors = this.monster.errors || [];
        if (!this.monster.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !this.monster.errors.find((figureError) => figureError.type == FigureErrorType.stat)) {
          console.error("Could not find '" + MonsterType.elite + "' stats for monster: " + this.monster.name + " level: " + this.monster.level);
          this.monster.errors.push(new FigureError(FigureErrorType.stat, "monster", this.monster.name, this.monster.edition, MonsterType.elite, "" + this.monster.level));
        }
      }

      this.stats = stats;
      this.eliteStats = eliteStats;
    }
  }

  statsForType(type: MonsterType): MonsterStat {
    const stat = this.monster.stats.find((monsterStat) => {
      return monsterStat.level == this.monster.level && monsterStat.type == type;
    });
    if (!stat) {
      this.monster.errors = this.monster.errors || [];
      if (!this.monster.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !this.monster.errors.find((figureError) => figureError.type == FigureErrorType.stat)) {
        console.error("Could not find '" + type + "' stats for monster: " + this.monster.name + " level: " + this.monster.level);
        this.monster.errors.push(new FigureError(FigureErrorType.stat, "monster", this.monster.name, this.monster.edition, type, "" + this.monster.level));
      }

      return new MonsterStat(type, this.monster.level, 0, 0, 0, 0);
    }
    return stat;
  }

  setLevel(value: number) {
    if (value != this.monster.level) {
      gameManager.stateManager.before("setLevel", "data.monster." + this.monster.name);
      const abilities = gameManager.abilities(this.monster);
      if (this.monster.abilities.length != abilities.filter((ability) => !ability.level || isNaN(+ability.level) || ability.level <= value).length) {
        this.monster.abilities = abilities.filter((ability) => !ability.level || isNaN(+ability.level) || ability.level <= value).map((ability, index) => index);
        gameManager.monsterManager.shuffleAbilities(this.monster);
      }

      this.monster.level = value;

      this.setStats();
      this.monster.entities.forEach((monsterEntity) => {
        let stat = this.stats;
        if (monsterEntity.type == MonsterType.elite) {
          stat = this.eliteStats;
        }

        if (stat == undefined) {
          stat = new MonsterStat(monsterEntity.type, this.monster.level, 0, 0, 0, 0);
          this.monster.errors = this.monster.errors || [];
          if (!this.monster.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !this.monster.errors.find((figureError) => figureError.type == FigureErrorType.stat)) {
            console.error("Could not find '" + monsterEntity.type + "' stats for monster: " + this.monster.name + " level: " + this.monster.level);
            this.monster.errors.push(new FigureError(FigureErrorType.stat, "monster", this.monster.name, this.monster.edition, monsterEntity.type, "" + this.monster.level));
          }
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

  getEdition(): string {
    return gameManager.getEdition(this.monster);
  }

  toggleAlly() {
    gameManager.stateManager.before(this.monster.isAlly ? "unsetAlly" : "setAlly", "data.monster." + this.monster.name);
    this.monster.isAlly = !this.monster.isAlly;
    gameManager.stateManager.after();
  }

  override close(): void {
    super.close();
    this.statOverview = false;
  }

}

@Component({
  selector: 'ghs-monster-stats-popup',
  templateUrl: './statspopup.html',
  styleUrls: [ './statspopup.scss', '../../../popup/popup.scss' ]
})
export class MonsterStatsPopupComponent extends PopupComponent {

  @Input() monster!: Monster;

  levels: number[] = [ 0, 1, 2, 3, 4, 5, 6, 7 ];

  getEdition(): string {
    return gameManager.getEdition(this.monster);
  }

  getMonsterForLevel(level: number): Monster {
    let monster: Monster = new Monster(this.monster);
    monster.isAlly = this.monster.isAlly;
    monster.level = level;
    monster.errors = this.monster.errors;
    return monster;
  }
}