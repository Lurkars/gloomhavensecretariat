import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { PartySheetSelectComponent } from 'src/app/ui/figures/party/sheet/sections/party-select';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [GhsLabelDirective, PartySheetSelectComponent],
  selector: 'ghs-party-sheet-name',
  templateUrl: 'name.html',
  styleUrls: ['../../../sheet.scss', './name.scss']
})
export class PartySheetNameComponent extends PartySheetSection {
  setName(event: any) {
    if (this.party.name !== event.target.value) {
      gameManager.stateManager.before('setPartyName', event.target.value);
      this.party.name = event.target.value;
      gameManager.stateManager.after();
    }
  }

  removeParty() {
    if (gameManager.game.parties.length > 1) {
      gameManager.stateManager.before('removeParty', this.party.name || '%party% ' + this.party.id);
      gameManager.removeParty(this.party);
      gameManager.stateManager.after();
    }
  }

  newParty() {
    gameManager.stateManager.before('addParty', '%party% ' + gameManager.nextPartyId());
    gameManager.addParty();
    gameManager.stateManager.after();
  }
}
