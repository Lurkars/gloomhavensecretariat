import { Character } from "../Character";
import { Editional } from "./Editional";
import { WorldMapCoordinates } from "./WorldMap";

export class BuildingData implements Editional {
    id: string = "";
    name: string = "";
    costs: BuildingCosts = { "prosperity": 0, "lumber": 0, "metal": 0, "hide": 0, "gold": 0, "manual": 0 };
    upgrades: BuildingCosts[] = [];
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
    coordinates: (WorldMapCoordinates | false)[] = [];

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

export type BuildingCostType = "prosperity" | "lumber" | "metal" | "hide" | "gold" | "manual";

export type BuildingCosts = Record<BuildingCostType, number>;

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