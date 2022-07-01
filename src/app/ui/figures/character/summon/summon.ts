import { Component, ElementRef, Input } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { Condition, RoundCondition } from 'src/app/game/model/Condition';
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
  Conditions = Condition;
  SummonState = SummonState;
  health: number = 0;
  levelDialog: boolean = false;
  gameManager: GameManager = gameManager;

  constructor(private elementRef: ElementRef) {
    super();
    this.elementRef.nativeElement.classList.add("entity-animation");
    this.elementRef.nativeElement.classList.add("hidden");
  }


  removeSummon(summon: Summon) {
    summon.dead = true;
    setTimeout(() => {
      gameManager.stateManager.before();
      gameManager.characterManager.removeSummon(this.character, summon);
      gameManager.stateManager.after();
    }, 2000)
  }


  override ngOnInit(): void {
    super.ngOnInit();

    setTimeout(() => {
      this.elementRef.nativeElement.classList.remove('hidden');
    }, 0);

    if (this.summon.init) {
      this.levelDialog = true;
      this.open();
      this.summon.init = false;
    }
  }

  changeHealth(value: number) {
    gameManager.stateManager.before();
    this.summon.health += value;
    this.health += value;
    if (this.summon.health > this.summon.maxHealth) {
      this.summon.health = this.summon.maxHealth;
      this.health -= value;
    } else if (this.summon.health < 0) {
      this.summon.health = 0;
      this.health -= value;
    }
    gameManager.stateManager.after();
  }


  hasCondition(condition: Condition) {
    return this.summon.conditions.indexOf(condition) != -1;
  }

  toggleCondition(condition: Condition) {
    gameManager.stateManager.before();
    if (!this.hasCondition(condition)) {
      this.summon.conditions.push(condition);
      if (!this.character.active) {
        for (let roundCondition in RoundCondition) {
          if (this.summon.conditions.indexOf(roundCondition as Condition) != -1 && this.summon.turnConditions.indexOf(roundCondition as Condition) == -1) {
            this.summon.turnConditions.push(roundCondition as Condition);
          }
        }
      }
    } else {
      this.summon.conditions.splice(this.summon.conditions.indexOf(condition), 1);
      this.summon.turnConditions.splice(this.summon.turnConditions.indexOf(condition), 1);
      this.summon.expiredConditions.splice(this.summon.expiredConditions.indexOf(condition), 1);
    }
    gameManager.stateManager.after();
    this.setDialogPosition();
  }

  dead() {
    if (this.opened) {
      this.close();
    }
    this.elementRef.nativeElement.classList.add('hidden');
    this.removeSummon(this.summon);
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