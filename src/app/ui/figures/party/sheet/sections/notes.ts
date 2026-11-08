import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-party-sheet-notes',
  templateUrl: 'notes.html',
  styleUrls: ['../../../sheet.scss', './notes.scss']
})
export class PartySheetNotesComponent extends PartySheetSection {
  setNotes(event: any) {
    if (this.party.notes !== event.target.value) {
      gameManager.stateManager.before('setPartyNotes', event.target.value);
      this.party.notes = event.target.value;
      gameManager.stateManager.after();
    }
  }
}
