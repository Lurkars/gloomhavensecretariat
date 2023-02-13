import { Editional } from "../Editional";
import { CharacterData } from "./CharacterData";
import { ScenarioData } from "./ScenarioData";
import { MonsterData } from "./MonsterData";
import { DeckData } from "./DeckData";
import { ItemData } from "./ItemData";
import { Perk } from "../Perks";

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
  additional: boolean = false;
  extensions: string[] = [];
  newAmStyle: boolean = false;
  campaign: CampaignData | undefined;

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
  highMorale: string = "";
  lowMorale: string = "";
  townGuardPerks: TownGuardPerk[] = [];
  weeks: Partial<Record<number, string[]>> = {};

}

export type TownGuardPerk = { "sections": string[], "perk": Perk };