import { DIALOG_DATA, Dialog, DialogRef, } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { BuildingCostType, BuildingCosts, BuildingRewards } from "src/app/game/model/data/BuildingData";
import { LootType } from "src/app/game/model/data/Loot";
import { Building } from "../buildings";
import { ScenarioSummaryComponent } from "src/app/ui/footer/scenario/summary/scenario-summary";
import { Scenario } from "src/app/game/model/Scenario";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";

export class SelectResourceResult {
    characters: Character[];
    characterSpent: BuildingCosts[];
    fhSupportSpent: BuildingCosts;

    constructor(characters: Character[], characterSpent: BuildingCosts[], fhSupportSpent: BuildingCosts) {
        this.characters = characters;
        this.characterSpent = characterSpent;
        this.fhSupportSpent = fhSupportSpent;
    }
};

@Component({
    selector: 'ghs-buildings-upgrade-dialog',
    templateUrl: 'upgrade-dialog.html',
    styleUrls: ['./upgrade-dialog.scss']
})
export class BuildingUpgradeDialog implements OnInit {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    building: Building;
    action: 'build' | 'upgrade' | 'repait' | 'rebuild' | 'rewards';
    costs: BuildingCosts;
    repair: number;
    force: boolean;
    characters: Character[] = [];
    characterSpent: BuildingCosts[] = [];
    fhSupportSpent: BuildingCosts = { "gold": 0, "hide": 0, "lumber": 0, "metal": 0, "prosperity": 0 };
    spent: BuildingCosts = { "gold": 0, "hide": 0, "lumber": 0, "metal": 0, "prosperity": 0 };
    paid: number = 0;
    rewards: BuildingRewards | undefined;
    rewardsOnly: boolean;

    constructor(@Inject(DIALOG_DATA) public data: { costs: BuildingCosts | undefined, repair: number, building: Building, action: 'build' | 'upgrade' | 'repait' | 'rebuild' | 'rewards', force: boolean }, private dialogRef: DialogRef, private dialog: Dialog) {
        this.repair = data.repair || 0;
        this.building = data.building;
        this.action = data.action;
        this.force = data.force || false;
        this.rewardsOnly = this.action == 'rewards';
        if (!this.repair) {
            this.costs = data.costs || { gold: 0, hide: 0, lumber: 0, metal: 0, prosperity: 0 };
            this.costs.gold = this.costs.gold || 0;
            this.costs.hide = this.costs.hide || 0;
            this.costs.lumber = this.costs.lumber || 0;
            this.costs.metal = this.costs.metal || 0;

            this.fhSupportSpent.hide = this.costs.hide;
            if (this.fhSupportSpent.hide > (gameManager.game.party.loot[LootType.hide] || 0)) {
                this.fhSupportSpent.hide = (gameManager.game.party.loot[LootType.hide] || 0);
            }
            this.spent[LootType.hide] = this.fhSupportSpent.hide;
            this.fhSupportSpent.lumber = this.costs.lumber;
            if (this.fhSupportSpent.lumber > (gameManager.game.party.loot[LootType.lumber] || 0)) {
                this.fhSupportSpent.lumber = (gameManager.game.party.loot[LootType.lumber] || 0);
            }
            this.spent[LootType.lumber] = this.fhSupportSpent.lumber;
            this.fhSupportSpent.metal = this.costs.metal;
            if (this.fhSupportSpent.metal > (gameManager.game.party.loot[LootType.metal] || 0)) {
                this.fhSupportSpent.metal = (gameManager.game.party.loot[LootType.metal] || 0);
            }
            this.spent[LootType.metal] = this.fhSupportSpent.metal;

            if ((this.action == 'build' || this.action == 'upgrade') && this.building.data.rewards && this.building.data.rewards[this.building.model.level]) {
                this.rewards = this.building.data.rewards[this.building.model.level];
            } else if (this.action == 'rewards' && this.building.data.rewards && this.building.data.rewards[this.building.model.level - 1]) {
                this.rewards = this.building.data.rewards[this.building.model.level - 1];
            }

        } else {
            this.costs = { "gold": 0, "hide": this.repair, "lumber": this.repair, "metal": this.repair, "prosperity": 0 }
        }
        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character);
        this.characters.forEach((character, index) => {
            this.characterSpent[index] = { "gold": 0, "hide": 0, "lumber": 0, "metal": 0, "prosperity": 0 };
        })
    }

    ngOnInit(): void {
        if (this.force && !settingsManager.settings.applyBuildingRewards) {
            this.dialogRef.close(true);
        }
    }

    changeValue(type: BuildingCostType, spent: BuildingCosts, value: number) {
        spent[type] += value;
        this.spent[type] += value;
        this.paid += value;
    }

    sectionRewards() {
        if (this.rewardsOnly && this.rewards && this.rewards.section) {
            const conclusion = gameManager.sectionData(gameManager.currentEdition()).find((sectionData) => this.rewards && this.rewards.section && sectionData.index == this.rewards.section);
            if (conclusion) {
                const scenario = new Scenario(conclusion as ScenarioData);
                this.close();
                this.dialog.open(ScenarioSummaryComponent, {
                    panelClass: 'dialog',
                    data: {
                        scenario: scenario,
                        success: true,
                        conclusionOnly: true,
                        rewardsOnly: true
                    }
                })
            }
        }
    }

    confirm() {
        if (this.force) {
            this.dialogRef.close(true);
        } else if (!this.repair && this.costs.gold == this.spent.gold && this.costs.hide == this.spent.hide && this.costs.lumber == this.spent.lumber && this.costs.metal == this.spent.metal || this.repair && this.paid == this.repair) {
            this.dialogRef.close(new SelectResourceResult(this.characters, this.characterSpent, this.fhSupportSpent));
        }
    }

    close() {
        this.dialogRef.close();
    }

}