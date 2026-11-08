import { NgClass } from '@angular/common';
import { Component, output } from '@angular/core';
import { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

@Component({
  imports: [NgClass, GhsLabelDirective, PointerInputDirective],
  selector: 'ghs-party-sheet-menu',
  templateUrl: 'menu.html',
  styleUrls: ['../../../sheet.scss', './menu.scss']
})
export class PartySheetMenuComponent extends PartySheetSection {
  readonly toggleSheet = output<void>();

  retirementNote: boolean = false;

  override update(): void {
    if (
      !this.retirementNote &&
      this.gh2eSheet &&
      this.gameManager.gh2eRules() &&
      this.party.retirements.length &&
      !this.isConclusion('68.4', 'gh2e')
    ) {
      this.retirementNote = true;
      this.finishConclusion('68.4');
    }
  }

  openEventEffects() {
    this.dialog.open(EntitiesMenuDialogComponent, {
      panelClass: ['dialog'],
      data: { eventMenu: true }
    });
  }
}
