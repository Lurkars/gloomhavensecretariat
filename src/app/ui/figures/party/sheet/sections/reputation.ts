import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe, GhsValueSignPipe } from 'src/app/ui/helper/Pipes';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsRangePipe, GhsValueSignPipe],
  selector: 'ghs-party-sheet-reputation',
  templateUrl: 'reputation.html',
  styleUrls: ['../../../sheet.scss', './reputation.scss']
})
export class PartySheetReputationComponent extends PartySheetSection {
  priceModifier: number = 0;

  override update(): void {
    if (this.party.reputation >= 0) {
      this.priceModifier = Math.ceil((this.party.reputation - 2) / 4) * -1;
    } else {
      this.priceModifier = Math.floor((this.party.reputation + 2) / 4) * -1;
    }
  }

  setReputation(value: number) {
    if (this.party.reputation !== value) {
      gameManager.stateManager.before('setPartyReputation', value);
      gameManager.campaignManager.changeReputation(value - this.party.reputation);
      gameManager.stateManager.after();
      this.update();
    }
  }
}
