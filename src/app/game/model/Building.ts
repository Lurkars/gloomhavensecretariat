import { LootType } from "./data/Loot";

export class BuildingModel {
    name: string;
    level: number;
    state: "normal" | "damaged" | "wrecked";

    constructor(name: string = "", level: number = 1, state: "normal" | "damaged" | "wrecked" = "normal") {
        this.name = name;
        this.level = level;
        this.state = state;
    }
}


export class GardenModel {

    flipped: boolean = false;
    automated: boolean = true;
    plots: LootType[] = [];

}