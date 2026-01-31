import { Injectable } from "@angular/core";
import { gameManager, GameManager } from "./GameManager";
import { settingsManager, SettingsManager } from "./SettingsManager";

@Injectable({
    providedIn: 'root',
})
export class GhsManager {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;

    constructor() {
        this.onUiChange().subscribe({
            next: () => {
                gameManager.checkEntitiesKilled();
                if (gameManager.game.levelCalculation) {
                    gameManager.levelManager.calculateScenarioLevel();
                }
                if (settingsManager.settings.scenarioRules) {
                    gameManager.scenarioRulesManager.addScenarioRulesAlways();
                    gameManager.scenarioRulesManager.applyScenarioRulesAlways();
                }
                gameManager.roundManager.firstRound = gameManager.game.round == 0 && gameManager.game.roundResets.length == 0 && gameManager.game.roundResetsHidden.length == 0;
                gameManager.buildingsManager.update();
                gameManager.challengesManager.update();
                gameManager.trialsManager.update();
                gameManager.enhancementsManager.update();
                gameManager.imbuementManager.update();
            }
        })
    }

    triggerUiChange(fromServer: boolean = false) {
        this.gameManager.uiChange.next(fromServer);
    }

    onUiChange() {
        return this.gameManager.uiChange.asObservable();
    }
}