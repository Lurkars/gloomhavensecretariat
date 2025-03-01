import { Dialog } from "@angular/cdk/dialog";
import { Component, EventEmitter, OnDestroy, OnInit, Output } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";
import { GameScenarioModel, Scenario, ScenarioCache } from "src/app/game/model/Scenario";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { Spoilable, SpoilableMock } from "src/app/game/model/data/Spoilable";
import { ScenarioRequirementsDialogComponent } from "src/app/ui/figures/party/requirements/requirements";
import { ghsShuffleArray } from "src/app/ui/helper/Static";
import { ScenarioChartDialogComponent } from "../../../figures/party/scenario-chart/scenario-chart";

@Component({
  standalone: false,
  selector: 'ghs-scenario-menu',
  templateUrl: 'scenario.html',
  styleUrls: ['../menu.scss', 'scenario.scss']
})
export class ScenarioMenuComponent implements OnInit, OnDestroy {

  @Output() close = new EventEmitter();

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  edition: string = "";
  editions: string[] = [];
  groups: (string | undefined)[] = [];
  hasRandom: boolean = false;

  constructor(private dialog: Dialog) { }

  scenarioCache: { edition: string, group: string | undefined, filterSuccess: boolean, includeSpoiler: boolean, all: boolean, scenarios: ScenarioCache[] }[] = [];

