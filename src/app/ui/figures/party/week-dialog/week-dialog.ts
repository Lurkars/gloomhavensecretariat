import { Dialog, DIALOG_DATA } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Scenario } from 'src/app/game/model/Scenario';
import { finishWeekConclusion, openConclusionChoice } from 'src/app/ui/figures/party/week-sections/week-sections';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [NgClass, GhsLabelDirective],
  selector: 'ghs-party-week-dialog',
  templateUrl: 'week-dialog.html',
  styleUrls: ['./week-dialog.scss']
})
export class PartyWeekDialogComponent {
  private dialog = inject(Dialog);

  gameManager: GameManager = gameManager;

  week: number = inject(DIALOG_DATA);

  sectionsFixed(): string[] {
    const campaign = gameManager.campaignManager.campaignData();
    if (campaign.weeks && campaign.weeks[this.week]) {
      return campaign.weeks[this.week] || [];
    }
    return [];
  }

  sections(): string[] {
    return gameManager.game.party.weekSections[this.week] || [];
  }

  isConclusion(section: string): boolean {
    return (
      gameManager
        .sectionData(gameManager.currentEdition())
        .find((sectionData) => sectionData.index === section && !sectionData.group && sectionData.conclusion) !== undefined
    );
  }

  isSolved(section: string): boolean {
    return (
      gameManager.game.party.conclusions.find((model) => model.edition === gameManager.game.edition && model.index === section) !==
      undefined
    );
  }

  hasConclusions(section: string): boolean {
    return gameManager.scenarioManager.hasOpenConclusions(section, gameManager.game.edition, false, true);
  }

  finishConclusion(index: string) {
    const conclusion = gameManager
      .sectionData(gameManager.currentEdition())
      .find((sectionData) => sectionData.index === index && sectionData.conclusion);
    if (conclusion) {
      const scenario = new Scenario(conclusion as ScenarioData);
      const solved = this.isSolved(index);
      this.dialog.open(ScenarioSummaryComponent, {
        panelClass: ['dialog'],
        data: {
          scenario: scenario,
          conclusionOnly: true,
          rewardsOnly: solved,
          success: solved
        }
      });
    }
  }

  openConclusions(section: string) {
    const conclusions: ScenarioData[] = gameManager.scenarioManager
      .sectionConclusions(section, gameManager.game.edition, true, true)
      .map((conclusion) => {
        conclusion.name = '';
        return conclusion;
      });
    openConclusionChoice(this.dialog, section, conclusions, (conclusion) => finishWeekConclusion(this.dialog, conclusion, this.week));
  }

  addSection(sectionElement: HTMLInputElement) {
    sectionElement.classList.add('error');
    if (!(gameManager.game.party.weekSections[this.week] || []).includes(sectionElement.value)) {
      gameManager.stateManager.before('addPartyWeekSection', gameManager.game.party.name, this.week, sectionElement.value);
      gameManager.scenarioManager.addWeekSection(this.week, sectionElement.value);
      sectionElement.classList.remove('error');
      sectionElement.value = '';
      gameManager.stateManager.after();
    }
  }

  removeSection(section: string) {
    if ((gameManager.game.party.weekSections[this.week] || []).includes(section)) {
      gameManager.stateManager.before('removePartyWeekSection', gameManager.game.party.name, this.week, section);
      gameManager.scenarioManager.removeWeekSection(this.week, section);
      gameManager.stateManager.after();
    }
  }
}
