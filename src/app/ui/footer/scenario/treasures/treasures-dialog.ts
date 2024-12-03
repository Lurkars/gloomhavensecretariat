import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Scenario } from "src/app/game/model/Scenario";
import { Identifier } from "src/app/game/model/data/Identifier";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";

@Component({
	standalone: false,
    selector: 'ghs-scenario-treasures-dialog',
    templateUrl: './treasures-dialog.html',
    styleUrls: ['./treasures-dialog.scss']
})
export class ScenarioTreasuresDialogComponent implements OnInit, OnDestroy {

    gameManager: GameManager = gameManager;

    scenario: Scenario | undefined;
    characters: Character[] = [];
    character: Character | undefined;

    treasures: ('G' | number)[] = [];
    treasureIndex: number = -1;
    edition: string = ""
    looted: number[] = [];
    rewardResults: string[][] = [];
    init: boolean = true;

    constructor(@Inject(DIALOG_DATA) public data: { treasures: ('G' | number)[] | undefined, edition: string | undefined }, dialogRef: DialogRef) {
        if (!gameManager.game.scenario && (!data.treasures || !data.edition)) {
            ghsDialogClosingHelper(dialogRef);
        } else if (data && data.treasures && data.edition) {
            this.treasures = data.treasures;
            this.edition = data.edition;
        } else if (gameManager.game.scenario) {
            this.scenario = gameManager.game.scenario || gameManager.scenarioManager.createScenario();
            this.edition = this.scenario.edition;
        }
    }

    ngOnInit(): void {
        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: () => {
                this.update();
            }
        });
        this.update();
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    update() {
        this.scenario = gameManager.game.scenario || gameManager.scenarioManager.createScenario();
        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent && gameManager.entityManager.isAlive(figure)).map((figure) => figure as Character);
        if (this.scenario && (!this.data || !this.data.treasures)) {
            this.edition = this.scenario.edition;
            this.treasures = gameManager.scenarioManager.getTreasures(this.scenario, gameManager.game.sections);
        }
        this.looted = [];
        let activeIndex = -1;
        this.treasures.forEach((treasure, index) => {
            if (this.looted.indexOf(index) == -1 &&
                (this.characters.find((character) => gameManager.lootManager.hasTreasure(character, treasure, index)) || gameManager.game.party.treasures.find((identifier) => identifier.name == '' + treasure && identifier.edition == this.edition))) {
                this.looted.push(index);
            } else {
                activeIndex = index;
            }
        })

        if (this.init && this.treasures.length == this.looted.length + 1 && this.treasureIndex != activeIndex && this.looted.indexOf(activeIndex) == -1) {
            this.treasureIndex = activeIndex;
        }

        if (!this.character && this.treasures.length != this.looted.length) {
            this.character = this.characters.find((figure) => figure.active) || this.characters.length > 0 && this.characters[0] || undefined;
        }
    }

    toggleCharacter(character: Character) {
        if (this.character != character && this.treasures.length != this.looted.length) {
            this.character = character;
            if (this.treasureIndex != -1 && this.looted.indexOf(this.treasureIndex) != -1) {
                this.treasureIndex = -1;
            }
        } else {
            this.character = undefined;
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
            gameManager.stateManager.before('removeCharTresure', treasure >= 0 ? '' + treasure : '???', this.edition, gameManager.characterManager.characterName(character));
            this.looted.splice(this.treasures.indexOf(treasure), 1);
        } else {
            gameManager.stateManager.before('removeCharTresure', 'G', this.edition);
            this.looted.splice(+treasure.replace('G-', ''), 1);
        }
        character.treasures.splice(character.treasures.indexOf(treasure), 1);
        if (typeof treasure === 'number') {
            gameManager.game.party.treasures = gameManager.game.party.treasures.filter((value) => value.edition != this.edition || value.name != '' + treasure);
        }
        gameManager.stateManager.after();
    }

    lootTreasure() {
        if (this.treasureIndex != -1) {
            this.init = false;
            this.rewardResults = [];
            const treasure = this.treasures[this.treasureIndex];
            if (this.character && treasure && this.character.treasures.indexOf(treasure == 'G' ? 'G-' + this.treasureIndex : treasure) == -1) {
                gameManager.stateManager.before('lootCharTreasure', ('' + treasure).startsWith('G') || +treasure >= 0 ? '' + treasure : '???', this.edition, gameManager.characterManager.characterName(this.character));
                this.looted.push(this.treasureIndex);
                if (treasure != 'G' && settingsManager.settings.treasuresLoot) {
                    this.rewardResults = gameManager.lootManager.lootTreasure(this.character, treasure - 1, this.edition);
                }
                this.character.treasures = this.character.treasures || [];
                this.character.treasures.push(treasure == 'G' ? 'G-' + this.treasureIndex : this.rewardResults.some((rewardResult) => rewardResult.length > 0) ? treasure + ':' + this.rewardResults.map((reward) => reward.join('+')).join('|') : treasure);

                if (typeof treasure === 'number') {
                    gameManager.game.party.treasures.push(new Identifier('' + treasure, this.edition));
                }

                gameManager.stateManager.after();
            }
        }
    }
}