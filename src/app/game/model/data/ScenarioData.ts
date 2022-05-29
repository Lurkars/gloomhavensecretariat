import { Editional } from "../Editional";

export class ScenarioData implements Editional {

  name: string;
  index: number;
  monsters: string[];

  // from Editional
  edition: string;

  constructor(name: string, index : number, monsters: string[], edition: string) {
    this.name = name;
    this.index = index;
    this.monsters = monsters;
    this.edition = edition;
  }

}