import { Component, OnDestroy, OnInit } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ghsValueSign } from "../../helper/Static";
import { Subscription } from "rxjs";


@Component({
    selector: 'ghs-level-dialog',
    templateUrl: './level-dialog.html',
    styleUrls: ['./level-dialog.scss']
})
export class LevelDialogComponent implements OnInit, OnDestroy {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    trap: number = 0;
    experience: number = 0;
    loot: number = 0;
    hazardousTerrain: number = 0;

    levels: number[] = [0, 1, 2, 3, 4, 5, 6, 7];

    ngOnInit(): void {
        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: () => {
                this.calculateValues();
            }
        });
        this.calculateValues();
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    async setLevelCalculation(levelCalculation: boolean) {
        await gameManager.stateManager.before(levelCalculation ? "enableAutomaticLevel" : "disabledAutomaticLevel");
        gameManager.game.levelCalculation = levelCalculation;
        if (gameManager.game.levelCalculation) {
            gameManager.levelManager.calculateScenarioLevel();
        }
        await gameManager.stateManager.after();
    }

    async setLevelAdjustment(levelAdjustment: number) {
        await gameManager.stateManager.before("updateLevelAdjustment", ghsValueSign(levelAdjustment));
        gameManager.game.levelAdjustment = levelAdjustment;
        if (gameManager.game.levelCalculation) {
            gameManager.levelManager.calculateScenarioLevel();
        }
        await gameManager.stateManager.after();
    }

    async setBonusAdjustment(bonusAdjustment: number) {
        await gameManager.stateManager.before("updateBonusAdjustment", ghsValueSign(bonusAdjustment));
        gameManager.game.bonusAdjustment = bonusAdjustment;
        if (gameManager.game.levelCalculation) {
            gameManager.levelManager.calculateScenarioLevel();
        }
        await gameManager.stateManager.after();
    }

    async setGe5Player(ge5Player: boolean) {
        await gameManager.stateManager.before(ge5Player ? "enabledGe5Player" : "disabledGe5Player");
        gameManager.game.ge5Player = ge5Player;
        if (gameManager.game.levelCalculation) {
            gameManager.levelManager.calculateScenarioLevel();
        }
        await gameManager.stateManager.after();
    }

    ge5Player(): boolean {
        return gameManager.characterManager.characterCount() > 4;
    }

    async togglePlayerCount(event: any) {
        await gameManager.stateManager.before(event.target.checked ? "enabledManualPlayerCount" : "disabledManualPlayerCount");
        gameManager.game.playerCount = event.target.checked ? 2 : -1;
        if (event.target.checked) {
            gameManager.game.levelCalculation = false;
        } else if (gameManager.game.levelCalculation) {
            gameManager.levelManager.calculateScenarioLevel();
        }
        await gameManager.stateManager.after();
    }

    async setPlayerCount(playerCount: number) {
        await gameManager.stateManager.before("updateManualPlayerCount", '' + playerCount);
        gameManager.game.playerCount = playerCount;
        if (gameManager.game.levelCalculation) {
            gameManager.levelManager.calculateScenarioLevel();
        }
        await gameManager.stateManager.after();
    }

    async setLevel(level: number) {
        await gameManager.stateManager.before("setScenarioLevel", "" + level);
        gameManager.levelManager.setLevel(level);
        gameManager.game.levelCalculation = false;
        await gameManager.stateManager.after();
    }

    async setSolo(solo: boolean) {
        await gameManager.stateManager.before(solo ? "enableSolo" : "disableSolo");
        gameManager.game.solo = solo;
        await gameManager.stateManager.after();
    }

    calculateValues() {
        this.trap = gameManager.levelManager.trap();
        this.experience = gameManager.levelManager.experience();
        this.loot = gameManager.levelManager.loot();
        this.hazardousTerrain = gameManager.levelManager.terrain();
    }
}

