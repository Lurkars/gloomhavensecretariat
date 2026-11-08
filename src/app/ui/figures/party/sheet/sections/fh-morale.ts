import { NgClass, SlicePipe } from '@angular/common';
import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';

export function moraleDefense(morale: number): number {
  if (morale < 3) {
    return -10;
  } else if (morale < 5) {
    return -5;
  } else if (morale < 8) {
    return 0;
  } else if (morale < 11) {
    return 5;
  } else if (morale < 14) {
    return 10;
  }
  return 15;
}

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
    this.moraleDefense = moraleDefense(this.party.morale);
    const campaign = gameManager.campaignManager.campaignData();
    if (campaign) {
      if (campaign.lowMorale && campaign.lowMorale.length) {
        this.lowMoraleSolved = 0;
        while (this.isConclusion(campaign.lowMorale[this.lowMoraleSolved]) && this.lowMoraleSolved < campaign.lowMorale.length) {
          this.lowMoraleSolved++;
        }
      }

      if (campaign.highMorale && campaign.highMorale.length) {
        this.highMoraleSolved = 0;
        while (this.isConclusion(campaign.highMorale[this.highMoraleSolved]) && this.highMoraleSolved < campaign.highMorale.length) {
          this.highMoraleSolved++;
        }
      }
    }
  }

  setMorale(value: number) {
    if (this.party.morale === value) {
      value--;
    }
    if (value < 0) {
      value = 0;
    }
    if (value > 20) {
      value = 20;
    }

    gameManager.stateManager.before('setPartyMorale', value);

    gameManager.campaignManager.changeMorale(value - this.party.morale);
    const campaignData = gameManager.campaignManager.campaignData();
    if (value === 0 && campaignData && campaignData.lowMorale && this.lowMoraleSolved <= campaignData.lowMorale.length) {
      if (this.lowMoraleSolved < campaignData.lowMorale.length) {
        this.finishConclusion(campaignData.lowMorale[this.lowMoraleSolved]);
      } else {
        this.party.conclusions = this.party.conclusions.filter(
          (model) => model.edition !== gameManager.game.edition || model.index !== campaignData.lowMorale[this.lowMoraleSolved - 1]
        );
        this.finishConclusion(campaignData.lowMorale[this.lowMoraleSolved - 1]);
      }
    } else if (value === 20 && campaignData && campaignData.highMorale && this.highMoraleSolved < campaignData.highMorale.length) {
      this.finishConclusion(campaignData.highMorale[this.highMoraleSolved]);
    }

    gameManager.stateManager.after();

    this.update();
  }
}
