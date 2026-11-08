import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { moraleDefense } from 'src/app/ui/figures/party/sheet/sections/fh-morale';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-party-sheet-fh-total-defense',
  templateUrl: 'fh-total-defense.html',
  styleUrls: ['../../../sheet.scss', './fh-total-defense.scss']
})
export class PartySheetFhTotalDefenseComponent extends PartySheetSection {
  get moraleDefense(): number {
    return moraleDefense(this.party.morale);
  }

  setTotalDefense(event: any) {
    if (!isNaN(+event.target.value)) {
      const value = +event.target.value - this.moraleDefense;
      if (this.party.defense !== value) {
        gameManager.stateManager.before('setPartyTotalDefense', this.party.name, value);
        this.party.defense = value;
        gameManager.stateManager.after();
      }
    }
  }
}
