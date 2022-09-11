import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifierType } from 'src/app/game/model/AttackModifier';
import { Condition, ConditionName, ConditionType } from 'src/app/game/model/Condition';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { SummonState } from 'src/app/game/model/Summon';
import { ghsDefaultDialogPositions } from 'src/app/ui/helper/Static';
import { EntityMenuDialogComponent } from '../../entity-menu/entity-menu-dialog';

@Component({
  selector: 'ghs-monster-entity',
  templateUrl: './entity.html',
  styleUrls: [ './entity.scss' ]
})
export class MonsterEntityComponent {

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

  doubleClick: any = null;

  constructor(private element: ElementRef, private dialog: Dialog, private overlay: Overlay) { }


  dead() {
    this.entity.dead = true;

    if (this.monster.entities.every((monsterEntity) => monsterEntity.dead)) {
      if (this.monster.active) {
        gameManager.roundManager.toggleFigure(this.monster);
      }
    }

    if (gameManager.game.state == GameState.draw || this.entity.entityConditions.length == 0 || this.entity.entityConditions.every((entityCondition) => entityCondition.types.indexOf(ConditionType.turn) == -1 && entityCondition.types.indexOf(ConditionType.apply) == -1)) {
      setTimeout(() => {
        gameManager.monsterManager.removeMonsterEntity(this.monster, this.entity);
        gameManager.stateManager.after();
      }, 1500);
    }
  }

  dragHpMove(value: number) {
    if (settingsManager.settings.dragValues) {
      const dragFactor = 20 * this.element.nativeElement.offsetWidth / window.innerWidth;
      this.health = Math.floor(value / dragFactor);
      if (this.entity.health + this.health > this.entity.maxHealth) {
        this.health = EntityValueFunction("" + this.entity.maxHealth) - this.entity.health;
      } else if (this.entity.health + this.health < 0) {
        this.health = - this.entity.health;
      }
    }
  }

  dragHpEnd(value: number) {
    if (settingsManager.settings.dragValues) {
      if (this.health != 0) {
        gameManager.stateManager.before("changeEntityHp", "data.monster." + this.monster.name, "monster." + this.entity.type, "" + this.entity.number, "" + this.health);
        gameManager.entityManager.changeHealth(this.entity, this.health);
        if (this.entity.health <= 0 || this.entity.dead && this.health >= 0 && this.entity.health > 0) {
          this.dead();
        }
        this.health = 0;
      }
      gameManager.stateManager.after();
    }
  }

  click(event: any): void {
    if (this.doubleClick) {
      clearTimeout(this.doubleClick);
      this.doubleClick = null;
      this.doubleClickCallback();
    } else {
      this.doubleClick = setTimeout(() => {
        if (this.doubleClick) {
          this.openEntityMenu(event);
          this.doubleClick = null;
        }
      }, 200)
    }
  }

  doubleClickCallback(): void {
    if (settingsManager.settings.activeStandees) {
      gameManager.stateManager.before(this.entity.active ? "unsetEntityActive" : "setEntityActive", "data.monster." + this.monster.name, "monster." + this.entity.type, "" + this.entity.number);
      gameManager.monsterManager.toggleActive(this.monster, this.entity);
      gameManager.stateManager.after();
    }
  }

  openEntityMenu(event: any): void {
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