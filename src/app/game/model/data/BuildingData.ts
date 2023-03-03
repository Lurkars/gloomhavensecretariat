export class BuildingData {
    name: string = "";
    costs: Record<"prosperity" | "lumber" | "metal" | "hide" | "gold", number> = { "prosperity": 0, "lumber": 0, "metal": 0, "hide": 0, "gold": 0 };
    upgrades: Record<"prosperity" | "lumber" | "metal" | "hide", number>[] = [];
    repair: number[] = [];
    rebuild: Record<"lumber" | "metal" | "hide", number>[] = [];
}

export class BuildingModel {
    name: string = "";
    level: number = 1;
    state: "normal" | "damaged" | "wrecked" = "normal";
}