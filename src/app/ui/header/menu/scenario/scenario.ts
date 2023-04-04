import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { GameState } from "src/app/game/model/Game";
import { GameScenarioModel, Scenario } from "src/app/game/model/Scenario";
import { Spoilable, SpoilableMock } from "src/app/game/model/data/Spoilable";

@Component({
  selector: 'ghs-scenario-menu',
  templateUrl: 'scenario.html',
  styleUrls: ['../menu.scss', 'scenario.scss']
})
export class ScenarioMenuComponent implements OnInit {

  @Output() close = new EventEmitter();

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  edition: string = "";
  filterSuccess: boolean = false;


  ngOnInit(): void {
    this.edition =
      // edition of current scenario
      gameManager.game.scenario && !gameManager.game.scenario.custom && gameManager.game.scenario.edition ||
      // edition of last scenario
      !gameManager.game.edition && (!gameManager.game.scenario || !gameManager.game.scenario.custom) && gameManager.game.party.scenarios.length > 0 && gameManager.game.party.scenarios[gameManager.game.party.scenarios.length - 1].edition ||
      // set edition or first
      gameManager.currentEdition();;
  }

  editions(): string[] {
    return gameManager.editionData.filter((editionData) => editionData.scenarios && editionData.scenarios.filter((scenarioData) => scenarioData.edition == editionData.edition && settingsManager.settings.editions.indexOf(scenarioData.edition) != -1).length > 0).map((editionData) => editionData.edition);
  }

  setEdition(edition: string) {
    this.edition = edition;
  }

  groups(): (string | undefined)[] {
    if (!this.edition) {
      return [];
    }

    let groups = gameManager.scenarioManager.scenarioData(this.edition).map((scenarioData) => scenarioData.group).filter((value, index, self) => value && self.indexOf(value) === index).sort((a, b) => a && b && (a.toLowerCase() < b.toLowerCase() ? -1 : 1) || 0);
    groups = [undefined, ...groups];
    return groups;
  }

  scenarios(group: string | undefined = undefined, includeSpoiler: boolean = false, all: boolean = false): ScenarioData[] {
    if (!this.edition) {
      return [];
    }

    return gameManager.scenarioManager.scenarioData(this.edition, all).filter((scenarioData) => scenarioData.group == group && (includeSpoiler || (!scenarioData.spoiler || settingsManager.settings.spoilers.indexOf(scenarioData.name) != -1 || scenarioData.solo && settingsManager.settings.spoilers.indexOf(scenarioData.solo) != -1)) && (!this.filterSuccess || !this.scenarioSuccess(scenarioData) && !gameManager.scenarioManager.isBlocked(scenarioData))).sort(gameManager.scenarioManager.sortScenarios);
  }

  scenarioSuccess(scenario: ScenarioData) {
    return gameManager.game.party.scenarios && gameManager.game.party.scenarios.find((identifier) => scenario.index == identifier.index && scenario.edition == identifier.edition && scenario.group == identifier.group);
  }

  maxScenario(group: string | undefined) {
    return Math.max(...this.scenarios(group).map((scenarioData) => scenarioData.index.length));
  }

  hasScenario(scenarioData: ScenarioData): boolean {
    return gameManager.game.scenario != undefined && gameManager.game.scenario.edition == scenarioData.edition && gameManager.game.scenario.index == scenarioData.index && gameManager.game.scenario.group == scenarioData.group && gameManager.game.scenario.solo == scenarioData.solo;
  }

  setScenario(scenarioData: ScenarioData) {
    if (!this.hasScenario(scenarioData)) {
      gameManager.stateManager.before("setScenario", ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(scenarioData)));
      gameManager.scenarioManager.setScenario(scenarioData as Scenario);
      this.close.emit();
      gameManager.stateManager.after();
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

  manualScenario(input: HTMLInputElement, group: string | undefined) {
    const editionData = gameManager.editionData.find((editionData) => editionData.edition == this.edition);
    input.classList.add('error');
    if (editionData) {
      let numbers: string[] = input.value.split(',');
      numbers.forEach((number) => number.trim());
      input.value.split(',').forEach((number) => {
        const scenarioData = editionData.scenarios.find((scenarioData) => scenarioData.index == number.trim() && scenarioData.group == group);
        if (scenarioData) {
          if (this.scenarios(group).indexOf(scenarioData) == -1) {
            gameManager.stateManager.before("addManualScenario", ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(scenarioData)));
            gameManager.game.party.manualScenarios.push(new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group, false, "", []));
            gameManager.stateManager.after();
          }
          numbers = numbers.filter((value) => value.trim() != number);
        }
      })

      if (numbers.length == 0) {
        input.classList.remove('error');
        input.value = "";
      } else {
        input.value = numbers.join(',');
      }

    }
  }

  hasSpoilers(group: string | undefined): boolean {
    return this.scenarios(group, true).some((scenarioData) => scenarioData.spoiler && (!scenarioData.solo && settingsManager.settings.spoilers.indexOf(scenarioData.name) == -1 || scenarioData.solo && settingsManager.settings.spoilers.indexOf(scenarioData.solo) == -1))
  }

  notSpoiled(group: string | undefined): Spoilable[] {
    return this.scenarios(group, true).filter((scenarioData) => scenarioData.spoiler && (settingsManager.settings.spoilers.indexOf(scenarioData.name) == -1 || scenarioData.solo && settingsManager.settings.spoilers.indexOf(scenarioData.solo) == -1)).map((scenarioData) => scenarioData.solo && new SpoilableMock(scenarioData.solo) || new SpoilableMock(scenarioData.name));
  }

}
