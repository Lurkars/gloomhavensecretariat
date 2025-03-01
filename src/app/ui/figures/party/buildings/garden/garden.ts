import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GardenModel } from "src/app/game/model/Building";
import { Character } from "src/app/game/model/Character";
import { herbResourceLootTypes, LootType } from "src/app/game/model/data/Loot";

@Component({
    standalone: false,

    selector: 'ghs-garden',
    templateUrl: 'garden.html',
    styleUrls: ['./garden.scss'],
})
export class GardenComponent implements OnInit, OnDestroy {

    level: number = 0;
    slots: number = 0;
    garden!: GardenModel;
    herbs: LootType[] = herbResourceLootTypes;
    activeHerb: LootType | undefined;
    disabled: boolean = false;
    resources: Partial<Record<LootType, number>> = {};
    currentResources: number[] = [];
    characters: Character[] = [];
    currentSource: number = -1;
    harvested: boolean = false;

    settingsManager: SettingsManager = settingsManager;

    ngOnInit(): void {
        this.update();
        this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() })
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    update() {
        this.garden = gameManager.game.party.garden || new GardenModel();
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
            if (garden.level > 2 && this.garden.flipped) {
                this.garden.flipped = false;
            }
        }
        this.disabled = gameManager.game.scenario != undefined;
        this.resources = {};
        this.characters = gameManager.game.figures.filter((figure) => (figure instanceof Character)).map((figure) => figure as Character);
        this.herbs.forEach((type) => {
            this.resources[type] = (gameManager.game.party.loot[type] || 0);
            this.characters.forEach((character) => {
                this.resources[type] = (this.resources[type] || 0) + (character.progress.loot[type] || 0);
            })
            if (!this.activeHerb && this.resources[type]) {
                this.activeHerb = type;
            }
        })

        if (this.activeHerb) {
            this.currentResources = [];
            this.currentSource = -1;
            this.characters.forEach((character, index) => {
                if (this.activeHerb) {
                    this.currentResources[index] = (character.progress.loot[this.activeHerb] || 0);
                    if (this.currentResources[index] && this.currentSource == -1) {
                        this.currentSource = index;
                    }
                }
            })
            this.currentResources[this.characters.length] = (gameManager.game.party.loot[this.activeHerb] || 0);
            if (this.currentResources[this.characters.length]) {
                this.currentSource = this.characters.length;
            }
        }
    }

    setActive(herb: LootType, force: boolean = false) {
        if (this.activeHerb == herb || this.resources[herb] || force) {
            if (this.activeHerb == herb) {
                this.activeHerb = undefined;
            } else {
                this.activeHerb = herb;
            }
        }
        this.update();
    }

    selectSource(index: number) {
        if (this.currentResources[index]) {
            this.currentSource = index;
        }
    }

    plantHerb(slot: number, force: boolean = false) {
        if (this.activeHerb && (!this.disabled && (this.level > 2 || !this.garden.flipped) && this.currentSource != -1 && this.currentResources[this.currentSource] || force) && slot >= 0 && slot < this.slots && this.herbs.indexOf(this.activeHerb) != -1 && this.garden.plots[slot] != this.activeHerb) {
            gameManager.stateManager.before('buildings.garden.plant', this.activeHerb, slot);
            this.garden.plots = this.garden.plots || [];
            this.garden.plots[slot] = this.activeHerb;

            if (!force) {
                if (this.currentSource == this.characters.length) {
                    gameManager.game.party.loot[this.activeHerb] = (gameManager.game.party.loot[this.activeHerb] || 1) - 1;
                } else {
                    const char = this.characters[this.currentSource];
                    if (char) {
                        char.progress.loot[this.activeHerb] = (char.progress.loot[this.activeHerb] || 1) - 1;
                    }
                }
            }
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
        if (settingsManager.settings.automaticPassTime) {
            gameManager.stateManager.before('buildings.garden.' + (this.garden.automated ? 'automationOff' : 'automationOn'));
            this.garden.automated = !this.garden.automated;
            gameManager.game.party.garden = Object.assign(new GardenModel(), this.garden);
            gameManager.stateManager.after();
        }
    }

    harvest() {
        gameManager.stateManager.before('buildings.garden.harvest');
        this.garden.plots.forEach((herb) => {
            gameManager.game.party.loot[herb] = (gameManager.game.party.loot[herb] || 0) + 1;
        })
        this.harvested = true;
        this.update();
        gameManager.stateManager.after();
    }

}