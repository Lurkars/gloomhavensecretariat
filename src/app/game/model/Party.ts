import { GameScenarioModel } from "./data/ScenarioData";

export class Party {

  name: string = "";
  location: string = "";
  notes: string = "";
  achievements: string = "";
  reputation: number = 0;
  prosperity: number = 0;
  scenarios: GameScenarioModel[] = [];
  manualScenarios: GameScenarioModel[] = [];
  campaignMode : boolean = false;
  globalAchievements: string = "";

}