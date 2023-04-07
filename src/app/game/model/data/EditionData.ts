import { Editional } from "./Editional";
import { CharacterData } from "./CharacterData";
import { ScenarioData } from "./ScenarioData";
import { MonsterData } from "./MonsterData";
import { DeckData } from "./DeckData";
import { ItemData } from "./ItemData";
import { Perk } from "./Perks";
import { BuildingData } from "./BuildingData";

export const GH_PROSPERITY_STEPS = [3, 8, 14, 21, 29, 38, 49, 63];
export const FH_PROSPERITY_STEPS = [5, 14, 26, 41, 59, 80, 104, 131];

export class EditionData implements Editional {
  // from Editional
  edition: string;

  characters: CharacterData[];
  monsters: MonsterData[];
  decks: DeckData[];
  scenarios: ScenarioData[];
  sections: ScenarioData[];
  items: ItemData[];
  conditions: string[] = [];
  label: any = {};
  labelSpoiler: any = {};
  url: string = "";
  logoUrl: string = "";
  additional: boolean = false;
  extensions: string[] = [];
  newAmStyle: boolean = false;
  campaign: CampaignData | undefined;
  treasures: string[] = [];
  treasureOffset: number = 0;

  constructor(edition: string, characters: CharacterData[],
    monsters: MonsterData[],
    decks: DeckData[],
    scenarios: ScenarioData[],
    sections: ScenarioData[],
    items: ItemData[],
    conditions: string[] | undefined = undefined,
    additional: boolean = false,
    extensions: string[] = []) {
    this.edition = edition;
    this.characters = characters;
    this.monsters = monsters;
    this.decks = decks;
    this.scenarios = scenarios;
    this.sections = sections;
    this.items = items;
    if (conditions) {
      this.conditions = conditions;
    }
    this.additional = additional;
    this.extensions = extensions;
  }

}

export class CampaignData {

  campaignStickers: string[] = [];
  buildings: BuildingData[] = [];
  highMorale: string = "";
  lowMorale: string = "";
  lootSpecial1Sections: string[] = [];
  lootSpecial2Sections: string[] = [];
  townGuardPerks: TownGuardPerk[] = [];
  weeks: Partial<Record<number, string[]>> = {};

}

export type TownGuardPerk = { "sections": string[], "perk": Perk };