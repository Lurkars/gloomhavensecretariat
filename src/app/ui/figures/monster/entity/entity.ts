import { Component, Input } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { AttackModifier, AttackModifierType } from 'src/app/game/model/AttackModifier';
import { Condition } from 'src/app/game/model/Condition';
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

  @Input() monster!: Monster;
  @Input() entity!: MonsterEntity;
  Conditions = Condition;
  AttackModifierType = AttackModifierType;
  SummonState = SummonState;
  conditions: Condition[] = [ Condition.stun, Condition.immobilize, Condition.disarm, Condition.wound, Condition.muddle, Condition.poison, Condition.strengthen, Condition.invisible ];
  health: number = 0;

  changeHealth(value: number) {
    gameManager.stateManager.before();
    this.entity.health += value;
    this.health += value;
    if (this.entity.health > this.entity.maxHealth) {
      this.entity.health = this.entity.maxHealth;
      this.health -= value;
    } else if (this.entity.health < 0) {
      this.entity.health = 0;
      this.health -= value;
    }
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
    } else if (value < 0 && gameManager.game.attackModifiers.some((attackModifier: AttackModifier, index: number) => {
      return attackModifier.type == AttackModifierType.bless;
    })) {
      const bless = gameManager.game.attackModifiers.filter((attackModifier: AttackModifier) => {
        return attackModifier.type == AttackModifierType.bless;
      })[ 0 ];
      gameManager.game.attackModifiers.splice(gameManager.game.attackModifiers.indexOf(bless), 1);
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
    } else if (value < 0 && gameManager.game.attackModifiers.some((attackModifier: AttackModifier) => {
      return attackModifier.type == AttackModifierType.curse;
    })) {
      const curse = gameManager.game.attackModifiers.filter((attackModifier: AttackModifier) => {
        return attackModifier.type == AttackModifierType.curse;
      })[ 0 ];
      gameManager.game.attackModifiers.splice(gameManager.game.attackModifiers.indexOf(curse), 1);
    }
    gameManager.stateManager.after();
  }

  hasCondition(condition: Condition) {
    return this.entity.conditions.indexOf(condition) != -1;
  }

  toggleCondition(condition: Condition) {
    gameManager.stateManager.before();
    if (!this.hasCondition(condition)) {
      this.entity.conditions.push(condition);
    } else {
      this.entity.conditions.splice(this.entity.conditions.indexOf(condition), 1);
    }
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
    this.entity.dead = true;
    this.close();
    gameManager.stateManager.after(1000);
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
      this.entity.health = 0;
      gameManager.monsterManager.removeMonsterEntity(this.monster, this.entity);
    }
  }
}