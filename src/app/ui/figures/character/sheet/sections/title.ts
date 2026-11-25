import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/Managers';
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
    if (gameManager.characterManager.canSetAbsent(this.character, !this.character.absent)) {
      gameManager.entityManager.before(this.character, this.character, this.character.absent ? 'unsetAbsent' : 'setAbsent');
      gameManager.characterManager.setAbsent(this.character, !this.character.absent);
      gameManager.stateManager.after();
    }
  }
}
