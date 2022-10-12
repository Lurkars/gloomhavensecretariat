import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { FigureError, FigureErrorType } from 'src/app/game/model/FigureError';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterStat } from 'src/app/game/model/MonsterStat';
import { MonsterType } from 'src/app/game/model/MonsterType';
import { ghsDefaultDialogPositions } from 'src/app/ui/helper/Static';
import { MonsterLevelDialogComponent } from '../dialogs/level-dialog';

@Component({
  selector: 'ghs-monster-stats',
  templateUrl: './stats.html',
  styleUrls: ['./stats.scss']
})
export class MonsterStatsComponent implements OnInit {

  @Input() monster!: Monster;
  @Input() showName: boolean = false;
  @Input() forceStats: boolean = false;
  MonsterType = MonsterType;
  settingsManager: SettingsManager = settingsManager;

  stats: MonsterStat | undefined = undefined;
  eliteStats: MonsterStat | undefined = undefined;
  statOverview: boolean = false;

  @ViewChild('levelButton', { read: ElementRef }) levelButton!: ElementRef;

  constructor(private dialog: Dialog, private overlay: Overlay) { }


  ngOnInit(): void {
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
    let stat = this.monster.stats.find((monsterStat) => {
      return monsterStat.level == this.monster.level && monsterStat.type == type;
    });
    if (!stat) {
      stat = new MonsterStat(type, this.monster.level, 0, 0, 0, 0);
      this.monster.stats.push(stat);
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

  openLevelDialog() {
    const levelDialog = this.dialog.open(MonsterLevelDialogComponent, {
      panelClass: 'dialog',
      data: this.monster,
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.levelButton).withPositions(ghsDefaultDialogPositions())
    });
    levelDialog.closed.subscribe({
      next: (level) => {
        if (typeof level == 'number') {
          this.setLevel(level);
        }
      }
    })
  }

}