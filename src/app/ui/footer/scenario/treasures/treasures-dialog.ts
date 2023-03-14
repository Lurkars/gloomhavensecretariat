import { DialogRef } from "@angular/cdk/dialog";
import { Component } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
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
    rewardResults: string[][] = [];

    constructor(dialogRef: DialogRef) {
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
                (this.characters.find((character) => gameManager.lootManager.hasTreasure(character, treasure, index)) || gameManager.game.party.treasures.find((identifier) => identifier.name == '' + treasure && identifier.edition == this.scenario.edition))) {
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
            this.rewardResults = [];
            const treasure = this.treasures[this.treasureIndex];
            if (this.character && treasure && this.character.treasures.indexOf(treasure == 'G' ? 'G-' + this.treasureIndex : treasure) == -1) {
                gameManager.stateManager.before('lootCharTreasure', '' + treasure, this.scenario.edition, "data.character." + this.character.name);
                this.looted.push(this.treasureIndex);
                if (treasure != 'G' && settingsManager.settings.treasuresLoot) {
                    this.rewardResults = gameManager.lootManager.lootTreasure(this.character, treasure - 1, this.scenario.edition);
                }
                this.character.treasures = this.character.treasures || [];
                this.character.treasures.push(treasure == 'G' ? 'G-' + this.treasureIndex : this.rewardResults.some((rewardResult) => rewardResult.length > 0) ? treasure + ':' + this.rewardResults.map((reward) => reward.join('+')).join('|') : treasure);
                gameManager.stateManager.after();
            }
        }
    }

    rewardsFromString(treasure: string): string[][] {
        if (treasure.split(':').length < 2) {
            return [];
        } else {
            return treasure.split(':')[1].split('|').map((value) => value.split('+'));
        }
    }
}