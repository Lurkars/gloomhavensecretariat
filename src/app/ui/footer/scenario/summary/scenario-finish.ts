import { Dialog } from '@angular/cdk/dialog';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { ScenarioConclusionComponent } from 'src/app/ui/footer/scenario/scenario-conclusion/scenario-conclusion';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';

export function openScenarioSummary(dialog: Dialog, scenario: ScenarioData, success: boolean, conclusion?: ScenarioData) {
  dialog.open(ScenarioSummaryComponent, {
    panelClass: ['dialog'],
    data: { scenario: scenario, conclusion: conclusion, success: success }
  });
}

export function openScenarioFinish(
  dialog: Dialog,
  scenario: ScenarioData,
  success: boolean,
  conclusions: ScenarioData[] = gameManager.scenarioManager.scenarioConclusions(scenario)
) {
  if (!success || conclusions.length < 2) {
    openScenarioSummary(dialog, scenario, success, success && conclusions.length === 1 ? conclusions[0] : undefined);
    return;
  }
  dialog
    .open(ScenarioConclusionComponent, {
      panelClass: ['dialog'],
      data: { conclusions: conclusions, parent: scenario }
    })
    .closed.subscribe({
      next: (conclusion) => {
        if (conclusion) {
          openScenarioSummary(dialog, scenario, success, conclusion as ScenarioData);
        }
      }
    });
}
