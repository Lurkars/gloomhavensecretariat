import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-party-sheet-location',
  templateUrl: 'location.html',
  styleUrls: ['../../../sheet.scss', './location.scss']
})
export class PartySheetLocationComponent extends PartySheetSection {
  setLocation(event: any) {
    if (this.party.location !== event.target.value) {
      gameManager.stateManager.before('setPartyLocation', event.target.value);
      this.party.location = event.target.value;
      gameManager.stateManager.after();
    }
  }
}
