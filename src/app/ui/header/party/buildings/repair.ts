import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { BuildingData, BuildingModel } from "src/app/game/model/data/BuildingData";
import { LootType } from "src/app/game/model/data/Loot";

@Component({
    selector: 'ghs-building-repair',
    templateUrl: 'repair.html',
    styleUrls: ['./repair.scss']
})
export class BuildingRepairDialog {

    gameManager: GameManager = gameManager;
    lootTypes: LootType[] = Object.values(LootType);
    LootType = LootType;

    loot: Partial<Record<LootType, number>> = {};

    costs: number = -1;
    paid: number = 0;

    constructor(@Inject(DIALOG_DATA) public building: { model: BuildingModel, data: BuildingData }, private dialogRef: DialogRef) {
        if (this.building.data.repair) {
            this.costs = this.building.data.repair[this.building.model.level - 1];
        } else {
            this.close();
        }
    }


    changeLoot(lootType: LootType, value: number) {
        if (!this.loot[lootType]) {
            this.loot[lootType] = 0;
        }
        this.loot[lootType] = (this.loot[lootType] as number) + value;

        if ((this.loot[lootType] as number) < 0) {
            this.loot[lootType] = 0;
        } else if (!gameManager.game.party.loot[lootType] || (this.loot[lootType] as number) > (gameManager.game.party.loot[lootType] as number)) {
            this.loot[lootType] = gameManager.game.party.loot[lootType] || 0;
        }

        this.paid = 0;
        Object.keys(this.loot).forEach((key) => {
            const lootType = key as LootType;
            let value = this.loot[lootType] || 0;
            this.paid += value;
        })

    }

    async repair() {
        if (this.costs == this.paid) {
            await gameManager.stateManager.before("repairBuilding", "data.buildings." + this.building.data.name);
            Object.keys(this.loot).forEach((key) => {
                const lootType = key as LootType;
                let value = this.loot[lootType] || 0;
                gameManager.game.party.loot[lootType] = (gameManager.game.party.loot[lootType] || 0) - value;
            })
            this.building.model.state = 'normal';
            await gameManager.stateManager.after();
            this.close();
        }
    }

    close() {
        this.dialogRef.close();
    }

}