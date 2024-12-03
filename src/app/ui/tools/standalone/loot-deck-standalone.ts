import { Component, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";
import { environment } from "src/environments/environment";
import { LootDeckChange } from "../../figures/loot/loot-deck";
import { storageManager } from "src/app/game/businesslogic/StorageManager";

@Component({
	standalone: false,
    selector: 'ghs-loot-deck-standalone',
    templateUrl: './loot-deck-standalone.html',
    styleUrls: ['./loot-deck-standalone.scss',]
})
export class LootDeckStandaloneComponent implements OnInit {

    gameManager: GameManager = gameManager;
    configuration: boolean = false;


    async ngOnInit() {
        try {
            await storageManager.init();
        } catch (e) {
            // continue
        }
        await settingsManager.init(!environment.production);
        await gameManager.stateManager.init(true);
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

