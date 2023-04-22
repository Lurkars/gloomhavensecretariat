export class BuildingData {
    id: string = "";
    name: string = "";
    costs: BuildingCosts = { "prosperity": 0, "lumber": 0, "metal": 0, "hide": 0, "gold": 0 };
    upgrades: BuildingCosts[] = [];
    manualUpgrades: number = 0;
    repair: number[] | undefined = undefined;
    rebuild: BuildingCosts[] = [];
    requires: string = "";
    prosperityUnlock: boolean = false;
}

export type BuildingCosts = Record<"prosperity" | "lumber" | "metal" | "hide" | "gold", number>;

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