  ngOnInit(): void {
    this.edition =
      // edition of current scenario
      gameManager.game.scenario && !gameManager.game.scenario.custom && gameManager.game.scenario.edition ||
      // edition of last scenario
      !gameManager.game.edition && (!gameManager.game.scenario || !gameManager.game.scenario.custom) && gameManager.game.party.scenarios.length > 0 && gameManager.game.party.scenarios[gameManager.game.party.scenarios.length - 1].edition ||
      // set edition or first
      gameManager.currentEdition();

    this.updateGroups();
    this.setEditions();

    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        this.scenarioCache = [];
        this.setEditions();
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
      this.editions = gameManager.editionData.filter((editionData) => editionData.scenarios && editionData.scenarios.filter((scenarioData) => scenarioData.edition == editionData.edition && settingsManager.settings.editions.indexOf(scenarioData.edition) != -1).length > 0).map((editionData) => editionData.edition);
    }
    this.hasRandom = this.edition && gameManager.sectionData(this.edition).find((sectionData) => sectionData.group == 'randomMonsterCard') != undefined || false;
  }

  setEdition(edition: string) {
    this.edition = edition;
    this.updateGroups();
    this.setEditions();
  }

  updateGroups() {
    if (!this.edition) {
      this.groups = [];
    }

    const groups = gameManager.scenarioManager.scenarioData(this.edition, true).map((scenarioData) => scenarioData.group).filter((value, index, self) => value && self.indexOf(value) === index).sort((a, b) => a && b && (a.toLowerCase() < b.toLowerCase() ? -1 : 1) || 0);
    this.groups = [undefined, ...groups];
  }

  scenarios(group: string | undefined = undefined, filterSuccess: boolean = false, includeSpoiler: boolean = false, all: boolean = false): ScenarioCache[] {
    if (!this.edition) {
      return [];
    }

    let model = this.scenarioCache.find((model) => model.edition == this.edition && model.group == group && model.filterSuccess == filterSuccess && model.includeSpoiler == includeSpoiler && model.all == all);

    if (model) {
      return model.scenarios;
    }

    model = { edition: this.edition, group: group, filterSuccess: filterSuccess, includeSpoiler: includeSpoiler, all: all, scenarios: [] };

    model.scenarios = gameManager.scenarioManager.scenarioData(this.edition, all).filter((scenarioData) => scenarioData.group == group && (includeSpoiler || (!scenarioData.spoiler || gameManager.game.unlockedCharacters.indexOf(scenarioData.name) != -1 || scenarioData.solo && gameManager.game.unlockedCharacters.indexOf(scenarioData.solo) != -1)) && (!filterSuccess || !gameManager.scenarioManager.isSuccess(scenarioData) && !gameManager.scenarioManager.isBlocked(scenarioData))).sort(gameManager.scenarioManager.sortScenarios).map((scenarioData) => new ScenarioCache(scenarioData, gameManager.scenarioManager.isSuccess(scenarioData), gameManager.scenarioManager.isBlocked(scenarioData), gameManager.scenarioManager.isLocked(scenarioData)));

    this.scenarioCache.push(model);

    return model.scenarios;
  }

  maxScenario(group: string | undefined) {
    return Math.max(...this.scenarios(group).map((scenarioData) => scenarioData.index.length));
  }

  setScenario(scenarioData: ScenarioData) {
    if (!gameManager.scenarioManager.isCurrent(scenarioData)) {
      if (gameManager.scenarioManager.isLocked(scenarioData)) {
        this.dialog.open(ScenarioRequirementsDialogComponent, {
          panelClass: ['dialog'],
          data: { scenarioData: scenarioData }
        })
      } else {
        gameManager.stateManager.before("setScenario", ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(scenarioData)));
        gameManager.scenarioManager.setScenario(scenarioData as Scenario);
        gameManager.stateManager.after();
      }
      this.close.emit();
    }
  }

  resetScenario() {
    if (gameManager.game.scenario) {
      gameManager.stateManager.before("resetScenario", ...gameManager.scenarioManager.scenarioUndoArgs());
      gameManager.roundManager.resetScenario();
      gameManager.scenarioManager.setScenario(gameManager.game.scenario);
      this.close.emit();
      gameManager.stateManager.after();
    }
  }

  customScenario() {
    if (!gameManager.game.scenario || !gameManager.game.scenario.custom) {
      gameManager.stateManager.before("setCustomScenario");
      gameManager.scenarioManager.setScenario(gameManager.scenarioManager.createScenario());
      gameManager.stateManager.after();
    } else {
      gameManager.stateManager.before("unsetCustomScenario");
      gameManager.scenarioManager.setScenario(undefined);
      this.edition = gameManager.game.edition || gameManager.editions()[0];
      gameManager.stateManager.after();
    }
  }

  customScenarioName(event: any) {
    if (gameManager.game.scenario && gameManager.game.scenario.custom) {
      gameManager.stateManager.before("changeCustomScenario", event.target.value);
      gameManager.game.scenario.name = event.target.value;
      gameManager.stateManager.after();
    }
  }

  randomScenario() {
    const shuffledSections = ghsShuffleArray(gameManager.sectionData(this.edition).filter((sectionData) => sectionData.group == 'randomMonsterCard'));

    if (shuffledSections.length < 3) {
      return;
    }

    gameManager.stateManager.before("setRandomScenario");
    const scenario = gameManager.scenarioManager.createScenario();
    scenario.name = "%scenario.random%";
    scenario.additionalSections = shuffledSections.slice(0, 3).map((sectionData) => sectionData.index);
    gameManager.scenarioManager.setScenario(undefined);
    gameManager.scenarioManager.setScenario(scenario);
    gameManager.scenarioManager.addSection(shuffledSections[0]);
    gameManager.stateManager.after();
  }

  manualScenario(input: HTMLInputElement, group: string | undefined) {
    input.classList.add('error');
    const scenarios: ScenarioData[] = gameManager.scenarioData(this.edition).filter((scenarioData) => scenarioData.group == group);
    let numbers: string[] = input.value.split(',');
    numbers.forEach((number) => number.trim());
    input.value.split(',').forEach((number) => {
      const scenarioData = scenarios.find((scenarioData) => scenarioData.index == number.trim() && scenarioData.group == group);
      if (scenarioData) {
        if (!this.scenarios(group).find((scenarioCache) => scenarioCache.edition == scenarioData.edition && scenarioCache.group == scenarioData.group && scenarioCache.index == scenarioData.index)) {
          gameManager.stateManager.before("addManualScenario", ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(scenarioData)));
          gameManager.game.party.manualScenarios.push(new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group));
          gameManager.stateManager.after();
        }
        numbers = numbers.filter((value) => value.trim() != number);
      } else if (scenarios.find((scenarioData) => scenarioData.index.substring(0, scenarioData.index.length - 1) == number.trim() && scenarioData.index.substring(scenarioData.index.length - 1).match(/[A-B]/) && scenarioData.group == group)) {
        scenarios.filter((scenarioData) => scenarioData.index.substring(0, scenarioData.index.length - 1) == number.trim() && scenarioData.index.substring(scenarioData.index.length - 1).match(/[A-B]/) && scenarioData.group == group).forEach((scenarioData) => {
          if (!this.scenarios(group).find((scenarioCache) => scenarioCache.edition == scenarioData.edition && scenarioCache.group == scenarioData.group && scenarioCache.index == scenarioData.index)) {
            gameManager.stateManager.before("addManualScenario", ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(scenarioData)));
            gameManager.game.party.manualScenarios.push(new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group));
            gameManager.stateManager.after();
          }
        })
        numbers = numbers.filter((value) => value.trim() != number);

      }
    })

    if (numbers.length == 0) {
      input.classList.remove('error');
      input.value = "";
    } else {
      input.value = numbers.join(',');
    }

    this.scenarioCache = [];
  }

  hasSpoilers(group: string | undefined): boolean {
    return this.scenarios(group, true).some((scenarioData) => scenarioData.spoiler && (!scenarioData.solo && gameManager.game.unlockedCharacters.indexOf(scenarioData.name) == -1 || scenarioData.solo && gameManager.game.unlockedCharacters.indexOf(scenarioData.solo) == -1))
  }

  notSpoiled(group: string | undefined): Spoilable[] {
    return this.scenarios(group, true).filter((scenarioData) => scenarioData.spoiler && (gameManager.game.unlockedCharacters.indexOf(scenarioData.name) == -1 || scenarioData.solo && gameManager.game.unlockedCharacters.indexOf(scenarioData.solo) == -1)).map((scenarioData) => scenarioData.solo && new SpoilableMock(scenarioData.solo) || new SpoilableMock(scenarioData.name));
  }

  toggleCampaignMode() {
    gameManager.stateManager.before(gameManager.game.party.campaignMode ? "disablePartyCampaignMode" : "enablePartyCampaignMode");
    gameManager.game.party.campaignMode = !gameManager.game.party.campaignMode;
    this.scenarioCache = [];
    gameManager.stateManager.after();
  }

  scenarioChart(group: string | undefined = undefined) {
    this.dialog.open(ScenarioChartDialogComponent, {
      panelClass: ['fullscreen-panel'],
      backdropClass: ['fullscreen-backdrop'],
      data: {
        edition: this.edition,
        group: group
      }
    })
    this.close.emit();
  }
}
