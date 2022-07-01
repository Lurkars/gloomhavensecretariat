import { ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CharacterManager } from 'src/app/game/businesslogic/CharacterManager';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Condition, RoundCondition } from 'src/app/game/model/Condition';
import { GameState } from 'src/app/game/model/Game';
import { Summon } from 'src/app/game/model/Summon';
import { DialogComponent } from '../../dialog/dialog';

@Component({
  selector: 'ghs-character',
  templateUrl: './character.html',
  styleUrls: [ './character.scss', '../../dialog/dialog.scss' ]
})
export class CharacterComponent extends DialogComponent {

  @Input() character!: Character;

  @ViewChild('charactertitle', { static: false }) titleInput!: ElementRef;

  gameManager: GameManager = gameManager;
  characterManager: CharacterManager = gameManager.characterManager;

  GameState = GameState;
  Conditions = Condition;
  health: number = 0;
  experience: number = 0;
  loot: number = 0;
  levelDialog: boolean = false;
  levels: number[] = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
  constructor(private changeDetectorRef: ChangeDetectorRef) {
    super();
  }

  emptySummons(): boolean {
    return this.character.summons.length == 0 || this.character.summons.every((summon: Summon) => summon.dead);
  }

  changeHealth(value: number) {
    gameManager.stateManager.before();
    this.character.health += value;
    this.health += value;
    if (this.character.health > this.character.maxHealth) {
      this.character.health = this.character.maxHealth;
      this.health -= value;
    } else if (this.character.health < 0) {
      this.character.health = 0;
      this.health -= value;
    }
    gameManager.stateManager.after();
  }


  changeExperience(value: number) {
    gameManager.stateManager.before();
    this.character.experience += value;
    this.experience += value;

    if (this.character.experience <= 0) {
      this.character.experience = 0;
    }
    gameManager.stateManager.after();
  }

  changeLoot(value: number) {
    gameManager.stateManager.before();
    this.character.loot += value;
    this.loot += value;

    if (this.character.loot <= 0) {
      this.character.loot = 0;
    }
    gameManager.stateManager.after();
  }

  hasCondition(condition: Condition) {
    return this.character.conditions.indexOf(condition) != -1;
  }

  toggleCondition(condition: Condition) {
    gameManager.stateManager.before();
    if (!this.hasCondition(condition)) {
      this.character.conditions.push(condition);
      if (!this.character.active) {
        for (let roundCondition in RoundCondition) {
          if (this.character.conditions.indexOf(roundCondition as Condition) != -1 && this.character.turnConditions.indexOf(roundCondition as Condition) == -1) {
            this.character.turnConditions.push(roundCondition as Condition);
          }
        }
      }
    } else {
      this.character.conditions.splice(this.character.conditions.indexOf(condition), 1);
      this.character.turnConditions.splice(this.character.turnConditions.indexOf(condition), 1);
      this.character.expiredConditions.splice(this.character.expiredConditions.indexOf(condition), 1);
    }
    gameManager.stateManager.after();
  }

  exhausted() {
    gameManager.stateManager.before();
    this.character.exhausted = !this.character.exhausted;
    gameManager.sortFigures();
    gameManager.stateManager.after();
  }

  openLevelDialog() {
    this.levelDialog = true;
    this.changeDetectorRef.detectChanges();
    this.titleInput.nativeElement.value = this.character.title || settingsManager.getLabel('data.character.' + this.character.name.toLowerCase());
  }


  changeMaxHealth(value: number) {
    gameManager.stateManager.before();
    this.character.maxHealth += value;

    if (this.character.maxHealth <= 1) {
      this.character.maxHealth = 1;
    }

    if (value < 0) {
      this.character.health = this.character.maxHealth;
    }
    gameManager.stateManager.after();
  }

  setLevel(level: number) {
    gameManager.stateManager.before();
    this.character.setLevel(level);
    gameManager.stateManager.after();
  }

  override close(): void {
    super.close();
    if (this.health > 0 && this.character.exhausted) {
      this.character.exhausted = false;
    }

    this.health = 0;
    this.experience = 0;
    this.loot = 0;
    if (this.levelDialog && this.titleInput) {
      if (this.titleInput.nativeElement.value && this.titleInput.nativeElement.value != settingsManager.getLabel('data.character.' + this.character.name.toLowerCase())) {
        if (this.character.title != this.titleInput.nativeElement.value) {
          gameManager.stateManager.before();
          this.character.title = this.titleInput.nativeElement.value;
          gameManager.stateManager.after();
        }
      } else if (this.character.title != "") {
        gameManager.stateManager.before();
        this.character.title = "";
        gameManager.stateManager.after();
      }
    }

    if (this.character.health == 0 && !this.character.exhausted) {
      this.exhausted();
    }
    this.levelDialog = false;
  }

}