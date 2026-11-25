import { Dialog } from '@angular/cdk/dialog';
import { PendingWeekSection } from 'src/app/game/businesslogic/CampaignManager';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Scenario } from 'src/app/game/model/Scenario';
import { WeekSectionsHintDialogComponent } from 'src/app/ui/figures/party/week-sections/week-sections-hint';
import { ScenarioConclusionComponent } from 'src/app/ui/footer/scenario/scenario-conclusion/scenario-conclusion';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';

// open the corresponding dialogs for all pending calendar sections, one after another
export function openPendingWeekSections(dialog: Dialog) {
  const pending = gameManager.campaignManager.pendingWeekSections;
  if (pending.length) {
    gameManager.campaignManager.pendingWeekSections = [];
    openNextWeekSection(dialog, [...pending]);
  }
}

/**
 * open the dialogs for a single section outside of the calendar (e.g. entered manually): its conclusion followed
 * by the choice of continuing sections, or a hint to read it in the Section Book
 */
export function openSection(dialog: Dialog, index: string, edition: string, group: string | undefined = undefined, done?: () => void) {
  openNextWeekSection(dialog, [{ week: -1, index, edition, group }], done);
}

export function openConclusionChoice(
  dialog: Dialog,
  section: string,
  conclusions: ScenarioData[],
  selected: (conclusion: ScenarioData) => void
) {
  if (!conclusions.length) {
    return;
  }
  dialog
    .open(ScenarioConclusionComponent, {
      panelClass: ['dialog'],
      data: {
        conclusions: conclusions,
        parent: gameManager.editionManager
          .sectionData(gameManager.game.edition)
          .find((sectionData) => sectionData.index === section && !sectionData.group)
      }
    })
    .closed.subscribe({
      next: (conclusion) => {
        if (conclusion) {
          selected(conclusion as ScenarioData);
        }
      }
    });
}

export function finishWeekConclusion(dialog: Dialog, conclusion: ScenarioData, week: number) {
  const scenario = new Scenario(conclusion);
  gameManager.stateManager.before('finishConclusion', ...gameManager.scenarioManager.scenarioUndoArgs(scenario));
  gameManager.campaignManager.finishWeekConclusion(scenario, week);
  gameManager.stateManager.after();
  dialog.open(ScenarioSummaryComponent, {
    panelClass: ['dialog'],
    data: { scenario: scenario, conclusionOnly: true }
  });
}

function sectionData(pending: PendingWeekSection): ScenarioData | undefined {
  return gameManager.editionManager
    .sectionData(pending.edition)
    .find((sectionData) => sectionData.index === pending.index && (sectionData.group || undefined) === (pending.group || undefined));
}

// open the conclusion and afterwards the choice of continuing sections, if any
function openConclusion(
  dialog: Dialog,
  conclusion: ScenarioData,
  pending: PendingWeekSection,
  queue: PendingWeekSection[],
  done?: () => void
) {
  dialog
    .open(ScenarioSummaryComponent, {
      panelClass: ['dialog'],
      data: { scenario: new Scenario(conclusion), conclusionOnly: true }
    })
    .closed.subscribe({
      next: () => {
        const solved = conclusion.repeatable || gameManager.campaignManager.conclusionFinished(conclusion);
        if (solved && gameManager.campaignManager.continuingSections(conclusion.index, conclusion.edition).length) {
          openChoice(dialog, { ...pending, index: conclusion.index, edition: conclusion.edition, group: conclusion.group }, queue, done);
        } else {
          openNextWeekSection(dialog, queue, done);
        }
      }
    });
}

// select one of the continuing sections
function openChoice(dialog: Dialog, pending: PendingWeekSection, queue: PendingWeekSection[], done?: () => void) {
  dialog
    .open(ScenarioConclusionComponent, {
      panelClass: ['dialog'],
      data: {
        conclusions: gameManager.campaignManager.continuingSections(pending.index, pending.edition),
        parent: sectionData(pending),
        continue: true
      }
    })
    .closed.subscribe({
      next: (selected) => {
        if (!selected) {
          openNextWeekSection(dialog, queue, done);
          return;
        }
        const selectedSection = selected as ScenarioData;
        const next: PendingWeekSection = {
          week: pending.week,
          index: selectedSection.index,
          edition: selectedSection.edition,
          group: selectedSection.group
        };
        if (!selectedSection.conclusion) {
          openChoice(dialog, next, queue, done);
          return;
        }
        // keep the selected section in the calendar for this week
        if (pending.week >= 0 && !selectedSection.repeatable) {
          gameManager.stateManager.before('addPartyWeekSection', gameManager.game.party.name, pending.week, selectedSection.index);
          gameManager.campaignManager.addWeekSection(pending.week, selectedSection.index);
          gameManager.stateManager.after();
        }
        openConclusion(dialog, selectedSection, next, queue, done);
      }
    });
}

function hasDialog(pending: PendingWeekSection): boolean {
  return (
    !!gameManager.campaignManager.weekSectionConclusion(pending.index, pending.edition, pending.group) ||
    (!!sectionData(pending) && gameManager.campaignManager.continuingSections(pending.index, pending.edition).length > 0)
  );
}

function openNextWeekSection(dialog: Dialog, queue: PendingWeekSection[], done?: () => void) {
  const pending = queue.shift();
  if (!pending) {
    if (done) {
      done();
    }
    return;
  }

  const conclusion = gameManager.campaignManager.weekSectionConclusion(pending.index, pending.edition, pending.group);
  if (conclusion) {
    openConclusion(dialog, conclusion, pending, queue, done);
    return;
  }

  if (hasDialog(pending)) {
    openChoice(dialog, pending, queue, done);
    return;
  }

  // sections without data: show a single hint for consecutive sections to read them in the Section Book
  const sections = [pending.index];
  while (queue.length && !hasDialog(queue[0])) {
    sections.push(queue.shift()!.index);
  }
  dialog
    .open(WeekSectionsHintDialogComponent, {
      panelClass: ['dialog'],
      data: sections
    })
    .closed.subscribe({ next: () => openNextWeekSection(dialog, queue, done) });
}
