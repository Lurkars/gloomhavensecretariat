import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-party-sheet-inspiration',
  templateUrl: 'inspiration.html',
  styleUrls: ['../../../sheet.scss', './inspiration.scss']
})
export class PartySheetInspirationComponent extends PartySheetSection {
  setInspiration(event: any) {
    if (!isNaN(+event.target.value) && this.party.inspiration !== +event.target.value) {
      gameManager.stateManager.before('setPartyInspiration', this.party.name, event.target.value);
      this.party.inspiration = +event.target.value;
      gameManager.stateManager.after();
    }
  }
}
