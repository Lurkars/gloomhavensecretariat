import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Scenario } from 'src/app/game/model/Scenario';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { CampaignScenarioData, campaignScenarioData, maxScenario } from 'src/app/ui/figures/party/sheet/sections/campaign-scenarios';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsTooltipDirective, TrackUUIDPipe],
  selector: 'ghs-party-campaign-conclusions',
  templateUrl: 'campaign-conclusions.html',
  styleUrls: ['../../../sheet.scss', './campaign-conclusions.scss']
})
export class PartyCampaignConclusionsComponent extends PartySheetSection {
  data: CampaignScenarioData = new CampaignScenarioData();
  manualConclusions: boolean = false;
  maxScenario = maxScenario;

  get scenarioEditions(): string[] {
    return this.data.scenarioEditions;
  }

  get conclusions(): Record<string, ScenarioData[]> {
    return this.data.conclusions;
  }

  override update(): void {
    this.data = campaignScenarioData(this.party, this.edition());
    this.manualConclusions =
      (this.edition() &&
        gameManager.sectionData(this.edition()).find((sectionData) => sectionData.conclusion && !sectionData.parent) !== undefined) ||
      false;
  }

  scenarioRewards(scenarioData: ScenarioData, conclusionOnly: boolean = false) {
    const conclusion = this.party.conclusions
      .filter((value) => value.edition === scenarioData.edition)
      .map(
        (value) =>
          gameManager
            .sectionData(scenarioData.edition)
            .find(
              (sectionData) =>
                sectionData.index === value.index && sectionData.edition === value.edition && sectionData.group === value.group
            ) as ScenarioData
      )
      .find((conclusionData) => conclusionData.parent === scenarioData.index && conclusionData.group === scenarioData.group);

    this.dialog.open(ScenarioSummaryComponent, {
      panelClass: ['dialog'],
      data: {
        scenario: new Scenario(scenarioData),
        conclusion: conclusion,
        success: true,
        rewardsOnly: true,
        conclusionOnly: conclusionOnly
      }
    });
  }
  selectFinishConclusion(indexElement: HTMLInputElement, force: boolean = false) {
    const index: string = indexElement.value;
    indexElement.classList.add('error');
    const conclusion = gameManager
      .sectionData(this.edition() || gameManager.currentEdition())
      .find((sectionData) => sectionData.index === index);
    if (conclusion) {
      indexElement.classList.remove('error');
      if (
        force ||
        !this.party.conclusions.find(
          (value) => value.edition === conclusion.edition && value.group === conclusion.group && value.index === conclusion.index
        )
      ) {
        indexElement.value = '';
        this.finishConclusion(index, force);
      } else {
        indexElement.classList.add('warning');
      }
    }
  }
}
