import { ObjectiveData } from "./data/ObjectiveData";
import { ScenarioData } from "./data/ScenarioData";

export class Scenario extends ScenarioData {

  custom: boolean;

  constructor(name: string, index: string, monsters: string[], objectives: ObjectiveData[], edition: string, custom: boolean = false, group: string | undefined = undefined,
    spoiler: boolean = false) {
    super(name, index, monsters, objectives, edition, group, spoiler);
    this.custom = custom;
  }
}