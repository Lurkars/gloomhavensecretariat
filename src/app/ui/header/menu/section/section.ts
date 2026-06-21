import { NgClass } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { GameState } from 'src/app/game/model/Game';
import { ScenarioCache } from 'src/app/game/model/Scenario';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsTooltipDirective, TabClickDirective, TrackUUIDPipe],
  selector: 'ghs-section-menu',
  templateUrl: 'section.html',
  styleUrls: ['../menu.scss', 'section.scss']
})
export class SectionMenuComponent implements OnInit {
  private ghsManager = inject(GhsManager);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  edition: string = '';
  editions: string[] = [];

  sectionCache: { edition: string; group: string | undefined; all: boolean; sections: ScenarioCache[] }[] = [];
  private maxSectionCache: number | undefined = undefined;

  constructor() {
    this.ghsManager.uiChangeEffect(() => {
      this.setEditions();
      this.sectionCache = [];
      this.maxSectionCache = undefined;
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
      gameManager.currentEdition();

    this.setEditions();
  }

  setEditions() {
    if (gameManager.game.edition) {
      this.editions = gameManager.relevantEditions(gameManager.game.edition, true);
    } else {
      this.editions = gameManager.editionData
        .filter(
          (editionData) =>
            editionData.sections &&
            editionData.sections.filter(
              (sectionData) =>
                sectionData.edition === editionData.edition && settingsManager.settings.editions.includes(sectionData.edition)
            ).length > 0
        )
        .map((editionData) => editionData.edition);
    }

    this.editions = this.editions.filter((edition) => gameManager.scenarioManager.scenarioData(edition).length > 0);
  }

  groups(): (string | undefined)[] {
    if (!this.edition) {
      return [];
    }

    return gameManager
      .sectionData()
      .filter((sectionData) => sectionData.edition === this.edition)
      .map((sectionData) => sectionData.group)
      .filter((value, index, self) => self.indexOf(value) === index);
  }

  sections(group: string | undefined = undefined): ScenarioCache[] {
    if (!this.edition) {
      return [];
    }
    let model = this.sectionCache.find(
      (model) => model.edition === this.edition && model.group === group && model.all === settingsManager.settings.showAllSections
    );

    if (model) {
      return model.sections;
    }

    model = { edition: this.edition, group: group, all: settingsManager.settings.showAllSections, sections: [] };
    const available = gameManager.game.scenario ? new Set(gameManager.scenarioManager.availableSections(false, true)) : null;
    const activeSectionKeys = new Set(gameManager.game.sections.map((s) => `${s.edition}:${s.group ?? ''}:${s.index}`));

    model.sections = gameManager
      .sectionData()
      .filter(
        (sectionData) =>
          (settingsManager.settings.showAllSections ||
            (!sectionData.parent && (!gameManager.game.scenario || gameManager.game.scenario.custom)) ||
            (gameManager.game.scenario && available !== null && available.has(sectionData))) &&
          sectionData.edition === this.edition &&
          sectionData.group === group &&
          !sectionData.conclusion
      )
      .sort(gameManager.scenarioManager.sortScenarios)
      .map(
        (sectionData) =>
          new ScenarioCache(
            sectionData,
            false,
            false,
            activeSectionKeys.has(`${sectionData.edition}:${sectionData.group ?? ''}:${sectionData.index}`)
          )
      );

    this.sectionCache.push(model);

    return model.sections;
  }

  noResults(): boolean {
    return this.sectionCache.filter((model) => model.edition === this.edition).every((model) => model.sections.length === 0);
  }

  maxSection() {
    if (this.maxSectionCache === undefined) {
      this.maxSectionCache = Math.max(...this.sections().map((sectionData) => sectionData.index.length));
    }
    return this.maxSectionCache;
  }

  hasSection(sectionData: ScenarioData): boolean {
    return (
      gameManager.game.sections &&
      gameManager.game.sections.some(
        (value) => value.edition === sectionData.edition && value.index === sectionData.index && value.group === sectionData.group
      )
    );
  }

  addSection(sectionData: ScenarioData) {
    gameManager.stateManager.before(
      'addSection',
      sectionData.index,
      gameManager.scenarioManager.scenarioTitle(sectionData, true),
      'data.edition.' + sectionData.edition
    );
    gameManager.scenarioManager.addSection(sectionData);
    gameManager.stateManager.after();
  }
}
