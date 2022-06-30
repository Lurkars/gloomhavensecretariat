import { Editional } from "../Editional";
import { Spoilable } from "../Spoilable";
import { ObjectiveData } from "./ObjectiveData";

export class ScenarioData implements Editional, Spoilable {

  name: string;
  index: number;
  monsters: string[];
  objectives: ObjectiveData[];

  // from Editional
  edition: string;

  // from Spoilable
  spoiler: boolean;

  constructor(name: string, index: number, monsters: string[], objectives: ObjectiveData[], edition: string,
    spoiler: boolean = false) {
    this.name = name;
    this.index = index;
    this.monsters = monsters;
    this.edition = edition;
    this.objectives = objectives;
    this.spoiler = spoiler;
  }

}