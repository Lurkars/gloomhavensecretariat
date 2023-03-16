import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Component, Input, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { MonsterType } from 'src/app/game/model/MonsterType';
import { SummonState } from 'src/app/game/model/Summon';
import { ghsDefaultDialogPositions } from '../../helper/Static';
import { EntitiesMenuDialogComponent } from '../entities-menu/entities-menu-dialog';
import { MonsterNumberPickerDialog } from './dialogs/numberpicker';

@Component({
  selector: 'ghs-monster',
  templateUrl: './monster.html',
  styleUrls: ['./monster.scss']
})
export class MonsterComponent implements OnInit {

  @Input() monster!: Monster;
  MonsterType = MonsterType;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  nonDead: number = 0;

  constructor(private dialog: Dialog, private overlay: Overlay) {
    gameManager.uiChange.subscribe({
      next: () => {
        this.nonDead = gameManager.monsterManager.monsterEntityCount(this.monster);
      }
    })
  }

  ngOnInit(): void {
    this.nonDead = gameManager.monsterManager.monsterEntityCount(this.monster);
  }

  addMissingStandees() {
    const missingStandees = this.monster.entities.filter((monsterEntity) => monsterEntity.number < 0).sort((a, b) => {
      if (settingsManager.settings.eliteFirst && a.type != b.type) {
        return a.type == MonsterType.elite ? -1 : 1;
      }
      return 0;
    });
    this.addMissingStandee(0, missingStandees);
  }

  addMissingStandee(index: number, entites: MonsterEntity[]) {
    if (index < entites.length) {
      const monsterEntity = entites[index];
      const dialogRef = this.dialog.open(MonsterNumberPickerDialog, {
        panelClass: 'dialog',
        data: {
          monster: this.monster,
          type: monsterEntity.type,
          min: 1,
          max: this.monster.count,
          range: [],
          entity: monsterEntity
        }
      })

      dialogRef.closed.subscribe(() => {
        this.addMissingStandee(index + 1, entites);
      })
    }
  }

  sortedEntites(): MonsterEntity[] {
    return this.monster.entities.sort((a, b) => {
      if (settingsManager.settings.eliteFirst) {
        if (a.type == MonsterType.elite && b.type == MonsterType.normal) {
          return -1;
        } else if (a.type == MonsterType.normal && b.type == MonsterType.elite) {
          return 1;
        }
      }
      if (a.summon == SummonState.new && b.summon != SummonState.new) {
        return 1;
      } else if (a.summon != SummonState.new && b.summon == SummonState.new) {
        return -1;
      } else if (a.summon == SummonState.new && b.summon == SummonState.new) {
        return 0;
      }
      if (a.number < 0 && b.number >= 0) {
        return 1;
      } else if (b.number < 0 && a.number >= 0) {
        return -1;
      }
      return a.number < b.number ? -1 : 1;
    })
  }

  isNormal() {
    return this.monster.stats.some((monsterStat) => {
      return monsterStat.type == MonsterType.normal || monsterStat.type == MonsterType.elite;
    });
  }

  getEntities(type: MonsterType): MonsterEntity[] {
    return this.monster.entities.filter((value) => value.type == type).sort((a, b) => a.number - b.number);
  }

  getEdition(): string {
    return gameManager.getEdition(this.monster);
  }

  entityTypeCount(type: MonsterType): boolean {
    const count = this.monster.entities.filter((entity) => entity.type == type).length;
    return count > 1 && count < this.nonDead;
  }

  entitiesMenu(event: any, type: MonsterType | undefined = undefined) {
    this.dialog.open(EntitiesMenuDialogComponent, {
      panelClass: 'dialog',
      data: {
        monster: this.monster,
        type: type
      },
      positionStrategy: this.overlay.position().flexibleConnectedTo(event.target).withPositions(ghsDefaultDialogPositions())
    });
  }
}