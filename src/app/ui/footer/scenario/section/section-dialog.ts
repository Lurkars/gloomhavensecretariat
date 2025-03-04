import { Dialog, DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, HostListener, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";
import { ScenarioSummaryComponent } from "../summary/scenario-summary";

@Component({
    standalone: false,
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
                panelClass: ['dialog'],
                data: {
                    scenario: gameManager.game.scenario,
                    success: true,
                    conclusion: this.sectionData
                }
            })
            this.close(true);
        } else {
            gameManager.stateManager.before("addSection", this.sectionData.index, gameManager.scenarioManager.scenarioTitle(this.sectionData, true), "data.edition." + this.sectionData.edition);
            gameManager.scenarioManager.addSection(this.sectionData);
            gameManager.stateManager.after();
            this.close(true);
        }
    }

    close(result: boolean) {
        ghsDialogClosingHelper(this.dialogRef, result);
    }

    @HostListener('document:keydown', ['$event'])
    confirm(event: KeyboardEvent) {
        if (settingsManager.settings.keyboardShortcuts && event.key === 'Enter') {
            this.addSection();
            event.preventDefault();
            event.stopPropagation();
        }
    }
}