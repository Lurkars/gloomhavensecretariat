import { Editional } from "../Editional";
import { CharacterData } from "./CharacterData";
import { ScenarioData } from "./ScenarioData";
import { MonsterData } from "./MonsterData";
import { Condition } from "../Condition";
import { DeckData } from "./DeckData";
import { SectionData } from "./SectionData";

export class EditionData implements Editional {
  // from Editional
  edition: string;

  characters: CharacterData[];
  monsters: MonsterData[];
  decks: DeckData[];
  scenarios: ScenarioData[];
  sections: SectionData[];
  conditions: Condition[] = [];
  label: any = {};
  url: string = "";
  extentions: string[] = [];

  constructor(edition: string, characters: CharacterData[],
    monsters: MonsterData[],
    decks: DeckData[],
    scenarios: ScenarioData[],
    sections: SectionData[],
    conditions: Condition[] | undefined = undefined,
    extentions: string[] = []) {
    this.edition = edition;
    this.characters = characters;
    this.monsters = monsters;
    this.decks = decks;
    this.scenarios = scenarios;
    this.sections = sections;
    if (conditions) {
      this.conditions = conditions;
    }
    this.extentions = extentions;
  }

}