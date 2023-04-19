import { Component, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";
import { environment } from "src/environments/environment";
import { AttackModiferDeckChange } from "../../figures/attackmodifier/attackmodifierdeck";

@Component({
    selector: 'ghs-attackmodifier-standalone',
    templateUrl: './attackmodifier-standalone.html',
    styleUrls: ['./attackmodifier-standalone.scss',]
})
export class AttackModifierStandaloneComponent implements OnInit {

    gameManager: GameManager = gameManager;

    async ngOnInit() {
        await settingsManager.init(!environment.production);
        gameManager.stateManager.init();
        gameManager.game.figures.forEach((figure) => figure.active = false);
        gameManager.uiChange.emit();
        if (gameManager.game.state != GameState.next) {
            gameManager.roundManager.nextGameState(true);
        }
    }

    vertical(): boolean {
        return window.innerWidth < 800;
    }

    beforeMonsterAttackModifierDeck(change: AttackModiferDeckChange) {
        gameManager.stateManager.before("updateAttackModifierDeck." + change.type, "monster", ...change.values);
    }

    afterMonsterAttackModifierDeck(change: AttackModiferDeckChange) {
        gameManager.game.monsterAttackModifierDeck = change.deck;
        gameManager.stateManager.after();
    }


    next() {
        gameManager.stateManager.before("draw");
        if (gameManager.game.state == GameState.next) {
            gameManager.roundManager.nextGameState(true);
        }
        gameManager.roundManager.nextGameState(true);
        gameManager.game.figures.forEach((figure) => figure.active = false);
        gameManager.stateManager.after();
    }
}

