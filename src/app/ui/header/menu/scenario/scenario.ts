import { Component } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { GameState } from "src/app/game/model/Game";
import { Scenario } from "src/app/game/model/Scenario";
import { ghsIsSpoiled } from "src/app/ui/helper/Static";

@Component({
  selector: 'ghs-scenario-menu',
  templateUrl: 'scenario.html',
  styleUrls: [ 'scenario.scss', '../menu.scss' ]
})
export class ScenarioMenuComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  edition: string | undefined = (!gameManager.game.scenario || !gameManager.game.scenario.custom) && (gameManager.game.edition || gameManager.editions[ 0 ]) || undefined;

  setEdition(edition: string) {
    this.edition = edition;
    gameManager.stateManager.before();
    gameManager.setScenario(undefined);
    gameManager.stateManager.after();
  }

  scenarios(): number[] {
    if (!this.edition) {
      return [];
    }
    return gameManager.scenarioData.filter((scenarioData: ScenarioData) => scenarioData.edition == this.edition).map((scenarioData: ScenarioData) => scenarioData.index).sort((a, b) => a - b);
  }

  maxScenario() {
    return Math.max(...this.scenarios());
  }

  setScenario(index: number) {
    const scenarioData: ScenarioData | undefined = gameManager.scenarioData.find((scenario: ScenarioData) => scenario.edition == this.edition && scenario.index == index);
    gameManager.stateManager.before();
    gameManager.setScenario(scenarioData as Scenario)
    gameManager.stateManager.after();
  }

  customScenario() {
    this.edition = undefined;
    gameManager.stateManager.before();
    if (gameManager.game.scenario && gameManager.game.scenario.custom) {
      gameManager.setScenario(undefined);
    } else {
      gameManager.setScenario(new Scenario("", 0, [], "", false, true));
    }

    gameManager.stateManager.after();
  }

  customScenarioName(event: any) {
    if (gameManager.game.scenario && gameManager.game.scenario.custom) {
      gameManager.stateManager.before();
      gameManager.game.scenario.name = event.target.value;
      gameManager.stateManager.after();
    }
  }

}