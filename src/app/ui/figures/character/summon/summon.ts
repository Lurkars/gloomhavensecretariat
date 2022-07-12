import { Component, Input } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { Condition, ConditionType, EntityCondition } from 'src/app/game/model/Condition';
import { GameState } from 'src/app/game/model/Game';
import { Summon, SummonState } from 'src/app/game/model/Summon';
import { DialogComponent } from 'src/app/ui/dialog/dialog';

@Component({
  selector: 'ghs-summon-entity',
  templateUrl: './summon.html',
  styleUrls: [ './summon.scss', '../../../dialog/dialog.scss' ]
})
export class SummonEntityComponent extends DialogComponent {


  @Input() character!: Character;
  @Input() summon!: Summon;
  SummonState = SummonState;
  ConditionType = ConditionType;
  health: number = 0;
  levelDialog: boolean = false;
  gameManager: GameManager = gameManager;

  override ngOnInit(): void {
    super.ngOnInit();
    if (this.summon.init) {
      this.levelDialog = true;
      this.open();
      this.summon.init = false;
    }
  }

  changeHealth(value: number) {
    gameManager.stateManager.before();
    const old = this.summon.health;
    gameManager.entityManager.changeHealth(this.summon, value);
    this.health += this.summon.health - old;
    gameManager.stateManager.after();
  }


  hasCondition(condition: Condition) {
    return gameManager.entityManager.hasCondition(this.summon, condition);
  }

  toggleCondition(condition: Condition) {
    gameManager.stateManager.before();
    gameManager.entityManager.toggleCondition(this.summon, condition, this.character.active, this.character.off);
    gameManager.stateManager.after();
    this.setDialogPosition();
  }

  dead() {
    gameManager.stateManager.before();
    if (this.opened) {
      this.close();
    }
    this.summon.dead = true;

    if (gameManager.game.state == GameState.draw || this.summon.entityConditions.length == 0 || this.summon.entityConditions.every((entityCondition: EntityCondition) => entityCondition.types.indexOf(ConditionType.turn) == -1 && entityCondition.types.indexOf(ConditionType.apply) == -1)) {
      setTimeout(() => {
        gameManager.characterManager.removeSummon(this.character, this.summon);
      }, 1500);
    }

    gameManager.stateManager.after();
  }

  toggleStatus() {
    if (this.summon.state == SummonState.new) {
      this.summon.state = SummonState.true;
    } else {
      this.summon.state = SummonState.new;
    }
  }

  changeMaxHealth(value: number) {
    gameManager.stateManager.before();

    if (value > 0 && this.summon.health == this.summon.maxHealth) {
      this.summon.health += value;
    }

    this.summon.maxHealth += value;

    if (this.summon.maxHealth <= 1) {
      this.summon.maxHealth = 1;
    }

    if (value < 0) {
      this.summon.health = this.summon.maxHealth;
    }
    gameManager.stateManager.after();
  }

  changeAttack(value: number) {
    gameManager.stateManager.before();
    this.summon.attack += value;
    if (this.summon.attack <= 0) {
      this.summon.attack = 0;
    }
    gameManager.stateManager.after();
  }

  changeMovement(value: number) {
    gameManager.stateManager.before();
    this.summon.movement += value;
    if (this.summon.movement <= 0) {
      this.summon.movement = 0;
    }
    gameManager.stateManager.after();
  }

  changeRange(value: number) {
    gameManager.stateManager.before();
    this.summon.range += value;
    if (this.summon.range <= 0) {
      this.summon.range = 0;
    }
    gameManager.stateManager.after();
  }

  override close(): void {
    super.close();
    this.health = 0;
    this.levelDialog = false;
    if (this.summon.health <= 0 || this.summon.dead) {
      this.dead();
    }
  }

  openLevelDialog() {
    this.levelDialog = true;
  }
}