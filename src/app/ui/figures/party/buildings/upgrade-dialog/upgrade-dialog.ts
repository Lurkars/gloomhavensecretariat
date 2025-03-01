import { DIALOG_DATA, Dialog, DialogRef, } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Scenario } from "src/app/game/model/Scenario";
import { BuildingCostType, BuildingCosts, BuildingRewards, SelectResourceResult } from "src/app/game/model/data/BuildingData";
import { LootType } from "src/app/game/model/data/Loot";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { ScenarioConclusionComponent } from "src/app/ui/footer/scenario/scenario-conclusion/scenario-conclusion";
import { ScenarioSummaryComponent } from "src/app/ui/footer/scenario/summary/scenario-summary";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";
import { Building } from "../buildings";



@Component({
	standalone: false,
    selector: 'ghs-buildings-upgrade-dialog',
    templateUrl: 'upgrade-dialog.html',
    styleUrls: ['./upgrade-dialog.scss']
})
export class BuildingUpgradeDialog implements OnInit {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    building: Building | undefined;
    action: 'build' | 'upgrade' | 'repait' | 'rebuild' | 'rewards' | 'soldiers';
    costs: BuildingCosts;
    requiredResources: number;
    paidResources: number = 0;
    repair: number;
    force: boolean;
    characters: Character[] = [];
    characterSpent: BuildingCosts[] = [];
    fhSupportSpent: BuildingCosts = { "gold": 0, "hide": 0, "lumber": 0, "metal": 0, "prosperity": 0, "manual": 0 };
    spent: BuildingCosts = { "gold": 0, "hide": 0, "lumber": 0, "metal": 0, "prosperity": 0, "manual": 0 };
    rewards: BuildingRewards | undefined;
    rewardsOnly: boolean;
    discount: boolean;

