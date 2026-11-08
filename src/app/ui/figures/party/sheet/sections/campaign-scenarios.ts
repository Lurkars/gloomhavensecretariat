import { NgClass } from '@angular/common';
import { Component, output } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Party } from 'src/app/game/model/Party';
import { Scenario, ScenarioCache } from 'src/app/game/model/Scenario';
import { ScenarioRequirementsDialogComponent } from 'src/app/ui/figures/party/requirements/requirements';
import { ScenarioChartPopupDialog } from 'src/app/ui/figures/party/scenario-chart/popup/scenario-chart-popup';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { StatisticsDialogComponent } from 'src/app/ui/figures/party/statistics/statistics-dialog';
import { ScenarioConclusionComponent } from 'src/app/ui/footer/scenario/scenario-conclusion/scenario-conclusion';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

export class CampaignScenarioData {
  scenarioEditions: string[] = [];
  scenarios: Record<string, ScenarioCache[]> = {};
  conclusions: Record<string, ScenarioData[]> = {};
  finishedCountMap: Map<string, number> = new Map();
  finishedCasualCountMap: Map<string, number> = new Map();
  manualSet: Set<string> = new Set();
  randomItemLootedSet: Set<string> = new Set();
}

export function scenarioKey(scenarioData: { edition: string; group?: string; index: string }): string {
  return `${scenarioData.edition}:${scenarioData.group ?? ''}:${scenarioData.index}`;
}

export function campaignScenarioData(party: Party, partyEdition: string): CampaignScenarioData {
  const result = new CampaignScenarioData();
  const editions = (partyEdition && [partyEdition]) || gameManager.editions();

  party.scenarios.forEach((m) => {
    const key = scenarioKey(m);
    result.finishedCountMap.set(key, (result.finishedCountMap.get(key) ?? 0) + 1);
  });
  party.casualScenarios.forEach((m) => {
    const key = scenarioKey(m);
    result.finishedCasualCountMap.set(key, (result.finishedCasualCountMap.get(key) ?? 0) + 1);
  });
  result.manualSet = new Set(party.manualScenarios.map((m) => scenarioKey(m)));
  result.randomItemLootedSet = new Set(gameManager.game.party.randomItemLooted.map((m) => scenarioKey(m)));

  const blockedKeys = new Set<string>();
  const scenariosByKey = new Map<string, ScenarioData>();
  gameManager.editionData.forEach((ed) => ed.scenarios.forEach((s) => scenariosByKey.set(scenarioKey(s), s)));
  party.scenarios.forEach((m) => {
    const s = scenariosByKey.get(scenarioKey(m));
    if (s && s.blocks && result.finishedCountMap.has(scenarioKey(m))) {
      s.blocks.forEach((b) => blockedKeys.add(`${m.edition}:${m.group ?? ''}:${b}`));
    }
  });
  party.conclusions.forEach((m) => {
    const section = gameManager.scenarioManager.getSection(m.index, m.edition, m.group, true);
    if (section && section.blocks) {
      section.blocks.forEach((b) => blockedKeys.add(`${m.edition}:${m.group ?? ''}:${b}`));
    }
  });

  editions.forEach((edition) => {
    const scenarioData = gameManager.scenarioManager
      .scenarioData(edition)
      .filter(
        (scenarioData) =>
          !scenarioData.hideIndex &&
          (!scenarioData.spoiler ||
            settingsManager.settings.spoilers.includes(scenarioData.name) ||
            (scenarioData.solo && gameManager.game.unlockedCharacters.includes(scenarioData.edition + ':' + scenarioData.solo)))
      )
      .map(
        (scenarioData) =>
          new ScenarioCache(
            scenarioData,
            (result.finishedCountMap.get(scenarioKey(scenarioData)) ?? 0) > 0,
            blockedKeys.has(scenarioKey(scenarioData)),
            gameManager.scenarioManager.isLocked(scenarioData)
          )
      );
    if (scenarioData.length > 0) {
      result.scenarios[edition] = scenarioData.sort((a, b) => {
        if (a.group && !b.group) {
          return 1;
        } else if (!a.group && b.group) {
          return -1;
        } else if (a.group && b.group && a.group !== b.group) {
          return a.group < b.group ? -1 : 1;
        }

        if (!isNaN(+a.index) && !isNaN(+b.index)) {
          return +a.index - +b.index;
        }

        return a.index.toLowerCase() < b.index.toLowerCase() ? -1 : 1;
      });
      result.scenarioEditions.push(edition);
    }

    result.conclusions[edition] = party.conclusions
      .filter((value) => value.edition === edition)
      .map(
        (value) =>
          gameManager
            .sectionData(edition)
            .find(
              (sectionData) =>
                sectionData.index === value.index && sectionData.edition === value.edition && sectionData.group === value.group
            ) as ScenarioData
      )
      .filter(
        (conclusionData) =>
          conclusionData &&
          !party.scenarios.find(
            (scenarioModel) =>
              scenarioModel.edition === conclusionData.edition &&
              scenarioModel.group === conclusionData.group &&
              scenarioModel.index === conclusionData.parent
          )
      );
  });

  return result;
}

export function maxScenario(scenarios: ScenarioData[]) {
  return Math.max(...scenarios.map((scenarioData) => scenarioData.index.length));
}

@Component({
  imports: [NgClass, GhsLabelDirective, GhsRangePipe, GhsTooltipDirective, PointerInputDirective, TrackUUIDPipe],
  selector: 'ghs-party-campaign-scenarios',
  templateUrl: 'campaign-scenarios.html',
  styleUrls: ['../../../sheet.scss', './campaign-scenarios.scss']
})
export class PartyCampaignScenariosComponent extends PartySheetSection {
  readonly editionChange = output<string>();

