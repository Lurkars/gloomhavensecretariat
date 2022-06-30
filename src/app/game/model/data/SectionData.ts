import { ObjectiveData } from "./ObjectiveData";
import { ScenarioData } from "./ScenarioData";

export class SectionData extends ScenarioData {

  constructor(name: string, index: number, monsters: string[], objectives: ObjectiveData[], edition: string,
    spoiler: boolean = false) {
    super(name, index, monsters, objectives, edition, spoiler);
  }

}