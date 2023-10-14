import { DialogRef, DIALOG_DATA, Dialog } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { CharacterMoveResourcesDialog } from "./move-resources";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { ScenarioSummaryComponent } from "src/app/ui/footer/scenario/summary/scenario-summary";

@Component({
    selector: 'ghs-character-retirement-dialog',
    templateUrl: 'retirement-dialog.html',
    styleUrls: ['./retirement-dialog.scss']
})
export class CharacterRetirementDialog {

    gameManager: GameManager = gameManager;

    conclusion: ScenarioData | undefined;

    constructor(@Inject(DIALOG_DATA) public character: Character, private dialogRef: DialogRef, private dialog: Dialog) {
        this.conclusion = gameManager.sectionData(this.character.edition).find((sectionData) => sectionData.retirement == this.character.name && sectionData.conclusion);
    }

    openConclusion() {
        if (this.conclusion) {
            this.dialog.open(ScenarioSummaryComponent, {
                panelClass: 'dialog',
                data: {
                    scenario: this.conclusion,
                    conclusionOnly: true,
                    rewardsOnly: gameManager.game.party.conclusions.find((value) => this.conclusion && value.edition == this.conclusion.edition && value.group == this.conclusion.group && value.index == this.conclusion.index) != undefined
                }
            })
        }
    }

    moveResources() {
        this.dialog.open(CharacterMoveResourcesDialog, {
            panelClass: 'dialog',
            data: { character: this.character, all: true }
        });
    }

    apply() {
        this.dialogRef.close(true);
        if (this.conclusion && !gameManager.game.party.conclusions.find((value) => this.conclusion && value.edition == this.conclusion.edition && value.group == this.conclusion.group && value.index == this.conclusion.index)) {
            this.openConclusion();
        }
    }

    close() {
        this.dialogRef.close();
    }

}