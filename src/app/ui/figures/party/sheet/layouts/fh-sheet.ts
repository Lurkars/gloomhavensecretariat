import { Component } from '@angular/core';
import { PartyBuildingsComponent } from 'src/app/ui/figures/party/buildings/buildings';
import { PartySheetLayout } from 'src/app/ui/figures/party/sheet/layouts/layout';
import { PartySheetFhCalendarComponent } from 'src/app/ui/figures/party/sheet/sections/fh-calendar';
import { PartySheetFhCampaignStickersComponent } from 'src/app/ui/figures/party/sheet/sections/fh-campaign-stickers';
import { PartySheetFhMoraleComponent } from 'src/app/ui/figures/party/sheet/sections/fh-morale';
import { PartySheetFhResourcesComponent } from 'src/app/ui/figures/party/sheet/sections/fh-resources';
import { PartySheetFhSoldiersComponent } from 'src/app/ui/figures/party/sheet/sections/fh-soldiers';
import { PartySheetFhTotalDefenseComponent } from 'src/app/ui/figures/party/sheet/sections/fh-total-defense';
import { PartySheetFhTownGuardComponent } from 'src/app/ui/figures/party/sheet/sections/fh-town-guard';
import { PartySheetFhTownGuardDeckComponent } from 'src/app/ui/figures/party/sheet/sections/fh-town-guard-deck';
import { PartySheetInspirationComponent } from 'src/app/ui/figures/party/sheet/sections/inspiration';
import { PartySheetNameComponent } from 'src/app/ui/figures/party/sheet/sections/name';

@Component({
  imports: [
    PartyBuildingsComponent,
    PartySheetFhCalendarComponent,
    PartySheetNameComponent,
    PartySheetFhResourcesComponent,
    PartySheetInspirationComponent,
    PartySheetFhTotalDefenseComponent,
    PartySheetFhSoldiersComponent,
    PartySheetFhMoraleComponent,
    PartySheetFhTownGuardComponent,
    PartySheetFhCampaignStickersComponent,
    PartySheetFhTownGuardDeckComponent
  ],
  selector: 'ghs-party-sheet-fh',
  templateUrl: 'fh-sheet.html',
  styleUrls: ['./fh-sheet.scss']
})
export class PartySheetFhComponent extends PartySheetLayout {}
