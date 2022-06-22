import { ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CharacterManager } from 'src/app/game/businesslogic/CharacterManager';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Condition } from 'src/app/game/model/Condition';
import { Figure } from 'src/app/game/model/Figure';
import { GameState } from 'src/app/game/model/Game';
import { Objective } from 'src/app/game/model/Objective';
import { DialogComponent } from '../../dialog/dialog';


export const ObjectiveIdMap = [ "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z" ];

@Component({
  selector: 'ghs-objective',
  templateUrl: './objective.html',
  styleUrls: [ './objective.scss', '../../dialog/dialog.scss' ]
})
export class ObjectiveComponent extends DialogComponent {

  @Input() objective!: Objective;

  @ViewChild('objectivetitle', { static: false }) titleInput!: ElementRef;

  characterManager: CharacterManager = gameManager.characterManager;

  GameState = GameState;
  Conditions = Condition;
  health: number = 0;
  objectiveIdMap = ObjectiveIdMap;


  constructor(private changeDetectorRef: ChangeDetectorRef) {
    super();
  }

  toggleOff(): void {
    if ((gameManager.game.state == GameState.draw || this.objective.initiative <= 0) && !this.objective.exhausted && this.objective.health > 0) {
      //
    } else {
      gameManager.stateManager.before();
      gameManager.toggleOff(this.objective);
      gameManager.stateManager.after();
    }
  }

  changeHealth(value: number) {
    gameManager.stateManager.before();
    this.objective.health += value;
    this.health += value;
    if (this.objective.health > this.objective.maxHealth) {
      this.objective.health = this.objective.maxHealth;
      this.health -= value;
    } else if (this.objective.health < 0) {
      this.objective.health = 0;
      this.health -= value;
    }
    gameManager.stateManager.after();
  }

  changeId(value: number) {
    gameManager.stateManager.before();
    let id = this.objective.id + value;
    if (id < 0) {
      id = this.objectiveIdMap.length - 1;
    } else if (id >= this.objectiveIdMap.length) {
      id = 0;
    }

    while (gameManager.game.figures.some((figure: Figure) => figure instanceof Objective && figure.id == id)) {
      id = id + value;
      if (id < 0) {
        id = this.objectiveIdMap.length - 1;
      } else if (id >= this.objectiveIdMap.length) {
        id = 0;
      }
    }
    this.objective.id = id;
    gameManager.stateManager.after();
  }

  exhausted() {
    gameManager.stateManager.before();
    this.objective.exhausted = !this.objective.exhausted;
    gameManager.stateManager.after();
  }

  changeMaxHealth(value: number) {
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