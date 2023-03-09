import { DialogRef } from "@angular/cdk/dialog";
import { Component } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { Identifier } from "src/app/game/model/Identifier";
import { Scenario } from "src/app/game/model/Scenario";

@Component({
    selector: 'ghs-scenario-treasures-dialog',
    templateUrl: './treasures-dialog.html',
    styleUrls: ['./treasures-dialog.scss']
})
export class ScenarioTreasuresDialogComponent {

    gameManager: GameManager = gameManager;

    scenario!: Scenario;
    characters: Character[] = [];
    character: Character | undefined;

    treasures: ('G' | number)[] = [];
    treasureIndex: number = -1;
    looted: number[] = [];

    constructor(private dialogRef: DialogRef) {
        if (!gameManager.game.scenario) {
            dialogRef.close();
        } else {
            this.scenario = gameManager.game.scenario || gameManager.scenarioManager.createScenario();
        }
        this.update();
        gameManager.uiChange.subscribe({
            next: () => {
                this.update();
            }
        })
    }

    update() {
        this.scenario = gameManager.game.scenario || gameManager.scenarioManager.createScenario();
        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent && !figure.exhausted && figure.health > 0).map((figure) => figure as Character);
        if (!this.character) {
            this.character = this.characters.find((figure) => figure.active) || this.characters.length > 0 && this.characters[0] || undefined;
        }
        this.treasures = gameManager.scenarioManager.getTreasures(this.scenario, gameManager.game.sections);
        this.looted = [];
        this.treasures.forEach((treasure, index) => {
            if (this.looted.indexOf(index) == -1 &&

                (treasure != 'G' &&
                    (this.characters.some((character) => character.treasures.indexOf(treasure) != -1)
                        ||
                        gameManager.game.party.treasures.find((identifier) => identifier.name == '' + treasure && identifier.edition == this.scenario.edition))

                    || treasure == 'G' && this.characters.some((character) => character.treasures.indexOf('G-' + index) != -1))) {
                this.looted.push(index);
            }
        })
    }

    toggleCharacter(character: Character) {
        if (this.character != character && this.treasureIndex != -1) {
            this.character = character;
            if (this.treasureIndex != -1 && this.looted.indexOf(this.treasureIndex) != -1) {
                this.treasureIndex = -1;
            }
        }
    }

    toggleTreasure(index: number) {
        if (this.treasureIndex != index) {
            this.treasureIndex = index;
        } else {
            this.treasureIndex = -1;
        }
    }

    removeTreasure(character: Character, treasure: string | number) {
        if (typeof treasure === 'number') {
            gameManager.stateManager.before('removeCharTresure', '' + treasure, this.scenario.edition, "data.character." + character.name);
            this.looted.splice(this.treasures.indexOf(treasure), 1);
        } else {
            gameManager.stateManager.before('removeCharTresure', 'G', this.scenario.edition);
            this.looted.splice(+treasure.replace('G-', ''), 1);
        }
        character.treasures.splice(character.treasures.indexOf(treasure), 1);
        gameManager.stateManager.after();
    }

    lootTreasure() {
        if (this.treasureIndex != -1) {
            const treasure = this.treasures[this.treasureIndex];
            if (this.character && treasure && this.character.treasures.indexOf(treasure == 'G' ? 'G-' + this.treasureIndex : treasure) == -1) {
                gameManager.stateManager.before('lootCharTreasure', '' + treasure, this.scenario.edition, "data.character." + this.character.name);
                this.looted.push(this.treasureIndex);
                this.character.treasures = this.character.treasures || [];
                this.character.treasures.push(treasure == 'G' ? 'G-' + this.treasureIndex : treasure);
                gameManager.stateManager.after();
            }
        }
    }
}