import { ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CharacterManager } from 'src/app/game/businesslogic/CharacterManager';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Condition, ConditionType } from 'src/app/game/model/Condition';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { GameState } from 'src/app/game/model/Game';
import { Objective } from 'src/app/game/model/Objective';
import { DialogComponent } from '../../dialog/dialog';
import { ghsValueSign } from '../../helper/Static';

@Component({
  selector: 'ghs-objective',
  templateUrl: './objective.html',
  styleUrls: [ './objective.scss', '../../dialog/dialog.scss' ]
})
export class ObjectiveComponent extends DialogComponent {

  @Input() objective!: Objective;

  @ViewChild('objectiveTitle', { static: false }) titleInput!: ElementRef;

  characterManager: CharacterManager = gameManager.characterManager;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  ConditionType = ConditionType;
  dragHp: number = 0;
  dragHpOffset: number = -1;


  constructor(private element: ElementRef, private changeDetectorRef: ChangeDetectorRef) {
    super();
  }

  maxHealth(): number {
    return EntityValueFunction(this.objective.maxHealth + "");
  }

  showMaxHealth(): boolean {
    return !isNaN(+this.objective.maxHealth);
  }


  toggleFigure(): void {
    if ((gameManager.game.state == GameState.draw || settingsManager.settings.initiativeRequired && this.objective.initiative <= 0) && !this.objective.exhausted && this.objective.health > 0) {
      //
    } else {
      gameManager.stateManager.before(this.objective.active ? "unsetActive" : "setActive", this.objective.title || this.objective.name);
      gameManager.roundManager.toggleFigure(this.objective);
      gameManager.stateManager.after(250);
    }
  }

  changeHealth(value: number) {
    this.dragHp += value;
  }

  changeId(value: number) {
    let id = this.objective.id + value;
    if (id < 0) {
      id = 98;
    } else if (id > 98) {
      id = 0;
    }

    while (gameManager.game.figures.some((figure) => figure instanceof Objective && figure.id == id)) {
      id = id + value;
      if (id < 0) {
        id = 98;
      } else if (id > 98) {
        id = 0;
      }
    }
    gameManager.stateManager.before("changeObjectiveId", this.objective.title || this.objective.name, "" + id);
    this.objective.id = id;
    gameManager.stateManager.after();
  }

  exhausted() {
    gameManager.stateManager.before(this.objective.exhausted ? "unsetObjectiveExhausted" : "setObjectiveExhausted", this.objective.title || this.objective.name);
    this.objective.exhausted = !this.objective.exhausted;
    if (this.objective.exhausted) {
      this.objective.off = true;
      this.objective.active = false;
    } else {
      this.objective.off = false;
    }
    gameManager.sortFigures();
    gameManager.stateManager.after();
  }

  changeMaxHealth(value: number) {
    if (this.showMaxHealth()) {
      gameManager.stateManager.before("changeObjectiveMaxHP", this.objective.title || this.objective.name, ghsValueSign(value));
      this.objective.maxHealth = +this.objective.maxHealth;
      this.objective.maxHealth += value;

      if (this.objective.maxHealth <= 1) {
        this.objective.maxHealth = 1;
      }

      if (value < 0) {
        this.objective.health = this.objective.maxHealth;
      }
      gameManager.stateManager.after();
    }
  }

  dragInitativeMove(value: number) {
    if (settingsManager.settings.dragValues) {

      if (value > 99) {
        value = 99;
      } else if (value < 0) {
        value = 0;
      }

      if (value == 0 && settingsManager.settings.initiativeRequired) {
        value = 1;
      }

      this.objective.initiative = value;
    }
  }

  dragInitativeEnd(value: number) {
    if (settingsManager.settings.dragValues) {
      if (value > 99) {
        value = 99;
      } else if (value < 0) {
        value = 0;
      }

      if (value == 0 && settingsManager.settings.initiativeRequired) {
        value = 1;
      }

      gameManager.stateManager.before("setObjectiveInitiative", this.objective.title || this.objective.name, "" + value);
      this.objective.initiative = value;
      gameManager.sortFigures();
      gameManager.stateManager.after();
    }
  }

  dragHpMove(value: number) {
    if (settingsManager.settings.dragValues) {
      const old = this.objective.health;
      if (this.dragHpOffset == -1) {
        this.dragHpOffset = value;
      }
      value = value - this.dragHpOffset;
      const dragFactor = 4 * this.element.nativeElement.offsetWidth / window.innerWidth;
      this.objective.health += Math.floor(value / dragFactor) - this.dragHp;
      if (this.objective.health > this.objective.maxHealth) {
        this.objective.health = EntityValueFunction("" + this.objective.maxHealth);
      } else if (this.objective.health < 0) {
        this.objective.health = 0;
      }
      this.dragHp += this.objective.health - old;
    }
  }

  dragHpEnd(value: number) {
    if (settingsManager.settings.dragValues) {
      this.dragHpOffset = -1;
      if (this.dragHp != 0) {
        this.objective.health -= this.dragHp;
        gameManager.stateManager.before("changeHP", this.objective.title || this.objective.name, ghsValueSign(this.dragHp));
        this.changeHealth(this.dragHp);
        if (this.objective.health <= 0 || this.objective.exhausted && this.dragHp >= 0 && this.objective.health > 0) {
          this.exhausted();
        }
        this.dragHp = 0;
      }
      gameManager.stateManager.after();
    }
  }

  override close(): void {
    super.close();
    if (this.dragHp != 0) {
      gameManager.stateManager.before("changeHP", this.objective.title || this.objective.name, ghsValueSign(this.dragHp));
      const old = this.objective.health;
      gameManager.entityManager.changeHealth(this.objective, this.dragHp);
      if (this.objective.health <= 0 || this.objective.exhausted && this.dragHp >= 0 && this.objective.health > 0) {
        this.exhausted();
      }
      gameManager.stateManager.after();
      this.dragHp = 0;
    }
    if (this.titleInput) {
      if (this.titleInput.nativeElement.value && this.titleInput.nativeElement.value != new Objective(0).name) {
        if (this.objective.title != this.titleInput.nativeElement.value) {
          gameManager.stateManager.before("setTitle", this.objective.name, this.titleInput.nativeElement.value);
          this.objective.title = this.titleInput.nativeElement.value;
          gameManager.stateManager.after();
        }
      } else if (this.objective.title != "") {
        gameManager.stateManager.before("unsetTitle", this.objective.name, this.objective.title);
        this.objective.title = "";
        gameManager.stateManager.after();
      }
    }
  }

}