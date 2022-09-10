import { Component, Input } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";

@Component({
  selector: 'ghs-character-fullview',
  templateUrl: './fullview.html',
  styleUrls: [ './fullview.scss' ]
})
export class CharacterFullViewComponent {

  @Input() character!: Character;

  gameManager: GameManager = gameManager;

  cancel() {
    this.character.fullview = false;
    gameManager.stateManager.saveLocal();
    gameManager.uiChange.emit();
  }

}