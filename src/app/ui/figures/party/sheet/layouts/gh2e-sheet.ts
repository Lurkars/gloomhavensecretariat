import { Component } from '@angular/core';
import { PartySheetLayout } from 'src/app/ui/figures/party/sheet/layouts/layout';
import { PartySheetGh2eFactionsComponent } from 'src/app/ui/figures/party/sheet/sections/gh2e-factions';
import { PartySheetGh2eGreatOakComponent } from 'src/app/ui/figures/party/sheet/sections/gh2e-great-oak';
import { PartySheetGh2eImbuementComponent } from 'src/app/ui/figures/party/sheet/sections/gh2e-imbuement';
import { PartySheetInspirationComponent } from 'src/app/ui/figures/party/sheet/sections/inspiration';
import { PartySheetNameComponent } from 'src/app/ui/figures/party/sheet/sections/name';
import { PartySheetNotesComponent } from 'src/app/ui/figures/party/sheet/sections/notes';
import { PartySheetProsperityComponent } from 'src/app/ui/figures/party/sheet/sections/prosperity';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [
    GhsLabelDirective,
    PartySheetNameComponent,
    PartySheetInspirationComponent,
    PartySheetGh2eFactionsComponent,
    PartySheetNotesComponent,
    PartySheetGh2eImbuementComponent,
    PartySheetGh2eGreatOakComponent,
    PartySheetProsperityComponent
  ],
  selector: 'ghs-party-sheet-gh2e',
  templateUrl: 'gh2e-sheet.html',
  styleUrls: ['../../../sheet.scss', './gh2e-sheet.scss']
})
export class PartySheetGh2eComponent extends PartySheetLayout {}
