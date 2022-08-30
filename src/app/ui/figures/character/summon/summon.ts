import { Component, ElementRef, Input } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Condition, ConditionType } from 'src/app/game/model/Condition';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { GameState } from 'src/app/game/model/Game';
import { Summon, SummonState } from 'src/app/game/model/Summon';
import { DialogComponent } from 'src/app/ui/dialog/dialog';
import { ghsValueSign } from 'src/app/ui/helper/Static';

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
  maxHp: number = 0;
  attack: number = 0;
  movement: number = 0;
  range: number = 0;
  levelDialog: boolean = false;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  constructor(private element: ElementRef) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    if (this.summon.init) {
      this.levelDialog = true;
      this.open();
    }
  }

  changeHealth(value: number) {
    this.health += value;
    if (this.summon.health + this.health > this.summon.maxHealth) {
      this.health = this.summon.maxHealth - this.summon.health;
    } else if (this.summon.health + this.health <= 0) {
      this.health = -this.summon.health;
    }
    gameManager.entityManager.changeHealthHighlightConditions(this.summon, this.health);
  }

  changeMaxHealth(value: number) {
    this.maxHp += value;
    if (this.summon.maxHealth + this.maxHp <= 1) {
      this.maxHp = -this.summon.maxHealth + 1;
    }
  }

  changeAttack(value: number) {
    this.attack += value;
    if (this.summon.attack + this.attack < 0) {
      this.attack = -this.summon.attack;
    }
    gameManager.stateManager.after();
  }

  changeMovement(value: number) {
    this.movement += value;
    if (this.summon.movement + this.movement <= 0) {
      this.movement = -this.summon.movement;
    }
    gameManager.stateManager.after();
  }

  changeRange(value: number) {
    this.range += value;
    if (this.summon.range + this.range <= 0) {
      this.range = -this.summon.range;
    }
    gameManager.stateManager.after();
  }

  dragHpMove(value: number) {
    if (settingsManager.settings.dragValues) {
      const dragFactor = 40 * this.element.nativeElement.offsetWidth / window.innerWidth;
      this.health = Math.floor(value / dragFactor);
      if (this.summon.health + this.health > this.summon.maxHealth) {
        this.health = EntityValueFunction("" + this.summon.maxHealth) - this.summon.health;
      } else if (this.summon.health + this.health < 0) {
        this.health = - this.summon.health;
      }
    }
  }

  dragHpEnd(value: number) {
    if (settingsManager.settings.dragValues) {
      if (this.health != 0) {
        gameManager.stateManager.before("changeSummonHp", "data.character." + this.character.name, "data.summon." + this.summon.name, ghsValueSign(this.health));
        gameManager.entityManager.changeHealth(this.summon, this.health);
        if (this.summon.health <= 0 || this.summon.dead && this.health >= 0 && this.summon.health > 0) {
          this.dead();
        }
        this.health = 0;
        this.health = 0;
      }
      gameManager.stateManager.after();
    }
  }

  dead() {
    gameManager.stateManager.before("summonDead", "data.character." + this.character.name, "data.summon." + this.summon.name);
    if (this.opened) {
      this.close();
    }
    this.summon.dead = true;

    if (gameManager.game.state == GameState.draw || this.summon.entityConditions.length == 0 || this.summon.entityConditions.every((entityCondition) => entityCondition.types.indexOf(ConditionType.turn) == -1 && entityCondition.types.indexOf(ConditionType.apply) == -1)) {
      setTimeout(() => {
        gameManager.characterManager.removeSummon(this.character, this.summon);
        gameManager.stateManager.after();
      }, 1500);
    }

    gameManager.stateManager.after();
  }

  toggleStatus() {
    let state = SummonState.new;
    if (this.summon.state == SummonState.new) {
      state = SummonState.true;
    }
    gameManager.stateManager.before("setSummonState", "data.character." + this.character.name, "data.summon." + this.summon.name, state);
    this.summon.state = state;
    gameManager.stateManager.after();
  }

  override close(): void {
    super.close();
    if (this.summon.init) {
      gameManager.characterManager.removeSummon(this.character, this.summon);
      gameManager.stateManager.before("addSummon", "data.character." + this.character.name, this.summon.name);
      this.summon.init = false;
      if (this.health != 0) {
        gameManager.entityManager.changeHealth(this.summon, this.health);
      }
      if (this.attack != 0) {
        this.summon.attack += this.attack;
      }
      if (this.movement != 0) {
        this.summon.movement += this.movement;
      }
      if (this.range != 0) {
        this.summon.range += this.range;
      }
      if (this.maxHp) {
        if (this.summon.maxHealth + this.maxHp < this.summon.maxHealth || this.summon.health == this.summon.maxHealth) {
          this.summon.health = this.summon.maxHealth + this.maxHp;
        }
        this.summon.maxHealth += this.maxHp;
      }
      gameManager.characterManager.addSummon(this.character, this.summon);
      gameManager.stateManager.after();
    } else {
      if (this.health != 0) {
        gameManager.stateManager.before("changeSummonHp", "data.character." + this.character.name, "data.summon." + this.summon.name, ghsValueSign(this.health));
        gameManager.entityManager.changeHealth(this.summon, this.health);
        gameManager.stateManager.after();
      }
      if (this.attack != 0) {
        gameManager.stateManager.before("changeSummonAttack", "data.character." + this.character.name, "data.summon." + this.summon.name, ghsValueSign(this.attack));
        this.summon.attack += this.attack;
        gameManager.stateManager.after();
      }
      if (this.movement != 0) {
        gameManager.stateManager.before("changeSummonMove", "data.character." + this.character.name, "data.summon." + this.summon.name, ghsValueSign(this.movement));
        this.summon.movement += this.movement;
        gameManager.stateManager.after();
      }
      if (this.range != 0) {
        gameManager.stateManager.before("changeSummonRange", "data.character." + this.character.name, "data.summon." + this.summon.name, ghsValueSign(this.range));
        this.summon.range += this.range;
        gameManager.stateManager.after();
      }
      if (this.maxHp) {
        gameManager.stateManager.before("changeSummonMaxHp", "data.character." + this.character.name, "data.summon." + this.summon.name, ghsValueSign(this.maxHp));
        if (this.summon.maxHealth + this.maxHp < this.summon.maxHealth || this.summon.health == this.summon.maxHealth) {
          this.summon.health = this.summon.maxHealth + this.maxHp;
        }
        this.summon.maxHealth += this.maxHp;
        gameManager.stateManager.after();
      }
    }

    this.levelDialog = false;
    this.health = 0;
    this.attack = 0;
    this.movement = 0;
    this.range = 0;
    this.maxHp = 0;
    if (this.summon.health <= 0 || this.summon.dead) {
      this.dead();
    }
  }

  openLevelDialog() {
    this.levelDialog = true;
  }
}