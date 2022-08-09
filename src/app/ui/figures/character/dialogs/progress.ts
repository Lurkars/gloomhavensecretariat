import { Component, ElementRef, Input, ViewChild } from "@angular/core";
import { CharacterManager } from "src/app/game/businesslogic/CharacterManager";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";

import { Character } from "src/app/game/model/Character";
import { CharacterProgress } from "src/app/game/model/CharacterProgress";
import { Edition } from "src/app/game/model/Edition";
import { Identifier } from "src/app/game/model/Identifier";

import { DialogComponent } from "src/app/ui/dialog/dialog";
import { PopupComponent } from "src/app/ui/popup/popup";

@Component({
  selector: 'ghs-character-progress',
  templateUrl: 'progress.html',
  styleUrls: [ '../../../popup/popup.scss', './progress.scss' ]
})
export class CharacterProgressDialog extends PopupComponent {

  @Input() character!: Character;

  @ViewChild('charactertitle', { static: false }) titleInput!: ElementRef;
  @ViewChild('itemName', { static: false }) itemName!: ElementRef;
  @ViewChild('itemEdition', { static: false }) itemEdition!: ElementRef;

  gameManager: GameManager = gameManager;
  characterManager: CharacterManager = gameManager.characterManager;

  override ngOnInit(): void {
    super.ngOnInit();

    if (!this.character.progress) {
      this.character.progress = new CharacterProgress();
    }

    if (this.character.progress.experience < this.characterManager.xpMap[ this.character.level - 1 ]) {
      this.character.progress.experience = this.characterManager.xpMap[ this.character.level - 1 ];
    }
  }

  setLevel(level: number) {
    if (this.character.level == level) {
      level--;
    }
    if (level < 1) {
      level = 1;
    } else if (level > 9) {
      level = 9;
    }
    this.gameManager.stateManager.before();
    this.character.setLevel(level);
    if (this.character.progress.experience < this.characterManager.xpMap[ level - 1 ] || this.character.progress.experience >= this.characterManager.xpMap[ level ]) {
      this.character.progress.experience = this.characterManager.xpMap[ level - 1 ];
    }
    this.gameManager.stateManager.after();
  }

  setXP(event: any) {
    if (!isNaN(+event.target.value)) {
      gameManager.stateManager.before();
      this.characterManager.addXP(this.character, event.target.value - this.character.progress.experience);
      this.gameManager.stateManager.after();
    }
  }

  setLoot(event: any) {
    if (!isNaN(+event.target.value)) {
      this.gameManager.stateManager.before();
      this.character.progress.loot = +event.target.value;
      this.gameManager.stateManager.after();
    }
  }

  setBattleGoals(battleGoals: number) {
    if (this.character.progress.battleGoals == battleGoals) {
      battleGoals--;
    }
    if (battleGoals < 0) {
      battleGoals = 0;
    } else if (battleGoals > 18) {
      battleGoals = 18;
    }
    this.gameManager.stateManager.before();
    this.character.progress.battleGoals = battleGoals;
    this.gameManager.stateManager.after();
  }

  setNotes(event: any) {
    this.character.progress.notes = event.target.value;
  }

  override open(): void {
    this.titleInput.nativeElement.value = this.character.title || settingsManager.getLabel('data.character.' + this.character.name.toLowerCase());
    super.open();
  }

  override close(): void {
    super.close();
    if (this.titleInput) {
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
  }

  addItem() {
    gameManager.stateManager.before();
    this.character.progress.items.push(new Identifier(this.itemName.nativeElement.value, this.itemEdition.nativeElement.value));
    this.itemName.nativeElement.value = 1;
    gameManager.stateManager.after();
  }

  removeItem(identifier: Identifier) {
    gameManager.stateManager.before();
    this.character.progress.items.splice(this.character.progress.items.indexOf(identifier), 1);
    gameManager.stateManager.after();
  }
}