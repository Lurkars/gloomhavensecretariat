import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/Managers';
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
    if (isNaN(+event.target.value)) {
      return;
    }
    const value = Math.max(0, +event.target.value);
    event.target.value = value;
    if (this.party.inspiration !== value) {
      gameManager.stateManager.before('setPartyInspiration', this.party.name, value);
      this.party.inspiration = value;
      gameManager.stateManager.after();
    }
  }
}
