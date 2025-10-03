import { Dialog } from "@angular/cdk/dialog";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Scenario } from "src/app/game/model/Scenario";
import { BuildingCosts, SelectResourceResult } from "src/app/game/model/data/BuildingData";
import { LootType } from "src/app/game/model/data/Loot";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { ScenarioConclusionComponent } from "src/app/ui/footer/scenario/scenario-conclusion/scenario-conclusion";
import { ScenarioSummaryComponent } from "src/app/ui/footer/scenario/summary/scenario-summary";
import { Building } from "../buildings";
import { GardenComponent } from "../garden/garden";
import { StablesComponent } from "../stables/stables";
import { BuildingUpgradeDialog } from "../upgrade-dialog/upgrade-dialog";

@Component({
    standalone: false,
    selector: 'ghs-buildings-list',
    templateUrl: 'buildings-list.html',
    styleUrls: ['./buildings-list.scss']
})
export class BuildingsListComponent {

    @Input() buildings: Building[] = [];
    @Input() short: boolean = false;
    @Input() invert: boolean = false;

    @Output() change: EventEmitter<void> = new EventEmitter<void>();

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;

    constructor(private dialog: Dialog) { }

    upgradeable(building: Building): boolean {
        let costs: BuildingCosts = building.model.level ? building.data.upgrades[building.model.level - 1] : building.data.costs;
        if (building.model.level && !building.data.repair) {
            return false;
        }

        if (building.data.repair && building.model.state == "damaged") {
            const totalCosts = building.data.repair[building.model.level - 1];
            return (this.partyResource(LootType.lumber) + this.partyResource(LootType.metal) + this.partyResource(LootType.hide)) > totalCosts || gameManager.game.party.morale > 0;
        }

        let discount = gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == "carpenter" && buildingModel.level > 0 && buildingModel.state != 'wrecked') != undefined;

        if (building.model.state == 'wrecked') {
            costs = building.data.rebuild[building.model.level - 1];
            if (costs.lumber > this.partyResource(LootType.lumber)) {
                if (discount && costs.lumber == this.partyResource(LootType.lumber) + 1) {
                    discount = false;
                } else {
                    return false;
                }
            }

            if (costs.metal > this.partyResource(LootType.metal)) {
                if (discount && costs.metal == this.partyResource(LootType.metal) + 1) {
                    discount = false;
                } else {
                    return false;
                }
            }
            if (costs.hide > this.partyResource(LootType.hide)) {
                if (discount && costs.hide == this.partyResource(LootType.hide) + 1) {
                    discount = false;
                } else {
                    return false;
                }
            }
            return true;
        } else if (building.model.level < building.data.upgrades.length + 1) {
            if (costs.prosperity && costs.prosperity > gameManager.prosperityLevel()) {
                return false;
            }

            if ((costs.lumber || 0) > this.partyResource(LootType.lumber)) {
                if (discount && costs.lumber == this.partyResource(LootType.lumber) + 1) {
                    discount = false;
                } else {
                    return false;
                }
            }

            if ((costs.metal || 0) > this.partyResource(LootType.metal)) {
                if (discount && costs.metal == this.partyResource(LootType.metal) + 1) {
                    discount = false;
                } else {
                    return false;
                }
            }

            if ((costs.hide || 0) > this.partyResource(LootType.hide)) {
                if (discount && costs.hide == this.partyResource(LootType.hide) + 1) {
                    discount = false;
                } else {
                    return false;
                }
            }

            const characterGold = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => (figure as Character).progress.gold);

            if (!characterGold.length || (costs.gold || 0) > characterGold.reduce((a, b) => a + b)) {
                return false;
            }

