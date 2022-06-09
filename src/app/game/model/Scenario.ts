import { ScenarioData } from "./data/ScenarioData";

export class Scenario extends ScenarioData {

  custom: boolean;

  constructor(name: string, index: number, monsters: string[], edition: string,
    spoiler: boolean = false, custom: boolean = false) {
    super(name, index, monsters, edition, spoiler);
    this.custom = custom;
  }
}