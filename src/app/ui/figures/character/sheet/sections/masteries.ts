import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [NgClass, GhsLabelDirective],
  selector: 'ghs-character-sheet-masteries',
  templateUrl: 'masteries.html',
  styleUrls: ['../../../sheet.scss', './masteries.scss']
})
export class CharacterSheetMasteriesComponent extends CharacterSheetSection {
  toggleMastery(index: number) {
    if (!this.character.progress.masteries) {
      this.character.progress.masteries = [];
    }

    if (!this.character.progress.masteries.includes(index)) {
      gameManager.stateManager.before('addMastery', this.characterName, index);
      this.character.progress.masteries.push(index);
    } else {
      gameManager.stateManager.before('removeMastery', this.characterName, index);
      this.character.progress.masteries.splice(this.character.progress.masteries.indexOf(index), 1);
    }
    gameManager.stateManager.after();
  }
}
