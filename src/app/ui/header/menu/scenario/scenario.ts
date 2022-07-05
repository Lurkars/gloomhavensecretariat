import { Component } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { GameState } from "src/app/game/model/Game";
import { Scenario } from "src/app/game/model/Scenario";

@Component({
  selector: 'ghs-scenario-menu',
  templateUrl: 'scenario.html',
  styleUrls: [ 'scenario.scss', '../menu.scss' ]
})
export class ScenarioMenuComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  edition: string | undefined = (!gameManager.game.scenario || !gameManager.game.scenario.custom) && (gameManager.game.edition || gameManager.editions()[ 0 ]) || undefined;

  setEdition(edition: string) {
    this.edition = edition;
  }

  groups(): (string | undefined)[] {
    if (!this.edition) {
      return [];
    }

    return gameManager.scenarioData(true).filter((scenarioData: ScenarioData) => scenarioData.edition == this.edition).map((scenarioData: ScenarioData) => scenarioData.group).filter((value: string | undefined, index: number, self: (string | undefined)[]) => self.indexOf(value) === index);
  }

  scenarios(group: string | undefined = undefined): ScenarioData[] {
    if (!this.edition) {
      return [];
    }

    return gameManager.scenarioData(true).filter((scenarioData: ScenarioData) => scenarioData.edition == this.edition && scenarioData.group == group).sort((a, b) => {
      if (!isNaN(+a.index) && !isNaN(+b.index)) {
        return +a.index - +b.index;
      }

      return a.index.toLowerCase() < b.index.toLowerCase() ? -1 : 1
    });
  }

  maxScenario() {
    return Math.max(...this.scenarios().map((scnearioData: ScenarioData) => scnearioData.index.length));
  }

  hasScenario(scnearioData: ScenarioData): boolean {
    return gameManager.game.scenario != undefined && gameManager.game.scenario.edition == scnearioData.edition && gameManager.game.scenario.index == scnearioData.index && gameManager.game.scenario.group == scnearioData.group;

  }

  setScenario(index: string) {
    const scenarioData: ScenarioData | undefined = gameManager.scenarioData().find((scenario: ScenarioData) => scenario.edition == this.edition && scenario.index == index);
    gameManager.stateManager.before();
    gameManager.setScenario(scenarioData as Scenario)
    gameManager.stateManager.after();
  }

  customScenario() {
    if (!gameManager.game.scenario || !gameManager.game.scenario.custom) {
      this.edition = undefined;
      gameManager.stateManager.before();
      gameManager.setScenario(new Scenario("", "0", [], [], "", true));
      gameManager.stateManager.after();
    }
  }

  customScenarioName(event: any) {
    if (gameManager.game.scenario && gameManager.game.scenario.custom) {
      gameManager.stateManager.before();
      gameManager.game.scenario.name = event.target.value;
      gameManager.stateManager.after();
    }
  }

}