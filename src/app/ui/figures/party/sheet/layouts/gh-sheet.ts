import { Component } from '@angular/core';
import { PartySheetLayout } from 'src/app/ui/figures/party/sheet/layouts/layout';
import { PartySheetAchievementsComponent } from 'src/app/ui/figures/party/sheet/sections/achievements';
import { PartySheetLocationComponent } from 'src/app/ui/figures/party/sheet/sections/location';
import { PartySheetMapLinksComponent } from 'src/app/ui/figures/party/sheet/sections/map-links';
import { PartySheetNameComponent } from 'src/app/ui/figures/party/sheet/sections/name';
import { PartySheetNotesComponent } from 'src/app/ui/figures/party/sheet/sections/notes';
import { PartySheetSelectComponent } from 'src/app/ui/figures/party/sheet/sections/party-select';
import { PartySheetReputationComponent } from 'src/app/ui/figures/party/sheet/sections/reputation';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [
    GhsLabelDirective,
    PartySheetSelectComponent,
    PartySheetMapLinksComponent,
    PartySheetNameComponent,
    PartySheetLocationComponent,
    PartySheetNotesComponent,
    PartySheetAchievementsComponent,
    PartySheetReputationComponent
  ],
  selector: 'ghs-party-sheet-gh',
  templateUrl: 'gh-sheet.html',
  styleUrls: ['../../../sheet.scss', './gh-sheet.scss']
})
export class PartySheetGhComponent extends PartySheetLayout {}
