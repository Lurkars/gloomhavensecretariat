import { NgTemplateOutlet } from '@angular/common';
import { Component, input } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [NgTemplateOutlet, GhsLabelDirective],
  selector: 'ghs-character-sheet-notes',
  templateUrl: 'notes.html',
  styleUrls: ['../../../sheet.scss', './notes.scss']
})
export class CharacterSheetNotesComponent extends CharacterSheetSection {
  readonly traits = input<boolean>(false);

  setNotes(event: any) {
    if (
      this.character.progress.notes !== event.target.value &&
      gameManager.characterManager.canSetProgressValue(this.character, 'notes', event.target.value)
    ) {
      gameManager.stateManager.before('setNotes', this.characterName, event.target.value);
      gameManager.characterManager.setProgressValue(this.character, 'notes', event.target.value);
      gameManager.stateManager.after();
    }
  }
}
