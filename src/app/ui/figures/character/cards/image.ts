import { Component, Input } from "@angular/core";
import { CharacterManager } from "src/app/game/businesslogic/CharacterManager";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { GhsManager } from "src/app/game/businesslogic/GhsManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";

import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";

@Component({
  standalone: false,
  selector: 'ghs-character-image',
  templateUrl: 'image.html',
  styleUrls: ['./image.scss']
})
export class CharacterImageComponent {

  @Input() character!: Character;

  characterManager: CharacterManager = gameManager.characterManager;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;

  active: boolean = false;
  off: boolean = false;
  absent: boolean = false;

  constructor(private ghsManager: GhsManager) {
    this.ghsManager.uiChangeEffect(() => {
      this.active = this.character.active;
      this.off = this.character.off || this.character.exhausted || this.character.health <= 0;
      this.absent = this.character.absent;
    })
  }

}