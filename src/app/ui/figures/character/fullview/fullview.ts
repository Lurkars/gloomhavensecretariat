import { Component } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { CharacterComponent } from "../character";

@Component({
	standalone: false,
  selector: 'ghs-character-fullview',
  templateUrl: './fullview.html',
  styleUrls: [ '../character.scss', './fullview.scss' ]
})
export class CharacterFullViewComponent extends CharacterComponent {

  cancel() {
    this.character.fullview = false;
    gameManager.stateManager.saveLocal();
    gameManager.uiChange.emit();
  }

}