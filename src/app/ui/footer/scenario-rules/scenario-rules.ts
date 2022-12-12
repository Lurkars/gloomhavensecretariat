import { Component } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";

@Component({
    selector: 'ghs-scenario-rules',
    templateUrl: './scenario-rules.html',
    styleUrls: ['./scenario-rules.scss']
})
export class ScenarioRulesComponent {

    gameManager: GameManager = gameManager;

    close(element: HTMLElement, index: number) {
        element.classList.add('closed');
        setTimeout(() => {
            gameManager.stateManager.before("removeScenarioRule");
            gameManager.game.scenarioRules.splice(index, 1);
            gameManager.stateManager.after();
        }, settingsManager.settings.disableAnimations ? 0 : 100)
    }
}
