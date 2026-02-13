import { ChangeDetectorRef, effect, inject, Injectable } from "@angular/core";
import { gameManager, GameManager } from "./GameManager";
import { settingsManager, SettingsManager } from "./SettingsManager";

@Injectable({
    providedIn: 'root',
})
export class GhsManager {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;

    constructor() {
        effect(() => {
            gameManager.uiChangeSignal();
            this.onUiChangeUpdate();
        });
    }

    private onUiChangeUpdate(): void {
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

        // StateManager permissions update
        if (!settingsManager.settings.serverUrl || !settingsManager.settings.serverPort || !settingsManager.settings.serverCode) {
            gameManager.stateManager.permissions = undefined;
            gameManager.stateManager.updateBlocked = false;
        }
        gameManager.stateManager.updatePermissions();
    }

    triggerUiChange(fromServer: boolean = false) {
        gameManager.triggerUiChange(fromServer);
    }

    /**
     * Sets up a signal-based effect that runs on every uiChange.
     * Must be called from a component constructor (injection context required).
     * Automatically calls markForCheck() for zoneless change detection compatibility.
     * The effect auto-cleans up when the component is destroyed.
     */
    uiChangeEffect(callback: (fromServer: boolean) => void): void {
        const cdr = inject(ChangeDetectorRef);
        effect(() => {
            gameManager.uiChangeSignal();
            callback(gameManager.uiChangeFromServer());
            cdr.markForCheck();
        });
    }
}