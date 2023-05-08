import { Dialog, DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, HostListener, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { ScenarioSummaryComponent } from "../summary/scenario-summary"

@Component({
    selector: 'ghs-section-dialog',
    templateUrl: './section-dialog.html',
    styleUrls: ['./section-dialog.scss']
})
export class SectionDialogComponent {

    gameManager: GameManager = gameManager;

    constructor(@Inject(DIALOG_DATA) public sectionData: ScenarioData, private dialog: Dialog, private dialogRef: DialogRef) { }

    addSection() {
        if (this.sectionData.conclusion) {
            this.dialog.open(ScenarioSummaryComponent, {
                panelClass: 'dialog',
                data: {
                    scenario: gameManager.game.scenario,
                    success: true,
                    conclusion: this.sectionData
                }
            })
            this.dialogRef.close(true);
        } else {
            gameManager.stateManager.before("addSection", this.sectionData.index, "data.section." + this.sectionData.name, "data.edition." + this.sectionData.edition);
            gameManager.scenarioManager.addSection(this.sectionData);
            gameManager.stateManager.after();
            this.dialogRef.close(true);
        }
    }

    cancel() {
        this.dialogRef.close(false);
    }

    @HostListener('document:keydown', ['$event'])
    confirm(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.addSection();
            event.preventDefault();
            event.stopPropagation();
        }
    }
}