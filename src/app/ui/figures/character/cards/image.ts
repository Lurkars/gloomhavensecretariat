import { Dialog } from "@angular/cdk/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { Component, ElementRef, Input } from "@angular/core";
import { CharacterManager } from "src/app/game/businesslogic/CharacterManager";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";

import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { ghsDefaultDialogPositions } from "src/app/ui/helper/Static";
import { CharacterInitiativeDialogComponent } from "./initiative";

@Component({
  selector: 'ghs-character-image',
  templateUrl: 'image.html',
  styleUrls: [ './image.scss' ]
})
export class CharacterImageComponent {

  @Input() character!: Character;
  value: string = "__";

  characterManager: CharacterManager = gameManager.characterManager;
  gameManager: GameManager = gameManager;
  GameState = GameState;

  constructor(private dialog: Dialog, private overlay: Overlay, private elementRef: ElementRef) { }

  toggleFigure(): void {
    if (gameManager.game.state == GameState.next && !this.character.exhausted && (!settingsManager.settings.initiativeRequired || this.character.initiative > 0)) {
      gameManager.stateManager.before(this.character.active ? "unsetActive" : "setActive", "data.character." + this.character.name);
      gameManager.roundManager.toggleFigure(this.character);
      gameManager.stateManager.after(250);
    } else if (settingsManager.settings.initiativeRequired && this.character.initiative <= 0 || gameManager.game.state == GameState.draw) {
      this.dialog.open(CharacterInitiativeDialogComponent, {
        panelClass: 'dialog',
        data: this.character,
        positionStrategy: this.overlay.position().flexibleConnectedTo(this.elementRef).withPositions(ghsDefaultDialogPositions())
      });
    }
  }

}