import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsRangePipe],
  selector: 'ghs-party-sheet-gh2e-great-oak',
  templateUrl: 'gh2e-great-oak.html',
  styleUrls: ['../../../sheet.scss', './gh2e-great-oak.scss']
})
export class PartySheetGh2eGreatOakComponent extends PartySheetSection {}
