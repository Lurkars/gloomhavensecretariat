import { ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CharacterManager } from 'src/app/game/businesslogic/CharacterManager';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CharacterEntity } from 'src/app/game/model/CharacterEntity';
import { Condition } from 'src/app/game/model/Condition';
import { GameState } from 'src/app/game/model/Game';
import { Summon } from 'src/app/game/model/Summon';
import { DialogComponent } from '../../dialog/dialog';

@Component({
  selector: 'ghs-character',
  templateUrl: './character.html',
  styleUrls: [ './character.scss', '../../dialog/dialog.scss' ]
})
export class CharacterComponent extends DialogComponent {

  @Input() character!: CharacterEntity;

  @ViewChild('charactertitle', { static: false }) titleInput!: ElementRef;

  characterManager: CharacterManager = gameManager.characterManager;

  GameState = GameState;
  Conditions = Condition;
  conditions: Condition[] = [ Condition.stun, Condition.immobilize, Condition.disarm, Condition.wound, Condition.muddle, Condition.poison, Condition.strengthen, Condition.invisible ];
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
    } else {
      this.character.conditions.splice(this.character.conditions.indexOf(condition), 1);
    }
    gameManager.stateManager.after();
  }

  exhausted() {
    gameManager.stateManager.before();
    this.character.exhausted = !this.character.exhausted;
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
    this.levelDialog = false;
  }

}