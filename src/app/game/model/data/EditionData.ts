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
    this.extensions = extensions;
  }

}

export class CampaignData {

  weekEvents: Partial<Record<number, string[]>> = {};
  townGuardPerks: TownGuardPerk[] = [];
  lowMorale: string = "";
  highMorale: string = "";

}

export type TownGuardPerk = { "sections": string[], "perk": Perk };