import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { Condition, ConditionName, ConditionType, EntityCondition } from 'src/app/game/model/Condition';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { GameState } from 'src/app/game/model/Game';
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

  async dead() {
    this.entity.dead = true;

    if (this.monster.entities.every((monsterEntity) => monsterEntity.dead)) {
      if (this.monster.active) {
        gameManager.roundManager.toggleFigure(this.monster);
      }
    }

    if (gameManager.game.state == GameState.draw || this.entity.entityConditions.length == 0 || this.entity.entityConditions.every((entityCondition) => entityCondition.types.indexOf(ConditionType.turn) == -1 && entityCondition.types.indexOf(ConditionType.apply) == -1)) {
      setTimeout(async () => {
        gameManager.monsterManager.removeMonsterEntity(this.monster, this.entity);
        await gameManager.stateManager.after();
      }, settingsManager.settings.disableAnimations ? 0 : 1500);
    }
  }

  dragHpMove(value: number) {
    if (this.entity.maxHealth > 0 && !this.monster.immortal) {
      this.health = value;
      if (this.entity.health + this.health > this.entity.maxHealth) {
        this.health = EntityValueFunction(this.entity.maxHealth) - this.entity.health;
      } else if (this.entity.health + this.health < 0) {
        this.health = - this.entity.health;
      }
    }
  }

  async dragHpEnd(value: number) {
    if (this.health != 0 && this.entity.maxHealth > 0 && !this.monster.immortal) {
      await gameManager.stateManager.before("changeEntityHp", "data.monster." + this.monster.name, "monster." + this.entity.type, "" + this.entity.number, "" + this.health);
      gameManager.entityManager.changeHealth(this.entity, this.health);
      if (this.entity.health <= 0 || this.entity.dead && this.health >= 0 && this.entity.health > 0) {
        this.dead();
      }
      await gameManager.stateManager.after();
    }
    this.health = 0;
  }

  async doubleClick(event: any) {
    if (settingsManager.settings.activeStandees) {
      await gameManager.stateManager.before(this.entity.active ? "unsetEntityActive" : "setEntityActive", "data.monster." + this.monster.name, "monster." + this.entity.type, "" + this.entity.number);
      gameManager.monsterManager.toggleActive(this.monster, this.entity);
      await gameManager.stateManager.after();
    }
  }

  async openEntityMenu(event: any) {
    if (this.entity.number < 0) {
      const max = gameManager.monsterManager.monsterStandeeMax(this.monster);
      if (settingsManager.settings.randomStandees) {
        let number = Math.floor(Math.random() * max) + 1;
        while (gameManager.monsterManager.monsterStandeeUsed(this.monster, number)) {
          number = Math.floor(Math.random() * max) + 1;
        }
        await gameManager.stateManager.before("addRandomStandee", "data.monster." + this.monster.name, "monster." + this.entity.type, "" + number);
        this.entity.number = number;
        await gameManager.stateManager.after();
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
          figure: this.monster
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