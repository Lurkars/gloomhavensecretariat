import { Component, ElementRef, Input } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
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
  @Input() monster!: Monster;
  @Input() entity!: MonsterEntity;
  Conditions = Condition;
  AttackModifierType = AttackModifierType;
  SummonState = SummonState;
  ConditionName = ConditionName;
  ConditionType = ConditionType;
  health: number = 0;

  allowToggle: boolean = true;
  dragHp: number = 0;
  dragApplyTimeout: any | null = null;


  constructor(private element: ElementRef) {
    super();
  }

  changeHealth(value: number) {
    const old = this.entity.health;
    gameManager.entityManager.changeHealth(this.entity, value);
    this.health += this.entity.health - old;
  }

  countAttackModifier(type: AttackModifierType): number {
    return gameManager.game.attackModifiers.filter((attackModifier) => {
      return attackModifier.type == type;
    }).length;
  }

  changeBless(value: number) {
    gameManager.stateManager.before();
    if (value > 0) {
      if (this.countAttackModifier(AttackModifierType.bless) == 10) {
        return;
      }
      gameManager.attackModifierManager.addModifier(new AttackModifier(AttackModifierType.bless));
    } else if (value < 0) {
      const bless = gameManager.game.attackModifiers.find((attackModifier, index) => {
        return attackModifier.type == AttackModifierType.bless && index > gameManager.game.attackModifier;
      });
      if (bless) {
        gameManager.game.attackModifiers.splice(gameManager.game.attackModifiers.indexOf(bless), 1);
      }
    }
    gameManager.stateManager.after();
  }

  changeCurse(value: number) {
    gameManager.stateManager.before();
    if (value > 0) {
      if (this.countAttackModifier(AttackModifierType.curse) == 10) {
        return;
      }
      gameManager.attackModifierManager.addModifier(new AttackModifier(AttackModifierType.curse));
    } else if (value < 0) {
      const curse = gameManager.game.attackModifiers.find((attackModifier, index) => {
        return attackModifier.type == AttackModifierType.curse && index > gameManager.game.attackModifier;
      });
      if (curse) {
        gameManager.game.attackModifiers.splice(gameManager.game.attackModifiers.indexOf(curse), 1);
      }
    }
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
      this.entity.health += Math.floor(value / 4) - this.dragHp;
      if (this.entity.health > this.entity.maxHealth) {
        this.entity.health = EntityValueFunction("" + this.entity.maxHealth);
      } else if (this.entity.health < 0) {
        this.entity.health = 0;
      }
      this.dragHp += this.entity.health - old;
    }
  }

  dragHpEnd() {
    if (settingsManager.settings.dragHealth) {
      if (this.dragApplyTimeout) {
        clearTimeout(this.dragApplyTimeout);
      }
      this.dragApplyTimeout = setTimeout(() => {
        if (this.dragHp != 0) {
          this.entity.health -= this.dragHp;
          gameManager.stateManager.before();
          this.changeHealth(this.dragHp);
          if (this.entity.health <= 0 || this.entity.dead && this.dragHp >= 0 && this.entity.health > 0) {
            this.dead();
          }
          this.dragHp = 0;
          this.health = 0;
          gameManager.stateManager.after();
        }

        setTimeout(() => {
          this.allowToggle = true;
        }, 200);
      }, 1500);
    }
  }

  dragTimeout(timeout: boolean) {
    this.allowToggle = timeout;
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

  override toggle(): void {
    if (!settingsManager.settings.dragHealth || this.allowToggle) {
      super.toggle();
      this.allowToggle = true;
    }
  }
}