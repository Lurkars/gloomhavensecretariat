import { Component, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";
import { LootDeckChange } from "../../figures/loot/loot-deck";

@Component({
    selector: 'ghs-loot-deck-standalone',
    templateUrl: './loot-deck-standalone.html',
    styleUrls: ['./loot-deck-standalone.scss',]
})
export class LootDeckStandaloneComponent implements OnInit {

    gameManager: GameManager = gameManager;
    configuration: boolean = false;


    async ngOnInit() {
        await settingsManager.init();
        gameManager.stateManager.init();
        gameManager.uiChange.emit();
        if (gameManager.game.state != GameState.next) {
            gameManager.roundManager.nextGameState(true);
        }

        if (gameManager.game.lootDeck.cards.length == 0) {
            this.configuration = true;
        }
    }

    vertical(): boolean {
        return window.innerWidth < 800;
    }


    beforeLootDeck(change: LootDeckChange) {
        gameManager.stateManager.before(change.type, ...change.values)
    }

    afterLootDeck(change: LootDeckChange) {
        gameManager.game.lootDeck = change.deck;
        gameManager.stateManager.after();
    }
}

