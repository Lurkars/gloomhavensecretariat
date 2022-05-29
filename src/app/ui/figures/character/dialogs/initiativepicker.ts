import { Component, Input } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";

import { CharacterEntity } from "src/app/game/model/CharacterEntity";
import { GameState } from "src/app/game/model/Game";

import { DialogComponent } from "src/app/ui/dialog/dialog";

@Component({
  selector: 'ghs-character-initiativepicker',
  templateUrl: 'initiativepicker.html',
  styleUrls: [ './initiativepicker.scss', '../../../dialog/dialog.scss' ]
})
export class CharacterInitiativePicker extends DialogComponent {

  @Input() character!: CharacterEntity;
  value: string = "__";

  pickNumber(number: number) {
    this.value = (this.value + "" + number).substring(1, 3);
    if (this.value.indexOf("_") == -1) {
      gameManager.stateManager.before();
      const initative: number = + this.value;
      if (initative > 0) {
        this.character.initiative = initative;
      } else {
        this.character.initiative = 0;
      }
      this.close();
      gameManager.stateManager.after();
    }
  }

  override open(): void {
    if ((gameManager.game.state == GameState.draw || this.character.initiative <= 0) && !this.character.exhausted && this.character.health > 0) {
      super.open();
    } else {
      gameManager.stateManager.before();
      gameManager.toggleOff(this.character);
      gameManager.stateManager.after();
    }
  }

  override close(): void {
    this.value = "__";
    super.close();
  }

}