    constructor(@Inject(DIALOG_DATA) public data: { costs: BuildingCosts | undefined, repair: number, building: Building | undefined, action: 'build' | 'upgrade' | 'repait' | 'rebuild' | 'rewards' | 'soldiers', force: boolean }, private dialogRef: DialogRef, private dialog: Dialog) {
        this.repair = data.repair || 0;
        this.requiredResources = this.repair;
        this.building = data.building;
        this.action = data.action;
        this.force = data.force || false;
        this.rewardsOnly = this.action == 'rewards';
        this.discount = gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == "carpenter" && buildingModel.level > 0 && buildingModel.state != 'wrecked') != undefined && !this.repair;
        if (!this.repair && this.building) {
            this.costs = data.costs || { gold: 0, hide: 0, lumber: 0, metal: 0, prosperity: 0, manual: 0 };
            this.costs.gold = this.costs.gold || 0;
            this.costs.hide = this.costs.hide || 0;
            this.costs.lumber = this.costs.lumber || 0;
            this.costs.metal = this.costs.metal || 0;
            this.requiredResources = this.costs.hide + this.costs.lumber + this.costs.metal;

            let discountFree = this.discount;

            // lumber
            this.fhSupportSpent.lumber = this.costs.lumber - (discountFree ? 1 : 0);
            discountFree = false;
            if (this.fhSupportSpent.lumber > (gameManager.game.party.loot[LootType.lumber] || 0)) {
                this.fhSupportSpent.lumber = (gameManager.game.party.loot[LootType.lumber] || 0);
                discountFree = this.discount;
            }
            this.spent[LootType.lumber] = this.fhSupportSpent.lumber;
            this.paidResources += this.fhSupportSpent.lumber;

            // metal
            this.fhSupportSpent.metal = this.costs.metal - (discountFree ? 1 : 0);
            discountFree = false;
            if (this.fhSupportSpent.metal > (gameManager.game.party.loot[LootType.metal] || 0)) {
                this.fhSupportSpent.metal = (gameManager.game.party.loot[LootType.metal] || 0);
                discountFree = this.discount;
            }
            this.spent[LootType.metal] = this.fhSupportSpent.metal;
            this.paidResources += this.fhSupportSpent.metal;

            // hide
            this.fhSupportSpent.hide = this.costs.hide - (discountFree ? 1 : 0);
            discountFree = false;
            if (this.fhSupportSpent.hide > (gameManager.game.party.loot[LootType.hide] || 0)) {
                this.fhSupportSpent.hide = (gameManager.game.party.loot[LootType.hide] || 0);
                discountFree = this.discount;
            }
            this.spent[LootType.hide] = this.fhSupportSpent.hide;
            this.paidResources += this.fhSupportSpent.hide;

            if ((this.action == 'build' || this.action == 'upgrade') && this.building.data.rewards && this.building.data.rewards[this.building.model.level]) {
                this.rewards = this.building.data.rewards[this.building.model.level];
            } else if (this.action == 'rewards' && this.building.data.rewards && this.building.data.rewards[this.building.model.level - 1]) {
                this.rewards = this.building.data.rewards[this.building.model.level - 1];
            }

        } else {
            this.costs = { "gold": data.costs && data.costs.gold || 0, "hide": this.repair, "lumber": this.repair, "metal": this.repair, "prosperity": 0, "manual": 0 }
        }
        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character);
        this.characters.forEach((character, index) => {
            this.characterSpent[index] = { "gold": 0, "hide": 0, "lumber": 0, "metal": 0, "prosperity": 0, "manual": 0 };
        })
    }

    ngOnInit(): void {
        if (this.force && (!settingsManager.settings.applyBuildingRewards || !gameManager.game.party.campaignMode)) {
            this.dialogRef.close(true);
        }
    }

    changeValue(type: BuildingCostType, spent: BuildingCosts, value: number) {
        spent[type] += value;
        this.spent[type] += value;
        if (type != 'gold' && type != 'prosperity') {
            this.paidResources += value;
        }
    }

    sectionRewards(index: string, edition: string = "") {
        const section = gameManager.sectionData(edition || gameManager.currentEdition()).find((sectionData) => sectionData.index == index);
        if (this.rewardsOnly && section) {
            const conclusion = gameManager.buildingsManager.rewardSection(section);
            const conclusions = gameManager.sectionData(section.edition).filter((sectionData) => sectionData.conclusion && !sectionData.parent && sectionData.parentSections && sectionData.parentSections.find((parentSections) => parentSections.length == 1 && parentSections.indexOf(section.index) != -1) && gameManager.scenarioManager.getRequirements(sectionData).length == 0);

            if (conclusion || conclusions.length == 0) {
                const scenario = new Scenario(conclusion || section);
                this.close();
                this.dialog.open(ScenarioSummaryComponent, {
                    panelClass: ['dialog'],
                    data: {
                        scenario: scenario,
                        success: true,
                        conclusionOnly: true,
                        rewardsOnly: conclusion != undefined
                    }
                })
            } else if (conclusions.length > 0) {
                this.dialog.open(ScenarioConclusionComponent, {
                    panelClass: ['dialog'],
                    data: { conclusions: conclusions, parent: section }
                }).closed.subscribe({
                    next: (result) => {
                        if (result) {
                            const conclusionResult = result as ScenarioData;
                            this.sectionRewards(conclusionResult.index, conclusionResult.edition);
                        }
                    }
                });
            }
        }
    }

    confirm() {
        if (this.force) {
            ghsDialogClosingHelper(this.dialogRef, true);
        } else if (this.paidResources >= this.requiredResources - (this.discount ? 1 : 0) && (!this.costs.gold || this.costs.gold == this.spent.gold)) {
            ghsDialogClosingHelper(this.dialogRef, new SelectResourceResult(this.characters, this.characterSpent, this.fhSupportSpent));
        }
    }

    close() {
        ghsDialogClosingHelper(this.dialogRef);
    }

}