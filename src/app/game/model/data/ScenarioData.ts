import { Editional } from "../Editional";
import { Spoilable } from "../Spoilable";

export class ScenarioData implements Editional, Spoilable {

  name: string;
  index: number;
  monsters: string[];

  // from Editional
  edition: string;
  
  // from Spoilable
  spoiler: boolean;

  constructor(name: string, index: number, monsters: string[], edition: string,
    spoiler: boolean = false) {
    this.name = name;
    this.index = index;
    this.monsters = monsters;
    this.edition = edition;
    this.spoiler = spoiler;
  }

}