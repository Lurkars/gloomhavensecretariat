import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, OnInit, inject, output } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Spoilable, SpoilableMock } from 'src/app/game/model/data/Spoilable';
import { GameState } from 'src/app/game/model/Game';
import { Scenario, ScenarioCache } from 'src/app/game/model/Scenario';
import { ScenarioRequirementsDialogComponent } from 'src/app/ui/figures/party/requirements/requirements';
import { ScenarioChartDialogComponent } from 'src/app/ui/figures/party/scenario-chart/scenario-chart';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe, GhsScenarioSearch } from 'src/app/ui/helper/Pipes';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsRangePipe, GhsScenarioSearch, GhsLabelDirective, GhsTooltipDirective, TabClickDirective, TrackUUIDPipe],
  selector: 'ghs-scenario-menu',
  templateUrl: 'scenario.html',
  styleUrls: ['../menu.scss', 'scenario.scss']
})
export class ScenarioMenuComponent implements OnInit {
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  readonly closed = output();

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  edition: string = '';
  editions: string[] = [];
  groups: (string | undefined)[] = [];
  hasRandom: boolean = false;

  scenarioCache: {
    edition: string;
    group: string | undefined;
    filterSuccess: boolean;
    includeSpoiler: boolean;
    all: boolean;
    scenarios: ScenarioCache[];
  }[] = [];
  private maxScenarioCache: Map<string | undefined, number> = new Map();

  private clearCache() {
    this.scenarioCache = [];
    this.maxScenarioCache.clear();
  }

  constructor() {
    this.ghsManager.uiChangeEffect(() => {
      this.clearCache();
      this.setEditions();
    });
  }

  ngOnInit(): void {
    this.edition =
      // edition of current scenario
      (gameManager.game.scenario && !gameManager.game.scenario.custom && gameManager.game.scenario.edition) ||
      // edition of last scenario
      (!gameManager.game.edition &&
        (!gameManager.game.scenario || !gameManager.game.scenario.custom) &&
        gameManager.game.party.scenarios.length > 0 &&
        gameManager.game.party.scenarios[gameManager.game.party.scenarios.length - 1].edition) ||
      // set edition or first
      gameManager.editionManager.currentEdition();

    this.updateGroups();
    this.setEditions();
  }

  setEditions() {
    if (gameManager.game.edition) {
      this.editions = gameManager.editionManager.relevantEditions(gameManager.game.edition, true);
    } else {
      this.editions = gameManager.editionManager.editionData.map((editionData) => editionData.edition);
    }

    this.editions = this.editions.filter((edition) => gameManager.scenarioManager.scenarioData(edition).length > 0);

    this.hasRandom =
      (this.edition &&
        gameManager.editionManager.sectionData(this.edition).find((sectionData) => sectionData.group === 'randomMonsterCard') !==
          undefined) ||
      false;
  }

  setEdition(edition: string) {
    this.edition = edition;
    this.maxScenarioCache.clear();
    this.updateGroups();
    this.setEditions();
  }

  updateGroups() {
    if (!this.edition) {
      this.groups = [];
    }

    const groups = gameManager.scenarioManager
      .scenarioData(this.edition, true)
      .map((scenarioData) => scenarioData.group)
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort((a, b) => (a && b && (a.toLowerCase() < b.toLowerCase() ? -1 : 1)) || 0);
    this.groups = [undefined, ...groups];
  }

  scenarios(
    group: string | undefined = undefined,
    filterSuccess: boolean = false,
    includeSpoiler: boolean = false,
    all: boolean = false
  ): ScenarioCache[] {
    if (!this.edition) {
      return [];
    }

    let model = this.scenarioCache.find(
      (model) =>
        model.edition === this.edition &&
        model.group === group &&
        model.filterSuccess === filterSuccess &&
        model.includeSpoiler === includeSpoiler &&
        model.all === all
    );

    if (model) {
      return model.scenarios;
    }

    model = { edition: this.edition, group: group, filterSuccess: filterSuccess, includeSpoiler: includeSpoiler, all: all, scenarios: [] };

    const allScenariosForEdition = gameManager.scenarioManager.scenarioData(this.edition, all);

    const successSet = new Set(
      gameManager.game.party.scenarios.filter((m) => m.edition === this.edition).map((m) => `${m.group ?? ''}:${m.index}`)
    );

    const scenarioMap = new Map<string, ScenarioData>();
    allScenariosForEdition.forEach((s) => scenarioMap.set(`${s.group ?? ''}:${s.index}`, s));
    const blockedIndices = new Set<string>();
    gameManager.game.party.scenarios
      .filter((m) => m.edition === this.edition && successSet.has(`${m.group ?? ''}:${m.index}`))
      .forEach((m) => {
        const s = scenarioMap.get(`${m.group ?? ''}:${m.index}`);
        if (s?.blocks) {
          s.blocks.forEach((b) => blockedIndices.add(`${m.group ?? ''}:${b}`));
        }
      });
    gameManager.game.party.conclusions
      .filter((m) => m.edition === this.edition)
      .forEach((m) => {
        const section = gameManager.scenarioManager.getSection(m.index, m.edition, m.group, true);
        if (section?.blocks) {
          section.blocks.forEach((b) => blockedIndices.add(`${m.group ?? ''}:${b}`));
        }
      });

    model.scenarios = allScenariosForEdition
      .filter(
        (scenarioData) =>
          scenarioData.group === group &&
          (includeSpoiler ||
            !scenarioData.spoiler ||
            gameManager.game.unlockedCharacters.includes(scenarioData.edition + ':' + scenarioData.name) ||
            (scenarioData.solo && gameManager.game.unlockedCharacters.includes(scenarioData.edition + ':' + scenarioData.solo))) &&
          (!filterSuccess ||
            (!successSet.has(`${scenarioData.group ?? ''}:${scenarioData.index}`) &&
              !blockedIndices.has(`${scenarioData.group ?? ''}:${scenarioData.index}`)))
      )
      .sort(gameManager.scenarioManager.sortScenarios)
      .map(
        (scenarioData) =>
          new ScenarioCache(
            scenarioData,
            successSet.has(`${scenarioData.group ?? ''}:${scenarioData.index}`),
            blockedIndices.has(`${scenarioData.group ?? ''}:${scenarioData.index}`),
            gameManager.scenarioRequirementsManager.isLocked(scenarioData)
          )
      );

    this.scenarioCache.push(model);

    return model.scenarios;
  }

