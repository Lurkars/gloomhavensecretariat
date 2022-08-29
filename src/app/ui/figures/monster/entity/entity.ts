import { Component, ElementRef, Input } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifier, AttackModifierType } from 'src/app/game/model/AttackModifier';
import { Condition, ConditionName, ConditionType } from 'src/app/game/model/Condition';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { Summon, SummonState } from 'src/app/game/model/Summon';
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

  constructor(private element: ElementRef) {
    super();
  }

  override doubleClickCallback(): void {
    if (settingsManager.settings.activeStandees) {
      gameManager.stateManager.before(this.entity.active ? "unsetEntityActive" : "setEntityActive", "data.monster." + this.monster.name, "monster." + this.entity.type, "" + this.entity.number);
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
    gameManager.stateManager.before(value < 0 ? "removeEntityBless" : "addEntityBless", "data.monster." + this.monster.name, "monster." + this.entity.type, "" + this.entity.number);
    this.changeAttackModifier(AttackModifierType.bless, value)
    gameManager.stateManager.after();
  }

  changeCurse(value: number) {
    gameManager.stateManager.before(value < 0 ? "removeEntityCurse" : "addEntityCurse", "data.monster." + this.monster.name, "monster." + this.entity.type, "" + this.entity.number);
    this.changeAttackModifier(AttackModifierType.curse, value)
    gameManager.stateManager.after();
  }


  isImmune(conditionName: ConditionName): boolean {
    return gameManager.entityManager.isImmune(this.monster, this.entity, conditionName);
  }

  hasMarker(marker: string) {
    return gameManager.entityManager.hasMarker(this.entity, marker);
  }

  toggleMarker(marker: string) {
    gameManager.stateManager.before(this.hasMarker(marker) ? "removeEntityMarker" : "addEntityMarker", "data.monster." + this.monster.name, "monster." + this.entity.type, "" + this.entity.number, "data.character." + marker);
    gameManager.entityManager.toggleMarker(this.entity, marker);
    gameManager.stateManager.after();
    this.setDialogPosition();
  }

  toggleSummon() {
    let summonState = SummonState.false;
    if (this.entity.summon == SummonState.false) {
      summonState = SummonState.new;
    } else if (this.entity.summon == SummonState.new) {
      summonState = SummonState.true;
    }

    gameManager.stateManager.before("setEntitySummonState", "data.monster." + this.monster.name, "monster." + this.entity.type, "" + this.entity.number, "" + summonState);
    this.entity.summon = summonState;
    gameManager.stateManager.after();
    this.setDialogPosition();
  }

  toggleDead() {
    gameManager.stateManager.before("entityDead", "data.monster." + this.monster.name, "monster." + this.entity.type, "" + this.entity.number);
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
    gameManager.stateManager.before("changeEntityMaxHp", "data.monster." + this.monster.name, "monster." + this.entity.type, "" + this.entity.number, "" + value);
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
    if (settingsManager.settings.dragValues) {
      const dragFactor = 40 * this.element.nativeElement.offsetWidth / window.innerWidth;
      this.dragHp = Math.floor(value / dragFactor);
      if (this.entity.health + this.dragHp > this.entity.maxHealth) {
        this.dragHp = EntityValueFunction("" + this.entity.maxHealth) - this.entity.health;
      } else if (this.entity.health + this.dragHp < 0) {
        this.dragHp = - this.entity.health;
      }
    }
  }

  dragHpEnd(value: number) {
    if (settingsManager.settings.dragValues) {
      if (this.dragHp != 0) {
        gameManager.stateManager.before("changeEntityHp", "data.monster." + this.monster.name, "monster." + this.entity.type, "" + this.entity.number, "" + this.dragHp);
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
      gameManager.stateManager.before("changeEntityHp", "data.monster." + this.monster.name, "monster." + this.entity.type, "" + this.entity.number, "" + this.health);
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