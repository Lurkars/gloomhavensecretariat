import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/Managers';
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
    const value = !(this.character.progress.masteries || []).includes(index);
    if (gameManager.characterManager.canSetMastery(this.character, index, value)) {
      gameManager.stateManager.before(value ? 'addMastery' : 'removeMastery', this.characterName, index);
      gameManager.characterManager.setMastery(this.character, index, value);
      gameManager.stateManager.after();
    }
  }
}
