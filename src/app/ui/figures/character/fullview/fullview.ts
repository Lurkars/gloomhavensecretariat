import { Component } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { CharacterComponent } from "../character";

@Component({
  selector: 'ghs-character-fullview',
  templateUrl: './fullview.html',
  styleUrls: ['../character.scss', './fullview.scss']
})
export class CharacterFullViewComponent extends CharacterComponent {

  async cancel() {
    this.character.fullview = false;
    await gameManager.stateManager.saveLocal();
    gameManager.uiChange.emit();
  }

}