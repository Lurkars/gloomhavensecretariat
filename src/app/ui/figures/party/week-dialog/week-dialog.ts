import { Dialog, DIALOG_DATA } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Scenario } from 'src/app/game/model/Scenario';
import { ScenarioConclusionComponent } from 'src/app/ui/footer/scenario/scenario-conclusion/scenario-conclusion';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [NgClass, GhsLabelDirective],
  selector: 'ghs-party-week-dialog',
  templateUrl: 'week-dialog.html',
  styleUrls: ['./week-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartyWeekDialogComponent {
  private dialog = inject(Dialog);

  gameManager: GameManager = gameManager;

  week: number = inject(DIALOG_DATA);

  sectionsFixed(): string[] {
    const campaign = gameManager.campaignData();
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
        .find((sectionData) => sectionData.index == section && !sectionData.group && sectionData.conclusion) != undefined
    );
  }

  isSolved(section: string): boolean {
    return (
      gameManager.game.party.conclusions.find((model) => model.edition == gameManager.game.edition && model.index == section) != undefined
    );
  }

  hasConclusions(section: string): boolean {
    const conclusions = gameManager
      .sectionData(gameManager.game.edition)
      .filter(
        (sectionData) =>
          sectionData.conclusion &&
          !sectionData.parent &&
          sectionData.parentSections &&
          sectionData.parentSections.length == 1 &&
          sectionData.parentSections.find((parentSections) => parentSections.length == 1 && parentSections.includes(section))
      );
    return (
      conclusions.length > 0 &&
      conclusions.every(
        (conclusion) =>
          !gameManager.game.party.conclusions.find(
            (model) => model.edition == conclusion.edition && model.index == conclusion.index && model.group == conclusion.group
          )
      )
    );
  }

  finishConclusion(index: string) {
    const conclusion = gameManager
      .sectionData(gameManager.currentEdition())
      .find((sectionData) => sectionData.index == index && sectionData.conclusion);
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
    const conclusions: ScenarioData[] = gameManager
      .sectionData(gameManager.game.edition)
      .filter(
        (sectionData) =>
          sectionData.conclusion &&
          !sectionData.parent &&
          sectionData.parentSections &&
          sectionData.parentSections.length == 1 &&
          sectionData.parentSections.find((parentSections) => parentSections.length == 1 && parentSections.includes(section)) &&
          gameManager.scenarioManager.getRequirements(sectionData).length == 0
      )
      .map((conclusion) => {
        conclusion.name = '';
        return conclusion;
      });

    if (conclusions.length > 0) {
      this.dialog
        .open(ScenarioConclusionComponent, {
          panelClass: ['dialog'],
          data: {
            conclusions: conclusions,
            parent: gameManager
              .sectionData(gameManager.game.edition)
              .find((sectionData) => sectionData.index == section && !sectionData.group)
          }
        })
        .closed.subscribe({
          next: (conclusion) => {
            if (conclusion) {
              const scenario = new Scenario(conclusion as ScenarioData);
              gameManager.stateManager.before('finishConclusion', ...gameManager.scenarioManager.scenarioUndoArgs(scenario));
              gameManager.scenarioManager.finishScenario(
                scenario,
                true,
                undefined,
                false,
                false,
                false,
                gameManager.game.party.campaignMode,
                true
              );
              if (!scenario.repeatable) {
                gameManager.game.party.weekSections[this.week] = [
                  ...(gameManager.game.party.weekSections[this.week] || []),
                  scenario.index
                ];
              }
              gameManager.stateManager.after();

              this.dialog.open(ScenarioSummaryComponent, {
                panelClass: ['dialog'],
                data: {
                  scenario: scenario,
                  conclusionOnly: true
                }
              });
            }
          }
        });
    }
  }

  addSection(sectionElement: HTMLInputElement) {
    sectionElement.classList.add('error');
    if (
      !gameManager.game.party.weekSections[this.week] ||
      !gameManager.game.party.weekSections[this.week]?.includes(sectionElement.value)
    ) {
      gameManager.stateManager.before('addPartyWeekSection', gameManager.game.party.name, this.week, sectionElement.value);
      gameManager.game.party.weekSections[this.week] = [...(gameManager.game.party.weekSections[this.week] || []), sectionElement.value];
      sectionElement.classList.remove('error');
      sectionElement.value = '';
      gameManager.stateManager.after();
    }
  }

  removeSection(section: string) {
    if (gameManager.game.party.weekSections[this.week] && gameManager.game.party.weekSections[this.week]?.includes(section)) {
      gameManager.stateManager.before('removePartyWeekSection', gameManager.game.party.name, this.week, section);
      gameManager.game.party.weekSections[this.week]?.splice(gameManager.game.party.weekSections[this.week]?.indexOf(section) || -1, 1);
      if (gameManager.game.party.weekSections[this.week]?.length == 0) {
        delete gameManager.game.party.weekSections[this.week];
      }
      if (this.isSolved(section)) {
        gameManager.game.party.conclusions = gameManager.game.party.conclusions.filter(
          (conclusion) => conclusion.edition != gameManager.game.edition || conclusion.index != section
        );
      }
      gameManager.stateManager.after();
    }
  }
}
