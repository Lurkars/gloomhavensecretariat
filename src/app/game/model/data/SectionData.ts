import { ObjectiveData } from "./ObjectiveData";
import { ScenarioData } from "./ScenarioData";

export class SectionData extends ScenarioData {

  constructor(name: string, index: string, monsters: string[], objectives: ObjectiveData[], edition: string, group: string | undefined = undefined,
    spoiler: boolean = false) {
    super(name, index, [], [], [], [], monsters, objectives, edition, group, spoiler);
  }

}