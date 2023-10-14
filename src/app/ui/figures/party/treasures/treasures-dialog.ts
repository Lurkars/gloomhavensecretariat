import { DIALOG_DATA, Dialog, DialogRef } from "@angular/cdk/dialog";
import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Subscription } from "rxjs";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { Identifier } from "src/app/game/model/data/Identifier";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { ScenarioTreasuresDialogComponent } from "src/app/ui/footer/scenario/treasures/treasures-dialog";

@Component({
    selector: 'ghs-treasures-dialog',
    templateUrl: 'treasures-dialog.html',
    styleUrls: ['./treasures-dialog.scss']
})
export class TreasuresDialogComponent implements OnInit, OnDestroy {

    @ViewChild('treasureIndex') treasureIndex!: ElementRef;

    gameManager: GameManager = gameManager;
    edition: string;
    scenarios: ScenarioData[] = [];
    treasures: Record<string, number[]> = {};
    looted: number[] = [];
    selected: number[] = [];
    select: boolean = true;

    constructor(@Inject(DIALOG_DATA) data: { edition: string }, private dialogRef: DialogRef, private dialog: Dialog) {
        this.edition = data.edition;
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
        this.scenarios = [];
        this.treasures = {};
        this.looted = [];
        this.selected = [];
        gameManager.scenarioManager.scenarioData(this.edition).filter((scenarioData) => (gameManager.game.party.scenarios.find((value) => scenarioData.index == value.index && scenarioData.edition == value.edition && scenarioData.group == value.group) || gameManager.game.party.casualScenarios.find((value) => scenarioData.index == value.index && scenarioData.edition == value.edition && scenarioData.group == value.group))).forEach((scenarioData) => {
            let treasures: number[] = gameManager.scenarioManager.getAllTreasures(scenarioData).filter((value) => typeof value === 'number').map((value) => +value);

            if (!this.select) {
                treasures = treasures.filter((value) => !this.hasTreasure('' + value, this.edition));
            }

            if (treasures.length > 0) {
                this.scenarios.push(scenarioData);
                this.treasures[scenarioData.index] = treasures;
                treasures.forEach((value) => {
                    if (this.hasTreasure('' + value, this.edition)) {
                        this.looted.push(value);
                    }
                })
            }
        })
    }

    toggleTreasure(index: number) {
        if (this.select) {
            if (this.selected.indexOf(index) == -1) {
                this.selected.push(index);
            } else {
                this.selected.splice(this.selected.indexOf(index), 1);
            }
        } else if (this.looted.indexOf(index) == -1) {
            this.dialog.open(ScenarioTreasuresDialogComponent,
                {
                    panelClass: 'dialog',
                    data: {
                        treasures: [index],
                        edition: this.edition
                    }
                });
        }

    }

    hasTreasure(treasure: string, edition: string): boolean {
        return gameManager.game.party.treasures && gameManager.game.party.treasures.some((identifier) => identifier.name == treasure && identifier.edition == edition);
    }


    apply() {
        const removeTreasures = this.selected.filter((index) => this.looted.indexOf(index) != -1);
        const addTreasures = this.selected.filter((index) => this.looted.indexOf(index) == -1);
        if (removeTreasures.length > 0) {
            gameManager.stateManager.before("removeTreasures", this.edition, '[' + removeTreasures.join(',') + ']');
            gameManager.game.party.treasures = gameManager.game.party.treasures.filter((value) => value.edition != this.edition || isNaN(+value.name) || removeTreasures.indexOf(+value.name) == -1);
            gameManager.stateManager.after();
        }

        if (addTreasures.length > 0) {
            gameManager.stateManager.before("addTreasures", this.edition, '[' + addTreasures.join(',') + ']');
            gameManager.game.party.treasures.push(...addTreasures.map((index) => new Identifier('' + index, this.edition)));
            gameManager.stateManager.after();
        }

        this.update();
    }

    close() {
        this.dialogRef.close();
    }


}
