import { Component, Input } from "@angular/core";
import { CharacterManager } from "src/app/game/businesslogic/CharacterManager";
import { gameManager } from "src/app/game/businesslogic/GameManager";

import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";

import { DialogComponent } from "src/app/ui/dialog/dialog";

@Component({
  selector: 'ghs-character-initiative',
  templateUrl: 'initiative.html',
  styleUrls: [ './initiative.scss', '../../../dialog/dialog.scss' ]
})
export class CharacterInitiativeComponent extends DialogComponent {

  @Input() character!: Character;
  value: string = "__";

  characterManager: CharacterManager = gameManager.characterManager;

  pickNumber(number: number) {
    this.value = (this.value + "" + number).substring(1, 3);
    if (this.value.indexOf("_") == -1) {
      gameManager.stateManager.before();
      const initative: number = + this.value;
      if (initative > 0) {
        this.character.initiative = initative;
      } else if (gameManager.game.state == GameState.draw) {
        this.character.initiative = 0;
      }
      this.close();
      gameManager.sortFigures();
      gameManager.stateManager.after();
    }
  }

  showOverlay(): boolean {
    return this.character.initiative <= 0 || gameManager.game.state == GameState.draw;
  }

  override close(): void {
    this.value = "__";
    super.close();
  }

}