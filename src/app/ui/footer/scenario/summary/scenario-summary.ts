import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { LootManager } from "src/app/game/businesslogic/LootManager";
import { Character } from "src/app/game/model/Character";
import { LootType } from "src/app/game/model/Loot";
import { Scenario } from "src/app/game/model/Scenario";


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

    apply() {
        gameManager.stateManager.before("finishScenario." + (this.success ? "success" : "failure"), ...gameManager.scenarioManager.scenarioUndoArgs());
        gameManager.scenarioManager.finishScenario(this.success);
        gameManager.stateManager.after(1000);
        this.dialogRef.close();
    }

    restart() {
        gameManager.stateManager.before("finishScenario.restart", ...gameManager.scenarioManager.scenarioUndoArgs());
        gameManager.scenarioManager.finishScenario(this.success, true);
        gameManager.stateManager.after(1000);
        this.dialogRef.close();
    }

    linkedScenario(index: string) {
        if (gameManager.game.scenario) {
            const scenario = gameManager.scenarioData(gameManager.game.scenario.edition).find((scenarioData) => scenarioData.group == gameManager.game.scenario?.group && scenarioData.index == index);
            if (scenario) {
                gameManager.stateManager.before("finishScenario.linked", ...gameManager.scenarioManager.scenarioUndoArgs(), index);
                gameManager.scenarioManager.finishScenario(this.success, false, new Scenario(scenario));
                gameManager.stateManager.after(1000);
                this.dialogRef.close();
            }
        }
    }

    close() {
        this.dialogRef.close();
    }
}