  data: CampaignScenarioData = new CampaignScenarioData();
  maxScenario = maxScenario;

  get scenarioEditions(): string[] {
    return this.data.scenarioEditions;
  }

  get scenarios(): Record<string, ScenarioCache[]> {
    return this.data.scenarios;
  }

  override update(): void {
    this.party.casualScenarios = this.party.casualScenarios || [];
    this.party.scenarios = this.party.scenarios || [];
    this.data = campaignScenarioData(this.party, this.edition());
  }

  changeEdition(event: any) {
    this.editionChange.emit((event.target.value !== 'undefined' && event.target.value) || '');
  }

  countFinished(scenarioData: ScenarioData, casual: boolean = false): number {
    return (casual ? this.data.finishedCasualCountMap : this.data.finishedCountMap).get(scenarioKey(scenarioData)) ?? 0;
  }

  hasRandomItemLooted(scenarioData: ScenarioData): boolean {
    return this.data.randomItemLootedSet.has(scenarioKey(scenarioData));
  }

  isManual(scenarioData: ScenarioData): boolean {
    return this.data.manualSet.has(scenarioKey(scenarioData));
  }

  characterIcon(name: string): string {
    return gameManager.characterManager.characterIcon(name);
  }

  addSuccess(scenarioData: ScenarioData, force: boolean = false) {
    if ((!gameManager.scenarioManager.isBlocked(scenarioData) && !gameManager.scenarioManager.isLocked(scenarioData)) || force) {
      const conclusions = gameManager
        .sectionData(scenarioData.edition)
        .filter(
          (sectionData) =>
            sectionData.edition === scenarioData.edition &&
            sectionData.parent === scenarioData.index &&
            sectionData.group === scenarioData.group &&
            sectionData.conclusion &&
            gameManager.scenarioManager.getRequirements(sectionData).length === 0
        );
      if (conclusions.length === 0) {
        this.addSuccessIntern(scenarioData);
      } else {
        this.dialog
          .open(ScenarioConclusionComponent, {
            panelClass: ['dialog'],
            data: { conclusions: conclusions, parent: scenarioData }
          })
          .closed.subscribe({
            next: (conclusion) => {
              if (conclusion) {
                this.addSuccessIntern(scenarioData, conclusion as ScenarioData);
              }
            }
          });
      }
    }
  }
  addSuccessIntern(scenarioData: ScenarioData, conclusionSection: ScenarioData | undefined = undefined) {
    gameManager.stateManager.before('finishScenario.success', ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(scenarioData)));
    gameManager.scenarioManager.finishScenario(
      new Scenario(scenarioData),
      true,
      conclusionSection,
      false,
      false,
      false,
      gameManager.game.party.campaignMode && this.countFinished(scenarioData) === 0,
      true
    );
    gameManager.stateManager.after();

    this.update();
  }
  removeSuccess(scenarioData: ScenarioData, casual: boolean = false) {
    const scenarios = casual ? this.party.casualScenarios : this.party.scenarios;
    const value = scenarios.find(
      (value) => value.index === scenarioData.index && value.edition === scenarioData.edition && value.group === scenarioData.group
    );
    if (value) {
      gameManager.stateManager.before(
        'finishScenario.remove' + (casual ? 'Casual' : ''),
        ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(scenarioData))
      );
      scenarios.splice(scenarios.indexOf(value), 1);
      gameManager.stateManager.after();
    }
    this.update();
  }
  removeManual(scenarioData: ScenarioData) {
    const value = this.party.manualScenarios.find(
      (value) => value.index === scenarioData.index && value.edition === scenarioData.edition && value.group === scenarioData.group
    );
    if (value) {
      gameManager.stateManager.before('removeManualScenario', ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(scenarioData)));
      this.party.manualScenarios.splice(this.party.manualScenarios.indexOf(value), 1);
      gameManager.stateManager.after();
    }
    this.update();
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
  scenarioPopUp(scenarioData: ScenarioData) {
    this.dialog.open(ScenarioChartPopupDialog, {
      panelClass: ['dialog'],
      data: { scenarioData: scenarioData }
    });
  }
  scenarioRequirements(scenarioData: ScenarioData) {
    if (gameManager.scenarioManager.isLocked(scenarioData)) {
      this.dialog.open(ScenarioRequirementsDialogComponent, {
        panelClass: ['dialog'],
        data: { scenarioData: scenarioData, hideMenu: true }
      });
    }
  }
  unlockScenario(indexElement: HTMLInputElement, groupElement: HTMLInputElement, edition: string) {
    const index: string = indexElement.value;
    const group: string | undefined = groupElement.value || undefined;
    indexElement.classList.add('error');
    groupElement.classList.add('error');

    if (index.trim().length === 0) {
      return;
    }

    const failed = gameManager.scenarioManager.addManualScenarios(edition, group, [index]);

    if (failed.length === 0) {
      indexElement.classList.remove('error');
      indexElement.value = '';
      groupElement.classList.remove('error');
      groupElement.value = '';
      this.update();
    }
  }
  hasStatistics(scenarioData: ScenarioData | undefined = undefined): boolean {
    return gameManager.game.figures.some(
      (figure) =>
        figure instanceof Character &&
        figure.progress.scenarioStats.some(
          (value) =>
            !!scenarioData &&
            value.scenario &&
            value.scenario.index === scenarioData.index &&
            value.scenario.edition === scenarioData.edition &&
            value.scenario.group === scenarioData.group
        )
    );
  }
  statistics(scenarioData: ScenarioData | undefined = undefined) {
    this.dialog.open(StatisticsDialogComponent, {
      panelClass: ['dialog-invert'],
      data: { scenario: scenarioData }
    });
  }
}
