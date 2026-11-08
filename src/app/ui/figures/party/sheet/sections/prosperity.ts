import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { FH_PROSPERITY_STEPS, GH2E_PROSPERITY_STEPS, GH_PROSPERITY_STEPS } from 'src/app/game/model/data/EditionData';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { AutoscrollDirective } from 'src/app/ui/helper/autoscroll';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

@Component({
  imports: [NgClass, AutoscrollDirective, GhsLabelDirective, GhsRangePipe, GhsTooltipDirective, PointerInputDirective],
  selector: 'ghs-party-sheet-prosperity',
  templateUrl: 'prosperity.html',
  styleUrls: ['../../../sheet.scss', './prosperity.scss']
})
export class PartySheetProsperityComponent extends PartySheetSection {
  readonly campaign = input<boolean>(false);

  prosperitySteps = GH_PROSPERITY_STEPS;
  prosperityHighlightSteps = GH_PROSPERITY_STEPS;
  prosperitySections: Record<number, string> = {};

  override update(): void {
    if (this.fhSheet) {
      this.prosperitySteps = FH_PROSPERITY_STEPS;
    } else if (this.gh2eSheet) {
      this.prosperitySteps = GH2E_PROSPERITY_STEPS;
    } else {
      this.prosperitySteps = GH_PROSPERITY_STEPS;
    }

    if (this.gh2eSheet) {
      this.prosperityHighlightSteps = [];
      for (let i = 0; i <= Math.max(...this.prosperitySteps); i++) {
        if (i % 5 === 3) {
          this.prosperityHighlightSteps.push(i);
        }
      }
    } else {
      this.prosperityHighlightSteps = this.prosperitySteps;
    }

    const campaign = gameManager.campaignManager.campaignData();
    if (campaign && campaign.prosperitySections) {
      this.prosperitySections = campaign.prosperitySections;
    }
  }

  setProsperity(value: number) {
    value -= gameManager.campaignManager.prosperityTicks() - this.party.prosperity;

    if (this.party.prosperity === value) {
      value--;
    }

    gameManager.stateManager.before('setPartyProsperity', value);
    gameManager.campaignManager.changeProsperity(value - this.party.prosperity);
    gameManager.stateManager.after();

    Object.keys(this.prosperitySections)
      .reverse()
      .forEach((prosperity) => {
        if (
          value >= +prosperity &&
          !this.party.conclusions.find((s) => s.edition === gameManager.game.edition && s.index === this.prosperitySections[+prosperity])
        ) {
          this.unlockConclusion(this.prosperitySections[+prosperity], true);
        }
      });
  }
}