            return true;
        }

        return false;
    }


    partyResource(type: LootType): number {
        return (gameManager.game.party.loot[type] || 0) + (gameManager.game.figures.filter((figure) => figure instanceof Character).length == 0 ? 0 : gameManager.game.figures.filter((figure) => figure instanceof Character).map((character) => (character as Character).progress.loot[type] || 0).reduce((a, b) => a + b));
    }

    upgrade(building: Building, force: boolean = false) {
        if (building.model.level < building.data.upgrades.length + 1) {
            if (this.upgradeable(building) || force) {
                const costs = building.model.level ? building.data.upgrades[building.model.level - 1] : building.data.costs;
                this.dialog.open(BuildingUpgradeDialog, {
                    panelClass: ['dialog'],
                    data: {
                        costs: costs,
                        building: building,
                        action: building.model.level > 0 ? 'upgrade' : 'build',
                        force: force
                    }
                }).closed.subscribe({
                    next: (result) => {
                        if (force && result == true || result instanceof SelectResourceResult) {
                            setTimeout(() => {
                                gameManager.stateManager.before(building.model.level ? "upgradeBuilding" : "buildBuilding", building.data.id, building.model.name, (building.model.level + 1));
                                if (!force && result instanceof SelectResourceResult) {
                                    gameManager.lootManager.applySelectResources(result);
                                }
                                building.model.level++;
                                if (gameManager.game.party.campaignMode && settingsManager.settings.applyBuildingRewards && building.data.rewards && building.data.rewards[building.model.level - 1]) {
                                    const rewards = building.data.rewards[building.model.level - 1];
                                    gameManager.buildingsManager.applyRewards(rewards);
                                    if (rewards.section) {
                                        this.openConclusion(rewards.section);
                                    }
                                }
                                gameManager.stateManager.after();
                            }, 1)
                        }
                    }
                })
            }
        }
    }

    openConclusion(index: string) {
        const conclusion = gameManager.sectionData(gameManager.currentEdition()).find((sectionData) => sectionData.index == index);
        if (conclusion) {
            const scenario = new Scenario(conclusion as ScenarioData);
            if (this.hasConclusions(scenario.index)) {
                this.openConclusions(scenario.index);
            } else {
                this.dialog.open(ScenarioSummaryComponent, {
                    panelClass: ['dialog'],
                    data: {
                        scenario: scenario,
                        conclusionOnly: true
                    }
                })
            }
        }
    }

    hasConclusions(section: string): boolean {
        const conclusions = gameManager.sectionData(gameManager.game.edition).filter((sectionData) => sectionData.conclusion && !sectionData.parent && sectionData.parentSections && sectionData.parentSections.find((parentSections) => parentSections.length == 1 && parentSections.indexOf(section) != -1));
        return conclusions.length > 0 && conclusions.every((conclusion) => !gameManager.game.party.conclusions.find((model) => model.edition == conclusion.edition && model.index == conclusion.index && model.group == conclusion.group));
    }

    openConclusions(section: string) {
        let conclusions: ScenarioData[] = gameManager.sectionData(gameManager.game.edition).filter((sectionData) => sectionData.conclusion && !sectionData.parent && sectionData.parentSections && sectionData.parentSections.find((parentSections) => parentSections.length == 1 && parentSections.indexOf(section) != -1) && gameManager.scenarioManager.getRequirements(sectionData).length == 0).map((conclusion) => {
            return conclusion;
        });

        if (conclusions.length > 0) {
            this.dialog.open(ScenarioConclusionComponent, {
                panelClass: ['dialog'],
                data: { conclusions: conclusions, parent: gameManager.sectionData(gameManager.game.edition).find((sectionData) => sectionData.index == section && !sectionData.group) }
            }).closed.subscribe({
                next: (conclusion) => {
                    if (conclusion) {
                        const scenario = new Scenario(conclusion as ScenarioData);
                        this.openConclusion(scenario.index);
                    }
                }
            });
        }
    }

    rebuild(building: Building, force: boolean = false) {
        if (building.model.state == 'wrecked') {
            if (this.upgradeable(building) || force) {
                this.dialog.open(BuildingUpgradeDialog, {
                    panelClass: ['dialog'],
                    data: {
                        costs: building.data.rebuild[building.model.level - 1],
                        building: building,
                        action: 'rebuild',
                        force: force
                    }
                }).closed.subscribe({
                    next: (result) => {
                        if (force && result == true || result instanceof SelectResourceResult) {
                            gameManager.stateManager.before("rebuildBuilding", building.data.id, building.model.name);
                            if (!force && result instanceof SelectResourceResult) {
                                gameManager.lootManager.applySelectResources(result);
                            }
                            building.model.state = 'normal';
                            gameManager.stateManager.after();
                        }
                    }
                })
            }
        }
    }

    repair(building: Building, force: boolean = false) {
        if (building.model.state == 'damaged') {
            if (this.upgradeable(building) || force) {
                this.dialog.open(BuildingUpgradeDialog, {
                    panelClass: ['dialog'],
                    data: {
                        repair: building.data.repair && building.data.repair[building.model.level - 1],
                        building: building,
                        action: 'repair',
                        force: force
                    }
                }).closed.subscribe({
                    next: (result) => {
                        if (force && result == true || result instanceof SelectResourceResult) {
                            gameManager.stateManager.before("repairBuilding", building.data.id, building.data.name);
                            if (!force && result instanceof SelectResourceResult) {
                                if (result.morale) {
                                    gameManager.game.party.morale -= result.morale;
                                    if (gameManager.game.party.morale < 0) {
                                        gameManager.game.party.morale = 0;
                                    }
                                } else {
                                    gameManager.lootManager.applySelectResources(result);
                                }
                            }
                            building.model.state = 'normal';
                            gameManager.stateManager.after();
                        }
                    }
                })
            }
        }
    }

    rewardsDialog(building: Building) {
        if (building.data.rewards && building.data.rewards[building.model.level - 1]) {
            const rewards = building.data.rewards[building.model.level - 1];
            if (rewards.defense || rewards.items || rewards.loseMorale || rewards.plots || rewards.prosperity || rewards.section || rewards.soldiers) {
                this.dialog.open(BuildingUpgradeDialog, {
                    panelClass: ['dialog'],
                    data: {
                        building: building,
                        action: 'rewards'
                    }
                })
            }
        }
    }

    toggleState(building: Building, force: boolean = false) {
        if (building.data.repair) {
            if (building.model.level > 0) {
                if (building.model.state == 'normal') {
                    gameManager.stateManager.before("changeBuildingState", building.data.id, building.model.name, 'damaged');
                    building.model.state = 'damaged';
                    gameManager.stateManager.after();
                } else if (building.model.state == 'damaged') {
                    gameManager.stateManager.before("changeBuildingState", building.data.id, building.model.name, 'wrecked');
                    building.model.state = 'wrecked'
                    gameManager.stateManager.after();
                } else if (force && building.model.state == 'wrecked') {
                    gameManager.stateManager.before("changeBuildingState", building.data.id, building.model.name, 'normal');
                    building.model.state = 'normal';
                    gameManager.stateManager.after();
                }
            }
        }
    }

    downgrade(building: Building, force: boolean = false) {
        const index = gameManager.game.party.buildings.indexOf(building.model);
        if (index != -1) {
            if (!gameManager.buildingsManager.initialBuilding(building.data) && !gameManager.buildingsManager.availableBuilding(building.data) && (building.model.level == 0 || force)) {
                gameManager.stateManager.before("removeBuilding", building.data.id, building.model.name);
                building.model.state = 'normal';
                gameManager.game.party.buildings.splice(index, 1);
                if (gameManager.game.party.campaignMode && building.data.rewards && building.data.rewards[0] && building.data.rewards[0].section) {
                    const section = gameManager.sectionData(gameManager.currentEdition()).find((sectionData) => sectionData.index == building.data.rewards[0].section);
                    if (section) {
                        const conclusion = gameManager.buildingsManager.rewardSection(section);
                        if (conclusion) {
                            gameManager.game.party.conclusions = gameManager.game.party.conclusions.filter((model) => model.edition != conclusion.edition || model.group != conclusion.group || model.index != conclusion.index);
                        }
                    }
                }

                gameManager.stateManager.after();
            } else if (!gameManager.buildingsManager.initialBuilding(building.data) && !gameManager.buildingsManager.availableBuilding(building.data) || building.model.level > 1) {
                gameManager.stateManager.before("downgradeBuilding", building.data.id, building.model.name, (building.model.level - 1));
                building.model.level--;
                if (building.model.level == 0) {
                    building.model.state = 'normal';
                }
                if (gameManager.game.party.campaignMode && building.data.rewards && building.data.rewards[building.model.level] && building.data.rewards[building.model.level].section) {
                    const section = gameManager.sectionData(gameManager.currentEdition()).find((sectionData) => sectionData.index == building.data.rewards[building.model.level].section);
                    if (section) {
                        const conclusion = gameManager.buildingsManager.rewardSection(section);
                        if (conclusion) {
                            gameManager.game.party.conclusions = gameManager.game.party.conclusions.filter((model) => model.edition != conclusion.edition || model.group != conclusion.group || model.index != conclusion.index);
                        }
                    }
                }
                gameManager.stateManager.after();
            }
            this.change.emit();
        }
    }

    openStables() {
        this.dialog.open(StablesComponent, {
            panelClass: ['dialog']
        })
    }

    openGarden() {
        this.dialog.open(GardenComponent, {
            panelClass: ['dialog']
        })
    }
}