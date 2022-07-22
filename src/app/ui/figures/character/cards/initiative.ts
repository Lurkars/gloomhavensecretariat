import { Component, Input } from "@angular/core";
import { CharacterManager } from "src/app/game/businesslogic/CharacterManager";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";

import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { Objective } from "src/app/game/model/Objective";

import { DialogComponent } from "src/app/ui/dialog/dialog";

@Component({
  selector: 'ghs-character-initiative',
  templateUrl: 'initiative.html',
  styleUrls: [ './initiative.scss', '../../../dialog/dialog.scss' ]
})
export class CharacterInitiativeComponent extends DialogComponent {

  @Input() character!: Character | Objective;
  value: string = "__";

  characterManager: CharacterManager = gameManager.characterManager;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;

  pickNumber(number: number) {
    this.value = (this.value + "" + number).substring(1, 3);
    if (this.value.indexOf("_") == -1) {
      gameManager.stateManager.before();
      const initative: number = + this.value;
      if (initative > 0 && initative < 100) {
        this.setInitiative(initative);
      } else if (gameManager.game.state == GameState.draw) {
        this.character.initiative = 0;
      }
      this.close();
      gameManager.sortFigures();
      gameManager.stateManager.after();
    }
  }

  initiativeHidden(): boolean {
    return gameManager.game.state == GameState.draw && this.character instanceof Character && !this.character.initiativeVisible;
  }

  updateInitiative(event: any) {
    const initative: number = isNaN(+event.target.value) ? 0 : +event.target.value;
    if (((gameManager.game.state == GameState.draw || !settingsManager.settings.initiativeRequired) && initative >= 0 || initative > 0) && initative < 100) {
      this.setInitiative(initative);
    } else {
      event.target.value = "" + this.character.initiative
    }
  }

  setInitiative(initative: number) {
    if (((gameManager.game.state == GameState.draw || !settingsManager.settings.initiativeRequired) && initative >= 0 || initative > 0) && initative < 100) {
      gameManager.stateManager.before();
      this.character.initiative = initative;
      if (this.character instanceof Character) {
        this.character.initiativeVisible = true;
      }
      gameManager.sortFigures();
      gameManager.stateManager.after();
    }
  }

  showOverlay(): boolean {
    return settingsManager.settings.initiativeRequired && this.character.initiative <= 0 || gameManager.game.state == GameState.draw;
  }

  override close(): void {
    this.value = "__";
    super.close();
  }

}