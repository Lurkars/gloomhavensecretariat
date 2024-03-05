import { Editional } from "./Editional";

export class BuildingData implements Editional {
    id: string = "";
    name: string = "";
    costs: BuildingCosts = { "prosperity": 0, "lumber": 0, "metal": 0, "hide": 0, "gold": 0 };
    upgrades: BuildingCosts[] = [];
    manualUpgrades: number = 0;
    repair: number[] | undefined = undefined;
    rebuild: BuildingCosts[] = [];
    effectNormal: string[] = [];
    effectWrecked: string[] = [];
    interactionsAvailable: string[] = [];
    interactionsUnavailable: string[] = [];
    requires: string = "";
    rewards: BuildingRewards[] = [];
    prosperityUnlock: boolean = false;
    envelope: string | undefined = undefined;

    // from editional
    edition: string = "";
}

export class BuildingRewards {
    prosperity: number = 0;
    loseMorale: number = 0;
    section: string = "";
    items: string = "";
    soldiers: number = 0;
    plots: number = 0;
    defense: number = 0;
    errata: string = "";
}

export type BuildingCostType = "prosperity" | "lumber" | "metal" | "hide" | "gold";

export type BuildingCosts = Record<BuildingCostType, number>;

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