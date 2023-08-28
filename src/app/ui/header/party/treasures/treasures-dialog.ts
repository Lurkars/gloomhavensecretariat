import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, ElementRef, Inject, ViewChild } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { Party } from "src/app/game/model/Party";
import { Identifier } from "src/app/game/model/data/Identifier";

@Component({
    selector: 'ghs-treasures-dialog',
    templateUrl: 'treasures-dialog.html',
    styleUrls: ['./treasures-dialog.scss']
})
export class TreasuresDialogComponent {

    @ViewChild('treasureIndex') treasureIndex!: ElementRef;

    gameManager: GameManager = gameManager;

    constructor(@Inject(DIALOG_DATA) public party: Party, private dialogRef: DialogRef) { }

    treasures(): Identifier[] {
        return this.party.treasures.filter((identifier) => !this.party.edition || identifier.edition == this.party.edition).sort((a, b) => {
            if (!this.party.edition && a.edition != b.edition) {
                return gameManager.editions().indexOf(a.edition) - gameManager.editions().indexOf(b.edition);
            }

            return +a.name - +b.name;
        });
    }

    addTreasure(indexElement: HTMLInputElement, edition: string) {
        const treasure: string = indexElement.value;
        if (treasure && !isNaN(+treasure)) {
            if (this.hasTreasure(treasure, edition)) {
                indexElement.classList.add('warning');
            } else {
                indexElement.classList.add('error');
                const editionData = gameManager.editionData.find((editionData) => editionData.edition == edition);
                if (editionData && editionData.treasures) {
                    const treasureIndex = +treasure - (editionData.treasureOffset || 0);
                    if (treasureIndex >= 0 && treasureIndex < editionData.treasures.length) {
                        gameManager.stateManager.before("addTreasure", edition, treasure);
                        this.party.treasures = this.party.treasures || [];
                        this.party.treasures.push(new Identifier(treasure, edition));
                        this.treasureIndex.nativeElement.value = "";
                        indexElement.classList.remove('error');
                        gameManager.stateManager.after();
                    }
                }
            }
        }
    }

    hasTreasure(treasure: string, edition: string): boolean {
        return this.party.treasures && this.party.treasures.some((identifier) => identifier.name == treasure && identifier.edition == edition);
    }

    removeTreasure(treasure: Identifier) {
        gameManager.stateManager.before("removeTreasure", treasure.edition, treasure.name);
        this.party.treasures.splice(this.party.treasures.indexOf(treasure), 1);
        gameManager.stateManager.after();
    }

    close() {
        this.dialogRef.close();
    }


}
