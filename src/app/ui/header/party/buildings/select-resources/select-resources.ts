import { DIALOG_DATA, DialogRef, } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { BuildingCostType, BuildingCosts, BuildingData } from "src/app/game/model/data/BuildingData";
import { LootType } from "src/app/game/model/data/Loot";

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
    selector: 'ghs-select-resources',
    templateUrl: 'select-resources.html',
    styleUrls: ['./select-resources.scss']
})
export class SelectResourcesDialog {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    costs: BuildingCosts;
    repair: number;
    characters: Character[] = [];
    characterSpent: BuildingCosts[] = [];
    fhSupportSpent: BuildingCosts = { "gold": 0, "hide": 0, "lumber": 0, "metal": 0, "prosperity": 0 };
    spent: BuildingCosts = { "gold": 0, "hide": 0, "lumber": 0, "metal": 0, "prosperity": 0 };
    paid: number = 0;

    constructor(@Inject(DIALOG_DATA) public data: { costs: BuildingCosts, repair: number, building: BuildingData, action: string }, private dialogRef: DialogRef) {
        this.repair = data.repair || 0;
        if (!this.repair) {
            this.costs = data.costs;
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

        } else {
            this.costs = { "gold": 0, "hide": this.repair, "lumber": this.repair, "metal": this.repair, "prosperity": 0 }
        }
        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character);
        this.characters.forEach((character, index) => {
            this.characterSpent[index] = { "gold": 0, "hide": 0, "lumber": 0, "metal": 0, "prosperity": 0 };
        })
    }

    changeValue(type: BuildingCostType, spent: BuildingCosts, value: number) {
        spent[type] += value;
        this.spent[type] += value;
        this.paid += value;
    }

    confirm() {
        if (!this.repair && this.costs.gold == this.spent.gold && this.costs.hide == this.spent.hide && this.costs.lumber == this.spent.lumber && this.costs.metal == this.spent.metal || this.repair && this.paid == this.repair) {
            this.dialogRef.close(new SelectResourceResult(this.characters, this.characterSpent, this.fhSupportSpent));
        }
    }

    close() {
        this.dialogRef.close();
    }

}