import { DIALOG_DATA, Dialog, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject, ViewChild } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Scenario } from "src/app/game/model/Scenario";
import { EditionData } from "src/app/game/model/data/EditionData";
import { RoomData } from "src/app/game/model/data/RoomData";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";
import { EventEffectsDialog } from "../../../figures/character/event-effects/event-effects";
import { ScenarioConclusionComponent } from "../scenario-conclusion/scenario-conclusion";
import { ScenarioSetupComponent } from "../scenario-setup/scenario-setup";
import { SectionDialogComponent } from "../section/section-dialog";
import { ScenarioSummaryComponent } from "../summary/scenario-summary";
import { ScenarioTreasuresDialogComponent } from "../treasures/treasures-dialog";
import { ScenarioRulesDialogComponent } from "../../scenario-rules/dialog/scenario-rules-dialog";
import { FavorsComponent } from "src/app/ui/figures/character/event-effects/favors/favors";

@Component({
	standalone: false,
    selector: 'ghs-scenario-dialog',
    templateUrl: './scenario-dialog.html',
    styleUrls: ['./scenario-dialog.scss']
})
export class ScenarioDialogComponent {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;

    @ViewChild('setupComponent') setupComponent!: ScenarioSetupComponent;

    setup: boolean = false;
    openRooms: RoomData[] = [];
    closedRooms: RoomData[] = [];
    availableSections: ScenarioData[] = [];

    constructor(@Inject(DIALOG_DATA) public scenario: Scenario, public dialogRef: DialogRef, private dialog: Dialog) {
        this.openRooms = gameManager.scenarioManager.openRooms();
        this.closedRooms = gameManager.scenarioManager.closedRooms();
        this.availableSections = gameManager.scenarioManager.availableSections();
    }

    finishScenario(success: boolean) {
        this.close();
        const conclusions = gameManager.scenarioManager.availableSections(true).filter((sectionData) =>
            sectionData.edition == this.scenario.edition && sectionData.parent == this.scenario.index && sectionData.group == this.scenario.group && sectionData.conclusion && gameManager.scenarioManager.getRequirements(sectionData).length == 0);
        if (conclusions.length < 2 || !success) {
            this.dialog.open(ScenarioSummaryComponent, {
                panelClass: ['dialog'],
                data: {
                    scenario: this.scenario,
                    conclusion: conclusions.length == 1 ? conclusions[0] : undefined,
                    success: success
                }
            })
        } else {
            this.dialog.open(ScenarioConclusionComponent, {
                panelClass: ['dialog'],
                data: { conclusions: conclusions, parent: this.scenario }
            }).closed.subscribe({
                next: (conclusion: unknown) => {
                    if (conclusion) {
                        this.dialog.open(ScenarioSummaryComponent, {
                            panelClass: ['dialog'],
                            data: {
                                scenario: this.scenario,
                                conclusion: conclusion,
                                success: success
                            }
                        })
                    }
                }
            });
        }
    }

    resetScenario() {
        this.close();
        gameManager.stateManager.before("resetScenario", ...gameManager.scenarioManager.scenarioUndoArgs());
        gameManager.roundManager.resetScenario();
        gameManager.scenarioManager.setScenario(this.scenario)
        gameManager.stateManager.after();
    }

    cancelScenario() {
        this.close();
        gameManager.stateManager.before("cancelScenario", ...gameManager.scenarioManager.scenarioUndoArgs());
        gameManager.scenarioManager.setScenario(undefined);
        gameManager.stateManager.after(1000);
    }

    showScenarioRules() {
        this.dialog.open(ScenarioRulesDialogComponent, { panelClass: ['dialog'] });
        this.close();
    }

    openTreasures(event: any) {
        this.dialog.open(ScenarioTreasuresDialogComponent,
            {
                panelClass: ['dialog']
            });

    }

    openEventEffects(event: any) {
        this.dialog.open(EventEffectsDialog, { panelClass: ['dialog'] });
        this.close();
    }

    openRoom(roomData: RoomData) {
        const editionData: EditionData | undefined = gameManager.editionData.find((value) => value.edition == this.scenario.edition);

        if (!editionData) {
            console.error("Could not find edition data!");
            return;
        }
        gameManager.stateManager.before(roomData.marker ? "openRoomMarker" : "openRoom", this.scenario.index, gameManager.scenarioManager.scenarioTitle(this.scenario), roomData.ref, roomData.marker || '');
        gameManager.scenarioManager.openRoom(roomData, this.scenario, false);
        gameManager.stateManager.after();
        this.setupComponent && this.setupComponent.updateMonster();
    }

    addSection(sectionData: ScenarioData) {
        this.dialog.open(SectionDialogComponent,
            {
                panelClass: ['dialog'],
                data: sectionData
            }).closed.subscribe({
                next: (added: unknown) => {
                    if (added) {
                        this.close();
                    }
                }
            });
    }

    openFavors() {
        this.dialog.open(FavorsComponent, {
            panelClass: ['dialog']
        })
    }

    close() {
        ghsDialogClosingHelper(this.dialogRef);
    }
}