  maxScenario(group: string | undefined) {
    if (!this.maxScenarioCache.has(group)) {
      this.maxScenarioCache.set(group, Math.max(0, ...this.scenarios(group).map((s) => s.index.length)));
    }
    return this.maxScenarioCache.get(group)!;
  }

  setScenario(scenarioData: ScenarioData) {
    if (!gameManager.scenarioRequirementsManager.isCurrent(scenarioData)) {
      if (gameManager.scenarioRequirementsManager.isLocked(scenarioData)) {
        this.dialog.open(ScenarioRequirementsDialogComponent, {
          panelClass: ['dialog'],
          data: { scenarioData: scenarioData }
        });
      } else {
        gameManager.stateManager.before('setScenario', ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(scenarioData)));
        gameManager.scenarioManager.selectScenario(scenarioData);
        gameManager.stateManager.after();
      }
      this.closed.emit();
    }
  }

  resetScenario() {
    if (gameManager.game.scenario) {
      gameManager.stateManager.before('resetScenario', ...gameManager.scenarioManager.scenarioUndoArgs());
      gameManager.scenarioManager.resetScenario();
      this.closed.emit();
      gameManager.stateManager.after();
    }
  }

  customScenario() {
    const custom = !gameManager.game.scenario || !gameManager.game.scenario.custom;
    if (gameManager.scenarioManager.canSetCustomScenario(custom)) {
      gameManager.stateManager.before(custom ? 'setCustomScenario' : 'unsetCustomScenario');
      gameManager.scenarioManager.setCustomScenario(custom);
      if (!custom) {
        this.edition = gameManager.game.edition || gameManager.editionManager.editions()[0];
      }
      gameManager.stateManager.after();
    }
  }

  customScenarioName(event: any) {
    if (gameManager.scenarioManager.canSetCustomScenarioName(event.target.value)) {
      gameManager.stateManager.before('changeCustomScenario', event.target.value);
      gameManager.scenarioManager.setCustomScenarioName(event.target.value);
      gameManager.stateManager.after();
    }
  }

  randomScenario() {
    if (gameManager.scenarioManager.randomScenarioSections(this.edition).length < 3) {
      return;
    }
    gameManager.stateManager.before('setRandomScenario');
    gameManager.scenarioManager.setRandomScenario(this.edition);
    gameManager.stateManager.after();
  }

  manualScenario(input: HTMLInputElement, group: string | undefined) {
    input.classList.add('error');
    const failed = gameManager.scenarioManager.addManualScenarios(this.edition, group, input.value.split(','));

    if (failed.length === 0) {
      input.classList.remove('error');
      input.value = '';
    } else {
      input.value = failed.join(',');
    }

    this.clearCache();
  }

  hasSpoilers(group: string | undefined): boolean {
    return this.scenarios(group, true).some(
      (scenarioData) =>
        scenarioData.spoiler &&
        ((!scenarioData.solo && !gameManager.game.unlockedCharacters.includes(scenarioData.edition + ':' + scenarioData.name)) ||
          (scenarioData.solo && !gameManager.game.unlockedCharacters.includes(scenarioData.edition + ':' + scenarioData.solo)))
    );
  }

  notSpoiled(group: string | undefined): Spoilable[] {
    return this.scenarios(group, true)
      .filter(
        (scenarioData) =>
          scenarioData.spoiler &&
          (!gameManager.game.unlockedCharacters.includes(scenarioData.edition + ':' + scenarioData.name) ||
            (scenarioData.solo && !gameManager.game.unlockedCharacters.includes(scenarioData.edition + ':' + scenarioData.solo)))
      )
      .map((scenarioData) => (scenarioData.solo && new SpoilableMock(scenarioData.solo)) || new SpoilableMock(scenarioData.name));
  }

  toggleCampaignMode() {
    gameManager.stateManager.before(gameManager.game.party.campaignMode ? 'disablePartyCampaignMode' : 'enablePartyCampaignMode');
    gameManager.campaignManager.setCampaignMode(!gameManager.game.party.campaignMode);
    this.clearCache();
    gameManager.stateManager.after();
  }

  scenarioChart() {
    this.dialog.open(ScenarioChartDialogComponent, {
      panelClass: ['fullscreen-panel', 'no-dialog-animations'],
      backdropClass: ['fullscreen-backdrop'],
      data: {
        edition: this.edition
      }
    });
    this.closed.emit();
  }
}
