import { ObjectiveData } from "./data/ObjectiveData";
import { ScenarioData } from "./data/ScenarioData";

export class Scenario extends ScenarioData {

  custom: boolean;

  constructor(name: string, index: number, monsters: string[], objectives: ObjectiveData[], edition: string,
    spoiler: boolean = false, custom: boolean = false) {
    super(name, index, monsters, objectives, edition, spoiler);
    this.custom = custom;
  }
}