import { Component, Input } from "@angular/core";
import { CharacterManager } from "src/app/game/businesslogic/CharacterManager";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";

import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";

@Component({
  selector: 'ghs-character-image',
  templateUrl: 'image.html',
  styleUrls: ['./image.scss']
})
export class CharacterImageComponent {

  @Input() character!: Character;

  characterManager: CharacterManager = gameManager.characterManager;
  gameManager: GameManager = gameManager;
  GameState = GameState;

}