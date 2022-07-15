import { Component, Input } from "@angular/core";
import { CharacterManager } from "src/app/game/businesslogic/CharacterManager";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";

import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";

@Component({
  selector: 'ghs-character-image',
  templateUrl: 'image.html',
  styleUrls: [ './image.scss' ]
})
export class CharacterImageComponent {

  @Input() character!: Character;
  value: string = "__";

  characterManager: CharacterManager = gameManager.characterManager;

  toggleFigure(): void {
    if ((gameManager.game.state == GameState.draw && settingsManager.settings.initiativeRequired && this.character.initiative <= 0) || this.character.exhausted) {
      //
    } else {
      gameManager.stateManager.before();
      gameManager.toggleFigure(this.character);
      gameManager.stateManager.after(250);
    }
  }

}