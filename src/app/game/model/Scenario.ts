import { GameScenarioModel, ScenarioData } from "./data/ScenarioData";

export class Scenario extends ScenarioData {

  custom: boolean;

  constructor(scenarioData: ScenarioData, custom: boolean = false) {
    super(scenarioData.name, scenarioData.index, scenarioData.unlocks, scenarioData.blocks, scenarioData.requires, scenarioData.links, scenarioData.monsters, scenarioData.allies, scenarioData.objectives, scenarioData.edition, scenarioData.group, scenarioData.spoiler);
    this.custom = custom;
  }

  override toModel(): GameScenarioModel {
    return new GameScenarioModel(this.index, this.edition, this.group, this.custom ? this.name : "");
  }
}