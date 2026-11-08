import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { ReputationSection } from 'src/app/game/model/data/EditionData';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsRangePipe, PointerInputDirective, TrackUUIDPipe],
  selector: 'ghs-party-sheet-gh2e-factions',
  templateUrl: 'gh2e-factions.html',
  styleUrls: ['../../../sheet.scss', './gh2e-factions.scss']
})
export class PartySheetGh2eFactionsComponent extends PartySheetSection {
  factions: string[] = [];
  factionUnlocks: string[] = [];
  reputationSections: ReputationSection[] = [];
  reputationSectionsMapped: Record<string, ReputationSection[]> = {};

  override update(): void {
    const campaign = gameManager.campaignManager.campaignData();
    if (campaign.factions) {
      this.factions = campaign.factions;
      this.factions.forEach((faction) => {
        if (!this.party.factionReputation[faction]) {
          this.party.factionReputation[faction] = 0;
        }
      });

      this.factionUnlocks = gameManager.campaignManager.gh2eFactionUnlocks();
    }

    if (campaign.reputationSections) {
      this.reputationSections = campaign.reputationSections;
      this.reputationSectionsMapped = {};
      this.reputationSections.forEach((value) => {
        this.reputationSectionsMapped[value.faction] = this.reputationSectionsMapped[value.faction] || [];
        if (!value.requires || value.requires.length === 0) {
          this.reputationSectionsMapped[value.faction][30 - value.value - 10] = value;
        }
      });
    }
  }

  setFactionReputation(faction: string, value: number, force: boolean = false) {
    if (!force && value > 12 && !this.factionUnlocks.includes(faction)) {
      return;
    }

    if (this.party.factionReputation[faction] !== value) {
      gameManager.stateManager.before('setFactionReputation', faction, value);
      if (force && value > 12) {
        gameManager.campaignManager.unlockGh2eFaction(faction);
      }
      gameManager.campaignManager.changeFactionReputation(faction, value - (this.party.factionReputation[faction] || 0), force);
      gameManager.stateManager.after();

      this.reputationSections
        .filter(
          (reputationSection) =>
            reputationSection.faction === faction &&
            value >= reputationSection.value &&
            !this.party.conclusions.find((s) => s.edition === gameManager.game.edition && s.index === reputationSection.section) &&
            (!reputationSection.requires ||
              reputationSection.requires.length === 0 ||
              reputationSection.requires.every((index) =>
                this.party.scenarios.find((s) => s.edition === gameManager.game.edition && s.index === index)
              ))
        )
        .reverse()
        .forEach((conclusionSection) => {
          this.unlockConclusion(conclusionSection.section, true);
        });

      this.update();
    }
  }
  additionalReputation(reputationSection: ReputationSection): boolean {
    if (reputationSection.faction === 'special' && (!reputationSection.requires || reputationSection.requires.length === 0)) {
      return Object.keys(this.party.factionReputation).some(
        (faction) => (this.party.factionReputation[faction] || 0) > reputationSection.value
      );
    }

    return (
      (this.party.factionReputation[reputationSection.faction] || 0) >= reputationSection.value &&
      reputationSection.requires !== undefined &&
      reputationSection.requires.every(
        (s) =>
          this.party.scenarios.find(
            (scenarioData) => scenarioData.edition === gameManager.currentEdition() && scenarioData.index === s && !scenarioData.group
          ) !== undefined
      )
    );
  }
}
