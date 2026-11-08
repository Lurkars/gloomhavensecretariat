import { NgClass } from '@angular/common';
import { Component, output } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { PartySheetLayout } from 'src/app/ui/figures/party/sheet/layouts/layout';
import { PartySheetAchievementsComponent } from 'src/app/ui/figures/party/sheet/sections/achievements';
import { PartyCampaignConclusionsComponent } from 'src/app/ui/figures/party/sheet/sections/campaign-conclusions';
import { PartyCampaignDonationsComponent } from 'src/app/ui/figures/party/sheet/sections/campaign-donations';
import { PartyCampaignItemsComponent } from 'src/app/ui/figures/party/sheet/sections/campaign-items';
import { PartyCampaignPlayersComponent } from 'src/app/ui/figures/party/sheet/sections/campaign-players';
import { PartyCampaignRetirementsComponent } from 'src/app/ui/figures/party/sheet/sections/campaign-retirements';
import { PartyCampaignScenariosComponent } from 'src/app/ui/figures/party/sheet/sections/campaign-scenarios';
import { PartyCampaignTreasuresComponent } from 'src/app/ui/figures/party/sheet/sections/campaign-treasures';
import { PartySheetMapLinksComponent } from 'src/app/ui/figures/party/sheet/sections/map-links';
import { PartySheetProsperityComponent } from 'src/app/ui/figures/party/sheet/sections/prosperity';
import { StatisticsDialogComponent } from 'src/app/ui/figures/party/statistics/statistics-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsDurationLabelPipe } from 'src/app/ui/helper/Pipes';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

@Component({
  imports: [
    NgClass,
    GhsLabelDirective,
    GhsDurationLabelPipe,
    GhsTooltipDirective,
    PartySheetMapLinksComponent,
    PartyCampaignScenariosComponent,
    PartyCampaignConclusionsComponent,
    PartySheetProsperityComponent,
    PartyCampaignDonationsComponent,
    PartySheetAchievementsComponent,
    PartyCampaignItemsComponent,
    PartyCampaignTreasuresComponent,
    PartyCampaignPlayersComponent,
    PartyCampaignRetirementsComponent
  ],
  selector: 'ghs-party-sheet-campaign',
  templateUrl: 'campaign.html',
  styleUrls: ['../../../sheet.scss', './campaign.scss']
})
export class PartySheetCampaignComponent extends PartySheetLayout {
  readonly closeCampaign = output<void>();
  readonly editionChange = output<string>();

  toggleCampaignMode() {
    gameManager.stateManager.before(this.party.campaignMode ? 'disablePartyCampaignMode' : 'enablePartyCampaignMode');
    this.party.campaignMode = !this.party.campaignMode;
    gameManager.stateManager.after();
  }

  statistics() {
    this.dialog.open(StatisticsDialogComponent, {
      panelClass: ['dialog-invert'],
      data: { scenario: undefined }
    });
  }
}
