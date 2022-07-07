import { Component, Input } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { AttackModifier, AttackModifierType } from 'src/app/game/model/AttackModifier';
import { Condition, ConditionName, ConditionType } from 'src/app/game/model/Condition';
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

  changeHealth(value: number) {
    gameManager.stateManager.before();
    const old = this.entity.health;
    gameManager.entityManager.changeHealth(this.entity, value);
    this.health += this.entity.health - old;
    gameManager.stateManager.after();
  }

  countAttackModifier(type: AttackModifierType): number {
    return gameManager.game.attackModifiers.filter((attackModifier: AttackModifier) => {
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
      const bless = gameManager.game.attackModifiers.find((attackModifier: AttackModifier, index: number) => {
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
      const curse = gameManager.game.attackModifiers.find((attackModifier: AttackModifier, index: number) => {
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

  dead() {
    gameManager.stateManager.before();
    if (this.opened) {
      this.close();
    }
    this.entity.dead = true;
    gameManager.stateManager.after();
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

  override close(): void {
    super.close();
    this.health = 0;
    if (this.entity.health <= 0 || this.entity.dead) {
      this.dead();
    }
  }
}