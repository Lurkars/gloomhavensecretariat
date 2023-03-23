import { Dialog, DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { EditionData } from "src/app/game/model/data/EditionData";
import { MonsterData } from "src/app/game/model/data/MonsterData";
import { RoomData } from "src/app/game/model/data/RoomData";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { Monster } from "src/app/game/model/Monster";
import { Scenario } from "src/app/game/model/Scenario";
import { SectionDialogComponent } from "../section/section-dialog";
import { StatsListComponent } from "./abilities/stats-list";
import { ScenarioSummaryComponent } from "../summary/scenario-summary";
import { ScenarioTreasuresDialogComponent } from "../treasures/treasures-dialog";

@Component({
    selector: 'ghs-scenario-dialog',
    templateUrl: './scenario-dialog.html',
    styleUrls: ['./scenario-dialog.scss']
})
export class ScenarioDialogComponent {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;

    monsters: MonsterData[] = [];
    setup: boolean = false;
    spoiler: boolean = false;

    constructor(@Inject(DIALOG_DATA) public scenario: Scenario, public dialogRef: DialogRef, private dialog: Dialog) {
        this.updateMonster();
    }

    updateMonster() {
        this.monsters = [];
        gameManager.scenarioManager.getMonsters(this.scenario).forEach((monster) => {
            if (this.spoiler || !monster.standeeShare || gameManager.scenarioManager.openRooms().find((room) => room.initial && room.monster.find((standee) => standee.name.split(':')[0] == monster.name)) || gameManager.game.figures.some((figure) => figure instanceof Monster && figure.name == monster.name && figure.edition == monster.edition)) {
                if (this.monsters.indexOf(monster) == -1) {
                    this.monsters.push(monster);
                }
            } else {
                const standee = gameManager.monstersData(monster.standeeShareEdition || this.scenario.edition).find((monsterData) => monsterData.name == monster.standeeShare);
                if (standee && this.monsters.indexOf(standee) == -1) {
                    this.monsters.push(standee);
                }
            }
        })

        this.monsters.sort((a, b) => {
            const textA = settingsManager.getLabel('data.monster.' + a.name).toLowerCase();
            const textB = settingsManager.getLabel('data.monster.' + b.name).toLowerCase();
            return textA < textB ? -1 : 1;
        });
    }

    openStats(monsterData: MonsterData) {
        if (this.spoiler) {
            const monster = new Monster(monsterData);
            gameManager.monsterManager.resetMonsterAbilities(monster);
            this.dialog.open(StatsListComponent, { panelClass: 'dialog', data: monster });
        }
    }

    finishScenario(success: boolean) {
        this.dialogRef.close();
        this.dialog.open(ScenarioSummaryComponent, {
            panelClass: 'dialog',
            data: {
                scenario: this.scenario,
                success: success
            }
        })
    }

    resetScenario() {
        this.dialogRef.close();
        gameManager.stateManager.before("resetScenario", ...gameManager.scenarioManager.scenarioUndoArgs());
        gameManager.roundManager.resetScenario();
        gameManager.scenarioManager.setScenario(this.scenario)
        gameManager.stateManager.after();
    }

    cancelScenario() {
        this.dialogRef.close();
        gameManager.stateManager.before("cancelScenario", ...gameManager.scenarioManager.scenarioUndoArgs());
        gameManager.scenarioManager.setScenario(undefined);
        gameManager.stateManager.after(1000);
    }

    openTreasures(event: any) {
        this.dialog.open(ScenarioTreasuresDialogComponent,
            {
                panelClass: 'dialog'
            });

    }

    openRoom(roomData: RoomData) {
        const editionData: EditionData | undefined = gameManager.editionData.find((value) => value.edition == this.scenario.edition);

        if (!editionData) {
            console.error("Could not find edition data!");
            return;
        }
        gameManager.stateManager.before(roomData.marker ? "openRoomMarker" : "openRoom", this.scenario.index, "data.scenario." + this.scenario.name, '' + roomData.ref, roomData.marker || '');
        gameManager.scenarioManager.openRoom(roomData, this.scenario, false);
        gameManager.stateManager.after();
        this.updateMonster();
    }

    addSection(sectionData: ScenarioData) {
        this.dialog.open(SectionDialogComponent,
            {
                panelClass: 'dialog',
                data: sectionData
            }).closed.subscribe({
                next: (added) => {
                    if (added) {
                        this.dialogRef.close();
                    }
                }
            });
    }
}
