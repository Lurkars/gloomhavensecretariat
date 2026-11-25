import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsRangePipe],
  selector: 'ghs-party-campaign-donations',
  templateUrl: 'campaign-donations.html',
  styleUrls: ['../../../sheet.scss', './campaign-donations.scss']
})
export class PartyCampaignDonationsComponent extends PartySheetSection {
  toggleEnvelopeB() {
    if (gameManager.campaignManager.canSetEnvelopeB(!this.party.envelopeB)) {
      gameManager.stateManager.before(this.party.envelopeB ? 'disableEnvelopeB' : 'enableEnvelopeB');
      gameManager.campaignManager.setEnvelopeB(!this.party.envelopeB);
      gameManager.stateManager.after();
    }
  }
}
