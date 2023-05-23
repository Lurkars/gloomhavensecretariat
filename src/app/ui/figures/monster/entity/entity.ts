import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { Condition, ConditionName, ConditionType, EntityCondition } from 'src/app/game/model/Condition';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { SummonState } from 'src/app/game/model/Summon';
import { ghsDefaultDialogPositions } from 'src/app/ui/helper/Static';
import { EntityMenuDialogComponent } from '../../entity-menu/entity-menu-dialog';
import { MonsterNumberPickerDialog } from '../dialogs/numberpicker-dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'ghs-monster-entity',
  templateUrl: './entity.html',
  styleUrls: ['./entity.scss']
})
export class MonsterEntityComponent implements OnInit, OnDestroy {

  @ViewChild('standee') standee!: ElementRef;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  @Input() monster!: Monster;
  @Input() entity!: MonsterEntity;
  Conditions = Condition;
  AttackModifierType = AttackModifierType;
  SummonState = SummonState;
  ConditionName = ConditionName;
  ConditionType = ConditionType;

  health: number = 0;
  maxHp: number = 0;

  activeConditions: EntityCondition[] = [];

  constructor(private element: ElementRef, private dialog: Dialog, private overlay: Overlay) { }

  ngOnInit(): void {
    this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() });
    this.update();
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  update(): void {
    this.activeConditions = gameManager.entityManager.activeConditions(this.entity, true);
  }

  dragHpMove(value: number) {
    if (this.entity.maxHealth > 0 && !this.monster.immortal) {
      this.health = value;
      if (this.entity.health + this.health > this.entity.maxHealth) {
        this.health = EntityValueFunction(this.entity.maxHealth) - this.entity.health;
      }
    }
  }

  dragHpEnd(value: number) {
    if (this.health != 0 && this.entity.maxHealth > 0 && !this.monster.immortal) {
      gameManager.stateManager.before("changeEntityHp", "data.monster." + this.monster.name, "monster." + this.entity.type, "" + this.entity.number, "" + this.health);
      gameManager.entityManager.changeHealth(this.entity, this.health);
      gameManager.stateManager.after();
    }
    this.health = 0;
  }

  doubleClick(event: any): void {
    if (settingsManager.settings.activeStandees) {
      gameManager.stateManager.before(this.entity.active ? "unsetEntityActive" : "setEntityActive", "data.monster." + this.monster.name, "monster." + this.entity.type, "" + this.entity.number);
      gameManager.monsterManager.toggleActive(this.monster, this.entity);
      gameManager.stateManager.after();
    }
  }

  openEntityMenu(event: any): void {
    if (this.entity.number < 0) {
      const max = gameManager.monsterManager.monsterStandeeMax(this.monster);
      if (settingsManager.settings.randomStandees) {
        let number = Math.floor(Math.random() * max) + 1;
        while (gameManager.monsterManager.monsterStandeeUsed(this.monster, number)) {
          number = Math.floor(Math.random() * max) + 1;
        }
        gameManager.stateManager.before("addRandomStandee", "data.monster." + this.monster.name, "monster." + this.entity.type, "" + number);
        this.entity.number = number;
        gameManager.stateManager.after();
      } else {
        this.dialog.open(MonsterNumberPickerDialog, {
          panelClass: 'dialog',
          data: {
            monster: this.monster,
            type: this.entity.type,
            range: [],
            entity: this.entity,
            entities: this.monster.entities
          },
          positionStrategy: this.overlay.position().flexibleConnectedTo(this.standee).withPositions(ghsDefaultDialogPositions())
        })
      }
    } else {
      const dialogRef = this.dialog.open(EntityMenuDialogComponent, {
        panelClass: 'dialog',
        data: {
          entity: this.entity,
          figure: this.monster,
          positionElement: this.standee
        },
        positionStrategy: this.overlay.position().flexibleConnectedTo(this.standee).withPositions(ghsDefaultDialogPositions())
      });

      dialogRef.closed.subscribe({
        next: () => {
          if (this.entity.dead) {
            this.element.nativeElement.classList.add('dead');
          }
        }
      })
    }
  }


}