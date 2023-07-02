import { Component, Inject } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { Monster } from 'src/app/game/model/Monster';
import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { AbilityDialogComponent } from 'src/app/ui/figures/ability/ability-dialog';
import { Ability } from 'src/app/game/model/data/Ability';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';

@Component({
  selector: 'ghs-stats-list',
  templateUrl: './stats-list.html',
  styleUrls: ['./stats-list.scss']
})
export class StatsListComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  constructor(@Inject(DIALOG_DATA) public monster: Monster, public dialogRef: DialogRef, private dialog: Dialog) { }

  getMonsterForLevel(level: number): Monster {
    let monster: Monster = new Monster(this.monster);
    if (monster.boss) {
      gameManager.monsterManager.addMonsterEntity(monster, level, MonsterType.boss);
    } else {
      gameManager.monsterManager.addMonsterEntity(monster, level, MonsterType.normal);
      gameManager.monsterManager.addMonsterEntity(monster, level, MonsterType.elite);
    }
    monster.isAlly = this.monster.isAlly;
    monster.isAllied = this.monster.isAllied;
    monster.level = level;
    monster.errors = this.monster.errors;
    return monster;
  }

  openAbility(ability: Ability): void {
    this.dialog.open(AbilityDialogComponent, {
      data: { ability: ability, monster: this.monster }
    });
  }
}