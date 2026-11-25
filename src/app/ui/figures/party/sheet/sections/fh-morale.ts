import { NgClass, SlicePipe } from '@angular/common';
import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { ghsClamp } from 'src/app/ui/helper/Static';

@Component({
  imports: [NgClass, SlicePipe, GhsLabelDirective, GhsRangePipe],
  selector: 'ghs-party-sheet-fh-morale',
  templateUrl: 'fh-morale.html',
  styleUrls: ['../../../sheet.scss', './fh-morale.scss']
})
export class PartySheetFhMoraleComponent extends PartySheetSection {
  moraleDefense: number = 0;
  lowMoraleSolved: number = 0;
  highMoraleSolved: number = 0;

  override update(): void {
    this.moraleDefense = gameManager.outpostAttackManager.moraleDefense();
    const campaign = gameManager.campaignManager.campaignData();
    this.lowMoraleSolved = gameManager.campaignManager.moraleConclusionsSolved(campaign?.lowMorale);
    this.highMoraleSolved = gameManager.campaignManager.moraleConclusionsSolved(campaign?.highMorale);
  }

  setMorale(value: number) {
    if (this.party.morale === value) {
      value--;
    }
    value = ghsClamp(value, 0, 20);
    if (!gameManager.campaignManager.canSetMorale(value)) {
      return;
    }
    gameManager.stateManager.before('setPartyMorale', value);
    gameManager.campaignManager.setMorale(value);
    const conclusion = gameManager.campaignManager.prepareMoraleConclusion(value);
    if (conclusion) {
      this.finishConclusion(conclusion);
    }
    gameManager.stateManager.after();
    this.update();
  }
}
