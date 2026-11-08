import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-character-sheet-title',
  templateUrl: 'title.html',
  styleUrls: ['../../../sheet.scss', './title.scss']
})
export class CharacterSheetTitleComponent extends CharacterSheetSection {
  toggleCharacterAbsent() {
    if (this.character.absent || gameManager.characterManager.characterCount() > 1) {
      gameManager.entityManager.before(this.character, this.character, this.character.absent ? 'unsetAbsent' : 'setAbsent');
      this.character.absent = !this.character.absent;
      if (this.character.absent && this.character.active) {
        gameManager.roundManager.toggleFigure(this.character);
      }
      gameManager.stateManager.after();
    }
  }
}
