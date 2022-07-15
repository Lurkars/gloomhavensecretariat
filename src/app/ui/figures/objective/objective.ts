import { ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CharacterManager } from 'src/app/game/businesslogic/CharacterManager';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Condition, ConditionType } from 'src/app/game/model/Condition';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { GameState } from 'src/app/game/model/Game';
import { Objective } from 'src/app/game/model/Objective';
import { DialogComponent } from '../../dialog/dialog';

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
  GameState = GameState;
  ConditionType = ConditionType;
  health: number = 0;


  constructor(private changeDetectorRef: ChangeDetectorRef) {
    super();
  }

  maxHealth(): number {
    return EntityValueFunction(this.objective.maxHealth + "");
  }

  showMaxHealth(): boolean {
    return typeof this.objective.maxHealth === 'number';
  }


  toggleFigure(): void {
    if ((gameManager.game.state == GameState.draw || settingsManager.settings.initiativeRequired && this.objective.initiative <= 0) && !this.objective.exhausted && this.objective.health > 0) {
      //
    } else {
      gameManager.stateManager.before();
      gameManager.toggleFigure(this.objective);
      gameManager.stateManager.after(250);
    }
  }

  changeHealth(value: number) {
    gameManager.stateManager.before();
    const old = this.objective.health;
    gameManager.entityManager.changeHealth(this.objective, value);
    this.health += this.objective.health - old;
    gameManager.stateManager.after();
  }

  changeId(value: number) {
    gameManager.stateManager.before();
    let id = this.objective.id + value;
    if (id < 0) {
      id = 98;
    } else if (id > 98) {
      id = 0;
    }

    while (gameManager.game.figures.some((figure: Figure) => figure instanceof Objective && figure.id == id)) {
      id = id + value;
      if (id < 0) {
        id = 98;
      } else if (id > 98) {
        id = 0;
      }
    }
    this.objective.id = id;
    gameManager.stateManager.after();
  }

  exhausted() {
    gameManager.stateManager.before();
    this.objective.exhausted = !this.objective.exhausted;
    if (this.objective.exhausted) {
      this.objective.off = true;
      this.objective.active = false;
    } else {
      this.objective.off = false;
    }
    gameManager.stateManager.after();
  }

  changeMaxHealth(value: number) {
    if (typeof this.objective.maxHealth === 'number') {
      gameManager.stateManager.before();
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

  hasCondition(condition: Condition) {
    return gameManager.entityManager.hasCondition(this.objective, condition);
  }

  toggleCondition(condition: Condition) {
    gameManager.stateManager.before();
    gameManager.entityManager.toggleCondition(this.objective, condition, this.objective.active, this.objective.off);
    gameManager.stateManager.after();
  }


  override close(): void {
    super.close();
    this.health = 0;
    if (this.titleInput) {
      if (this.titleInput.nativeElement.value && this.titleInput.nativeElement.value != new Objective(0).name) {
        if (this.objective.title != this.titleInput.nativeElement.value) {
          gameManager.stateManager.before();
          this.objective.title = this.titleInput.nativeElement.value;
          gameManager.stateManager.after();
        }
      } else if (this.objective.title != "") {
        gameManager.stateManager.before();
        this.objective.title = "";
        gameManager.stateManager.after();
      }
    }
  }

}