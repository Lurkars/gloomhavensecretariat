import { Component } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { GardenModel } from "src/app/game/model/Building";
import { Character } from "src/app/game/model/Character";
import { herbResourceLootTypes, LootType } from "src/app/game/model/data/Loot";

@Component({
	standalone: false,

    selector: 'ghs-garden',
    templateUrl: 'garden.html',
    styleUrls: ['./garden.scss'],
})
export class GardenComponent {

    level: number = 0;
    slots: number = 0;
    garden!: GardenModel;
    herbs: LootType[] = herbResourceLootTypes;
    activeHerb: LootType | undefined;
    disabled: boolean = false;
    resources: Partial<Record<LootType, number>> = {};

    constructor() {
        const garden = gameManager.game.party.buildings.find((value) => value.name == 'garden' && value.level);
        if (garden) {
            this.level = garden.level;
            switch (this.level) {
                case 1:
                    this.slots = 1;
                    break;
                case 2:
                case 3:
                    this.slots = 2;
                    break;
                case 4:
                    this.slots = 3;
                    break;
            }
        }
        this.garden = gameManager.game.party.garden || new GardenModel();
        this.disabled = gameManager.game.scenario != undefined;

        this.herbs.forEach((type) => {
            this.resources[type] = (gameManager.game.party.loot[type] || 0);
            gameManager.game.figures.forEach((figure) => {
                if (figure instanceof Character) {
                    this.resources[type] = (this.resources[type] || 0) + (figure.progress.loot[type] || 0);
                }
            })

            if (!this.activeHerb && this.resources[type]) {
                this.activeHerb = type;
            }
        })
    }

    setActive(herb: LootType, force: boolean = false) {
        if (this.activeHerb == herb || this.resources[herb] || force) {
            if (this.activeHerb == herb) {
                this.activeHerb = undefined;
            } else {
                this.activeHerb = herb;
            }
        }
    }

    plantHerb(slot: number, force: boolean = false) {
        if (this.activeHerb && (!this.disabled || force) && slot >= 0 && slot < this.slots && this.herbs.indexOf(this.activeHerb) != -1 && this.garden.plots[slot] != this.activeHerb && (this.level > 2 || !this.garden.flipped)) {
            gameManager.stateManager.before('buildings.garden.plant', this.activeHerb, slot);
            this.garden.plots = this.garden.plots || [];
            this.garden.plots[slot] = this.activeHerb;
            gameManager.game.party.garden = Object.assign(new GardenModel(), this.garden);
            gameManager.stateManager.after();
        }
    }

    flipGarden(force: boolean = false) {
        if ((!this.disabled || force) && this.level && this.level < 3) {
            gameManager.stateManager.before('buildings.garden.' + (this.garden.flipped ? 'flipPlant' : 'flipHarvest'));
            this.garden.flipped = !this.garden.flipped;
            gameManager.game.party.garden = Object.assign(new GardenModel(), this.garden);
            gameManager.stateManager.after();
        }
    }

    toggleAutomation() {
        gameManager.stateManager.before('buildings.garden.' + (this.garden.automated ? 'automationOff' : 'automationOn'));
        this.garden.automated = !this.garden.automated;
        gameManager.game.party.garden = Object.assign(new GardenModel(), this.garden);
        gameManager.stateManager.after();
    }

}