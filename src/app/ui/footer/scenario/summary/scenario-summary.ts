import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { LootManager } from "src/app/game/businesslogic/LootManager";
import { Character } from "src/app/game/model/Character";
import { LootType } from "src/app/game/model/Loot";


@Component({
    selector: 'ghs-scenario-summary',
    templateUrl: './scenario-summary.html',
    styleUrls: ['./scenario-summary.scss']
})
export class ScenarioSummaryComponent {

    gameManager: GameManager = gameManager;

    characters: Character[];
    lootColumns: LootType[] = [];

    constructor(@Inject(DIALOG_DATA) public success: boolean, private dialogRef: DialogRef) {
        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => {
            let char = new Character((figure as Character), figure.level);
            char.fromModel((figure as Character).toModel());
            return char;
        })

        for (let value in LootType) {
            const lootType: LootType = value as LootType;
            if (lootType != LootType.money && lootType != LootType.special1 && lootType != LootType.special2 && this.lootColumns.indexOf(lootType) == -1 && this.characters.some((character) => character.lootCards && character.lootCards.some((index) => gameManager.game.lootDeck.cards[index].type == lootType))) {
                this.lootColumns.push(lootType);
            }
        }

        dialogRef.closed.subscribe({
            next: (state) => {
                if (state && state != "cancel") {
                    gameManager.stateManager.before("finishScenario." + (success ? "success" : "failure"), ...gameManager.scenarioManager.scenarioUndoArgs());
                    gameManager.scenarioManager.finishScenario(success, state == "restart");
                    gameManager.stateManager.after(1000);
                }
            }
        })
    }

    lootValue(character: Character, lootType: LootType): number {
        let value = 0;

        if (character.lootCards) {
            character.lootCards.forEach((index) => {
                const loot = gameManager.game.lootDeck.cards[index];
                if (loot && loot.type == lootType) {
                    value += gameManager.lootManager.getValue(loot);
                }
            })
        }

        return value;
    }

    close(state: "apply" | "restart" | "cancel") {
        this.dialogRef.close(state);
    }
}
