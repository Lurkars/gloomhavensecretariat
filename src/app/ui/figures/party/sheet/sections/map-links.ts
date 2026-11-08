import { Component } from '@angular/core';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

@Component({
  imports: [GhsTooltipDirective],
  selector: 'ghs-party-sheet-map-links',
  templateUrl: 'map-links.html',
  styleUrls: ['./map-links.scss']
})
export class PartySheetMapLinksComponent extends PartySheetSection {
  worldMap: boolean = false;

  override update(): void {
    this.worldMap = this.hasWorldMap();
  }
}
