import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [GhsLabelDirective, TrackUUIDPipe],
  selector: 'ghs-party-sheet-select',
  templateUrl: 'party-select.html',
  styleUrls: ['../../../sheet.scss', './party-select.scss']
})
export class PartySheetSelectComponent extends PartySheetSection {
  selectParty(event: any) {
    const party = gameManager.game.parties.find((party) => !isNaN(+event.target.value) && party.id === +event.target.value);
    if (party) {
      gameManager.stateManager.before('changeParty', party.name || '%party% ' + party.id);
      gameManager.changeParty(party);
      gameManager.stateManager.after();
    }
  }
}
