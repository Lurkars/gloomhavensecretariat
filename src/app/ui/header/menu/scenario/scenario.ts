import { Component, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameScenarioModel, ScenarioData } from "src/app/game/model/data/ScenarioData";
import { GameState } from "src/app/game/model/Game";
import { Scenario } from "src/app/game/model/Scenario";

@Component({
  selector: 'ghs-scenario-menu',
  templateUrl: 'scenario.html',
  styleUrls: [ '../menu.scss', 'scenario.scss' ]
})
export class ScenarioMenuComponent implements OnInit {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  edition: string = ""


  ngOnInit(): void {
    this.edition =
      // edition of current scenario
      gameManager.game.scenario && !gameManager.game.scenario.custom && gameManager.game.scenario.edition ||
      // edition of last scenario
      !gameManager.game.edition && (!gameManager.game.scenario || !gameManager.game.scenario.custom) && gameManager.game.party.scenarios.length > 0 && gameManager.game.party.scenarios[ gameManager.game.party.scenarios.length - 1 ].edition ||
      // set edition or first
      (gameManager.game.edition || gameManager.editions()[ 0 ]);
  }

  editions(): string[] {
    return gameManager.editionData.filter((editionData) => editionData.scenarios && editionData.scenarios.length > 0).map((editionData) => editionData.edition);
  }

  setEdition(edition: string) {
    this.edition = edition;
  }

  groups(): (string | undefined)[] {
    if (!this.edition) {
      return [];
    }

    return gameManager.scenarioData(true).filter((scenarioData) => scenarioData.edition == this.edition).map((scenarioData) => scenarioData.group).filter((value, index, self) => self.indexOf(value) === index);
  }

  scenarios(group: string | undefined = undefined): ScenarioData[] {
    if (!this.edition) {
      return [];
    }

    return gameManager.scenarioManager.scenarioData(this.edition).filter((scenarioData) => scenarioData.group == group).sort((a, b) => {
      if (!isNaN(+a.index) && !isNaN(+b.index)) {
        return +a.index - +b.index;
      }

      return a.index.toLowerCase() < b.index.toLowerCase() ? -1 : 1
    });
  }

  scenarioSuccess(scenario: ScenarioData) {
    return gameManager.game.party.scenarios && gameManager.game.party.scenarios.find((identifier) => scenario.index == identifier.index && scenario.edition == identifier.edition && scenario.group == identifier.group);
  }

  maxScenario() {
    return Math.max(...this.scenarios().map((scnearioData) => scnearioData.index.length));
  }

  hasScenario(scnearioData: ScenarioData): boolean {
    return gameManager.game.scenario != undefined && gameManager.game.scenario.edition == scnearioData.edition && gameManager.game.scenario.index == scnearioData.index && gameManager.game.scenario.group == scnearioData.group;
  }

  setScenario(scenarioData: ScenarioData) {
    gameManager.stateManager.before("setScenario", ...gameManager.scenarioManager.scenarioUndoArgs(scenarioData));
    gameManager.scenarioManager.setScenario(scenarioData as Scenario)
    gameManager.stateManager.after();
  }

  resetScenario() {
    if (gameManager.game.scenario) {
      gameManager.stateManager.before("resetScenario", ...gameManager.scenarioManager.scenarioUndoArgs());
      gameManager.scenarioManager.setScenario(gameManager.game.scenario)
      gameManager.stateManager.after();
    }
  }

  customScenario() {
    if (!gameManager.game.scenario || !gameManager.game.scenario.custom) {
      gameManager.stateManager.before("setCustomScenario");
      gameManager.scenarioManager.setScenario(new Scenario(new ScenarioData("", "", [], [], [], [], [], [], [], ""), true));
      gameManager.stateManager.after();
    } else {
      gameManager.stateManager.before("unsetCustomScenario");
      gameManager.game.scenario = undefined;
      this.edition = gameManager.game.edition || gameManager.editions()[ 0 ];
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
            gameManager.stateManager.before("addManualScenario", ...gameManager.scenarioManager.scenarioUndoArgs(scenarioData));
            gameManager.game.party.manualScenarios.push(new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group));
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

}