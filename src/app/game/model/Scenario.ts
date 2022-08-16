import { ScenarioData } from "./data/ScenarioData";

export class Scenario extends ScenarioData {

  custom: boolean;

  constructor(scenearioData: ScenarioData, custom: boolean = false) {
    super(scenearioData.name, scenearioData.index, scenearioData.unlocks, scenearioData.blocks, scenearioData.requires, scenearioData.links, scenearioData.monsters, scenearioData.objectives, scenearioData.edition, scenearioData.group, scenearioData.spoiler);
    this.custom = custom;
  }
  
}