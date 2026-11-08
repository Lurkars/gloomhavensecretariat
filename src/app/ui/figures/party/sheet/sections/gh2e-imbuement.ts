import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsRangePipe, PointerInputDirective],
  selector: 'ghs-party-sheet-gh2e-imbuement',
  templateUrl: 'gh2e-imbuement.html',
  styleUrls: ['../../../sheet.scss', './gh2e-imbuement.scss']
})
export class PartySheetGh2eImbuementComponent extends PartySheetSection {
  imbuementSections: Record<number, string> = {};

  override update(): void {
    const campaign = gameManager.campaignManager.campaignData();
    if (campaign && campaign.imbuementSections) {
      this.imbuementSections = campaign.imbuementSections;
    }
  }

  setImbuement(value: number) {
    if (this.party.imbuement === value) {
      value--;
    }

    if (value < 0) {
      value = 0;
    }

    gameManager.stateManager.before('setPartyImbuement', value);
    this.party.imbuement = value;
    gameManager.stateManager.after();

    Object.keys(this.imbuementSections)
      .reverse()
      .forEach((imbuement) => {
        if (
          value >= +imbuement &&
          !this.party.conclusions.find((s) => s.edition === gameManager.game.edition && s.index === this.imbuementSections[+imbuement])
        ) {
          this.unlockConclusion(this.imbuementSections[+imbuement], true);
        }
      });
  }
}
