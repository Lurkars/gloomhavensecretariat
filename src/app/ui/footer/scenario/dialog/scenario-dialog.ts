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
import { StatsListComponent } from "./stats-list/stats-list";
import { ScenarioSummaryComponent } from "../summary/scenario-summary";
import { ScenarioTreasuresDialogComponent } from "../treasures/treasures-dialog";
import { EventEffectsDialog } from "../../../figures/character/event-effects/event-effects";
import { ScenarioConclusionComponent } from "../scenario-conclusion/scenario-conclusion";
import { LootType } from "src/app/game/model/data/Loot";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";

@Component({
    selector: 'ghs-scenario-dialog',
    templateUrl: './scenario-dialog.html',
    styleUrls: ['./scenario-dialog.scss']
})
export class ScenarioDialogComponent {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;

    monsters: MonsterData[] = [];
    lootConfig: { type: LootType, value: number }[] = [];
    lootRandomItem: boolean = false;
    setup: boolean = false;
    hasSpoiler: boolean = false;
    spoiler: boolean = false;
    detailed: boolean = false;
    openRooms: RoomData[] = [];
    closedRooms: RoomData[] = [];
    availableSections: ScenarioData[] = [];

    constructor(@Inject(DIALOG_DATA) public scenario: Scenario, public dialogRef: DialogRef, private dialog: Dialog) {
        this.openRooms = gameManager.scenarioManager.openRooms();
        this.closedRooms = gameManager.scenarioManager.closedRooms();
        this.availableSections = gameManager.scenarioManager.availableSections();
        this.updateMonster();
        if (scenario.lootDeckConfig) {
            for (let value in LootType) {
                const lootType: LootType = value as LootType;
                if (scenario.lootDeckConfig[lootType]) {
                    this.lootConfig.push({ type: lootType, value: scenario.lootDeckConfig[lootType] || 0 });
                    if (lootType == LootType.random_item && gameManager.game.party.randomItemLooted.find((model) => model.edition == scenario.edition && model.group == scenario.group && model.index == scenario.index)) {
                        this.lootRandomItem = true;
                    }
                }
            }
        }
    }

    updateMonster() {
        this.monsters = [];
        this.hasSpoiler = false;
        gameManager.scenarioManager.getMonsters(this.scenario, this.scenario.custom).forEach((monster) => {
            if (this.spoiler || !monster.standeeShare || gameManager.scenarioManager.openRooms().find((room) => room.initial && room.monster.find((standee) => standee.name.split(':')[0] == monster.name)) || gameManager.game.figures.some((figure) => figure instanceof Monster && figure.name == monster.name && figure.edition == monster.edition)) {
                if (this.monsters.indexOf(monster) == -1) {
                    monster.tags = [];
                    this.monsters.push(monster);
                }
            } else {
                const standee = gameManager.monstersData().find((monsterData) => monsterData.name == monster.standeeShare && monsterData.edition == (monster.standeeShareEdition || monster.edition));
                if (standee) {
                    const changedStandee = JSON.parse(JSON.stringify(standee)) as MonsterData;
                    changedStandee.tags = changedStandee.tags || [];
                    if (gameManager.editionRules('cs')) {
                        if (monster.boss) {
                            changedStandee.tags.push('boss');
                        }
                    }

                    const otherStandee = this.monsters.find((m) => m.name == changedStandee.name && m.edition == changedStandee.edition);
                    if (!otherStandee) {
                        this.hasSpoiler = true;
                        this.monsters.push(changedStandee);
                    } else
                        if (!this.spoiler && gameManager.editionRules('cs')) {
                            otherStandee.tags = otherStandee.tags || [];
                            if (monster.boss) {
                                this.hasSpoiler = true;
                                otherStandee.tags.push('boss');
                            }
                        }

                }
            }
        })

        this.monsters = this.monsters.filter((monsterData, index, self) => !self.find((m) => monsterData.standeeShare == m.edition && monsterData.standeeShareEdition == m.name)).sort((a, b) => {
            const textA = settingsManager.getLabel('data.monster.' + a.name).toLowerCase();
            const textB = settingsManager.getLabel('data.monster.' + b.name).toLowerCase();
            return textA < textB ? -1 : 1;
        });
    }

    toMonster(monsterData: MonsterData): Monster {
        return new Monster(monsterData, gameManager.game.level);
    }

    openStats(monsterData: MonsterData) {
        const monster = new Monster(monsterData, gameManager.game.level);
        monster.tags = monsterData.tags;
        gameManager.monsterManager.resetMonsterAbilities(monster);
        this.dialog.open(StatsListComponent, { panelClass: ['dialog'], data: monster });
    }

    finishScenario(success: boolean) {
        this.close();
        const conclusions = gameManager.scenarioManager.availableSections(true).filter((sectionData) =>
            sectionData.edition == this.scenario.edition && sectionData.parent == this.scenario.index && sectionData.group == this.scenario.group && sectionData.conclusion);
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
                next: (conclusion) => {
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
        gameManager.stateManager.before(roomData.marker ? "openRoomMarker" : "openRoom", this.scenario.index, "data.scenario." + this.scenario.name, '' + roomData.ref, roomData.marker || '');
        gameManager.scenarioManager.openRoom(roomData, this.scenario, false);
        gameManager.stateManager.after();
        this.updateMonster();
    }

    addSection(sectionData: ScenarioData) {
        this.dialog.open(SectionDialogComponent,
            {
                panelClass: ['dialog'],
                data: sectionData
            }).closed.subscribe({
                next: (added) => {
                    if (added) {
                        this.close();
                    }
                }
            });
    }

    close() {
        ghsDialogClosingHelper(this.dialogRef);
    }
}
