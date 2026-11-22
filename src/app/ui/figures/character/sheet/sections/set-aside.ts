import { Component, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-character-sheet-set-aside',
  templateUrl: 'set-aside.html',
  styleUrls: ['../../../sheet.scss', './set-aside.scss']
})
export class CharacterSheetSetAsideComponent extends CharacterSheetSection implements OnInit {
  replayable: boolean = false;

  ngOnInit(): void {
    this.replayable =
      !gameManager.game.scenario &&
      gameManager.game.figures.find(
        (figure) => figure instanceof Character && figure.name === this.character.name && figure.number === this.character.number
      ) === undefined;
  }

  get playerLabel(): string | number {
    return gameManager.game.party.players[this.character.number - 1] || this.character.number;
  }

  setAside() {
    gameManager.stateManager.before('characterSetAside', this.characterName, this.playerLabel);
    gameManager.characterManager.setAsideCharacter(this.character);
    gameManager.stateManager.after();
    this.closeDialog();
  }

  replay() {
    if (this.replayable) {
      gameManager.stateManager.before('characterReplay', this.characterName, this.playerLabel);
      gameManager.characterManager.replayCharacter(this.character);
      gameManager.stateManager.after();
      this.closeDialog();
    }
  }
}
