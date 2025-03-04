import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { GameState } from "src/app/game/model/Game";
import { ScenarioCache } from "src/app/game/model/Scenario";

@Component({
  standalone: false,
  selector: 'ghs-section-menu',
  templateUrl: 'section.html',
  styleUrls: ['../menu.scss', 'section.scss']
})
export class SectionMenuComponent implements OnInit, OnDestroy {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  edition: string = "";
  editions: string[] = [];

  sectionCache: { edition: string, group: string | undefined, all: boolean, sections: ScenarioCache[] }[] = [];


  ngOnInit(): void {
    this.edition =
      // edition of current scenario
      gameManager.game.scenario && !gameManager.game.scenario.custom && gameManager.game.scenario.edition ||
      // edition of last scenario
      !gameManager.game.edition && (!gameManager.game.scenario || !gameManager.game.scenario.custom) && gameManager.game.party.scenarios.length > 0 && gameManager.game.party.scenarios[gameManager.game.party.scenarios.length - 1].edition ||
      // set edition or first
      gameManager.currentEdition();

    this.setEditions();

    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        this.setEditions();
        this.sectionCache = [];
      }
    })
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  setEditions() {
    if (gameManager.game.edition) {
      this.editions = [gameManager.game.edition, ...gameManager.editionExtensions(gameManager.game.edition), ...gameManager.editionScenarioExtensions(gameManager.game.edition)];
    } else {
      this.editions = gameManager.editionData.filter((editionData) => editionData.sections && editionData.sections.filter((sectionData) => sectionData.edition == editionData.edition && settingsManager.settings.editions.indexOf(sectionData.edition) != -1).length > 0).map((editionData) => editionData.edition);
    }
  }

  groups(): (string | undefined)[] {
    if (!this.edition) {
      return [];
    }

    return gameManager.sectionData().filter((sectionData) => sectionData.edition == this.edition).map((sectionData) => sectionData.group).filter((value, index, self) => self.indexOf(value) === index);
  }

  sections(group: string | undefined = undefined): ScenarioCache[] {
    if (!this.edition) {
      return [];
    }
    let model = this.sectionCache.find((model) => model.edition == this.edition && model.group == group && model.all == settingsManager.settings.showAllSections);

    if (model) {
      return model.sections;
    }

    model = { edition: this.edition, group: group, all: settingsManager.settings.showAllSections, sections: [] };


    model.sections = gameManager.sectionData().filter((sectionData) => (settingsManager.settings.showAllSections || !sectionData.parent && (!gameManager.game.scenario || gameManager.game.scenario.custom) || gameManager.game.scenario && gameManager.scenarioManager.availableSections(false, true).indexOf(sectionData) != -1) && sectionData.edition == this.edition && sectionData.group == group && !sectionData.conclusion).sort(gameManager.scenarioManager.sortScenarios).map((sectionData) => new ScenarioCache(sectionData, false, false, this.hasSection(sectionData)))

    this.sectionCache.push(model);

    return model.sections;
  }

  noResults(): boolean {
    return this.sectionCache.filter((model) => model.edition == this.edition).every((model) => model.sections.length == 0);
  }

  maxSection() {
    return Math.max(...this.sections().map((sectionData) => sectionData.index.length));
  }

  hasSection(sectionData: ScenarioData): boolean {
    return gameManager.game.sections && gameManager.game.sections.some((value) => value.edition == sectionData.edition && value.index == sectionData.index && value.group == sectionData.group);
  }

  addSection(sectionData: ScenarioData) {
    gameManager.stateManager.before("addSection", sectionData.index, gameManager.scenarioManager.scenarioTitle(sectionData, true), "data.edition." + sectionData.edition);
    gameManager.scenarioManager.addSection(sectionData);
    gameManager.stateManager.after();
  }

}