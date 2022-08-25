import { Component, ElementRef, Input } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifier, AttackModifierType } from 'src/app/game/model/AttackModifier';
import { Condition, ConditionName, ConditionType } from 'src/app/game/model/Condition';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { SummonState } from 'src/app/game/model/Summon';
import { DialogComponent } from 'src/app/ui/dialog/dialog';

@Component({
  selector: 'ghs-monster-entity',
  templateUrl: './entity.html',
  styleUrls: [ './entity.scss', '../../../dialog/dialog.scss' ]
})
export class MonsterEntityComponent extends DialogComponent {

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

  dragHp: number = 0;
  dragHpOffset: number = -1;


  constructor(private element: ElementRef) {
    super();
  }

  override doubleClickCallback(): void {
    if (settingsManager.settings.activeStandees) {
      gameManager.stateManager.before();
      gameManager.monsterManager.toggleActive(this.monster, this.entity);
      gameManager.stateManager.after();
    }
  }

  changeHealth(value: number) {
    const old = this.entity.health;
    gameManager.entityManager.changeHealth(this.entity, value);
    this.health += this.entity.health - old;
  }

  countAttackModifier(type: AttackModifierType): number {
    return gameManager.game.monsterAttackModifierDeck.cards.filter((attackModifier) => {
      return attackModifier.type == type;
    }).length;
  }

  countDrawnAttackModifier(type: AttackModifierType): number {
    return gameManager.game.monsterAttackModifierDeck.cards.filter((attackModifier, index) => {
      return attackModifier.type == type && index <= gameManager.game.monsterAttackModifierDeck.current;
    }).length;
  }

  changeAttackModifier(type: AttackModifierType, value: number) {
    if (value > 0) {
      if (this.countAttackModifier(type) == 10) {
        return;
      }
      gameManager.attackModifierManager.addModifier(gameManager.game.monsterAttackModifierDeck, new AttackModifier(type));
    } else if (value < 0) {
      const card = gameManager.game.monsterAttackModifierDeck.cards.find((attackModifier, index) => {
        return attackModifier.type == type && index > gameManager.game.monsterAttackModifierDeck.current;
      });
      if (card) {
        gameManager.game.monsterAttackModifierDeck.cards.splice(gameManager.game.monsterAttackModifierDeck.cards.indexOf(card), 1);
      }
    }
  }

  changeBless(value: number) {
    gameManager.stateManager.before();
    this.changeAttackModifier(AttackModifierType.bless, value)
    gameManager.stateManager.after();
  }

  changeCurse(value: number) {
    gameManager.stateManager.before();
    this.changeAttackModifier(AttackModifierType.curse, value)
    gameManager.stateManager.after();
  }


  isImmune(conditionName: ConditionName): boolean {
    return gameManager.entityManager.isImmune(this.monster, this.entity, conditionName);
  }

  hasCondition(condition: Condition) {
    return gameManager.entityManager.hasCondition(this.entity, condition);
  }

  toggleCondition(condition: Condition) {
    gameManager.stateManager.before();
    gameManager.entityManager.toggleCondition(this.entity, condition, this.monster.active, this.monster.off);
    gameManager.stateManager.after();
    this.setDialogPosition();
  }

  hasMarker(marker: string) {
    return gameManager.entityManager.hasMarker(this.entity, marker);
  }

  toggleMarker(marker: string) {
    gameManager.stateManager.before();
    gameManager.entityManager.toggleMarker(this.entity, marker);
    gameManager.stateManager.after();
    this.setDialogPosition();
  }

  toggleSummon() {
    gameManager.stateManager.before();
    if (this.entity.summon == SummonState.false) {
      this.entity.summon = SummonState.new;
    } else if (this.entity.summon == SummonState.new) {
      this.entity.summon = SummonState.true;
    } else {
      this.entity.summon = SummonState.false;
    }
    gameManager.stateManager.after();
    this.setDialogPosition();
  }

  toggleDead() {
    gameManager.stateManager.before();
    this.dead();
    gameManager.stateManager.after();
  }

  dead() {
    if (this.opened) {
      this.close();
    }
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

    this.element.nativeElement.classList.add('dead');
  }

  changeMaxHealth(value: number) {
    gameManager.stateManager.before();
    this.entity.maxHealth += value;

    if (this.entity.maxHealth <= 1) {
      this.entity.maxHealth = 1;
    }

    if (value < 0) {
      this.entity.health = this.entity.maxHealth;
    }
    gameManager.stateManager.after();
  }

  dragHpMove(value: number) {
    if (settingsManager.settings.dragHealth) {
      const old = this.entity.health;
      if (this.dragHpOffset == -1) {
        this.dragHpOffset = value;
      }
      value = value - this.dragHpOffset;
      const dragFactor = 40 * this.element.nativeElement.offsetWidth / window.innerWidth;
      this.entity.health += Math.floor(value / dragFactor) - this.dragHp;
      if (this.entity.health > this.entity.maxHealth) {
        this.entity.health = EntityValueFunction("" + this.entity.maxHealth);
      } else if (this.entity.health < 0) {
        this.entity.health = 0;
      }
      this.dragHp += this.entity.health - old;
    }
  }

  dragHpEnd(value: number) {
    if (settingsManager.settings.dragHealth) {
      this.dragHpOffset = -1;
      if (this.dragHp != 0) {
        this.entity.health -= this.dragHp;
        gameManager.stateManager.before();
        this.changeHealth(this.dragHp);
        if (this.entity.health <= 0 || this.entity.dead && this.dragHp >= 0 && this.entity.health > 0) {
          this.dead();
        }
        this.dragHp = 0;
        this.health = 0;
      }
      gameManager.stateManager.after();
    }
  }

  override close(): void {
    super.close();
    if (this.health != 0) {
      this.entity.health -= this.health;
      gameManager.stateManager.before();
      this.changeHealth(this.health);
      if (this.entity.health <= 0 || this.entity.dead && this.health >= 0 && this.entity.health > 0) {
        this.dead();
      }
      this.dragHp = 0;
      this.health = 0;
      gameManager.stateManager.after();
    }
  }


}