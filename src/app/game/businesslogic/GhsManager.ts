import { ChangeDetectorRef, effect, inject, Injectable, untracked } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';

@Injectable({
  providedIn: 'root'
})
export class GhsManager {
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  constructor() {
    effect(() => {
      gameManager.uiChangeSignal();
      untracked(() => this.onUiChangeUpdate());
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
    gameManager.roundManager.firstRound =
      gameManager.game.round === 0 && gameManager.game.roundResets.length === 0 && gameManager.game.roundResetsHidden.length === 0;
    gameManager.buildingsManager.update();
    gameManager.challengesManager.update();
    gameManager.trialsManager.update();
    gameManager.enhancementsManager.update();
    gameManager.imbuementManager.update();
    gameManager.lootManager.update();

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

  uiChangeEffect(callback: (fromServer: boolean) => void): void {
    const cdr = inject(ChangeDetectorRef);
    effect(() => {
      gameManager.uiChangeSignal();
      const fromServer = gameManager.uiChangeFromServer();
      untracked(() => callback(fromServer));
      cdr.markForCheck();
    });
  }
}
