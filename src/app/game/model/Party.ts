import { GameCharacterModel } from "./Character";
import { Identifier } from "./Identifier";
import { LootType } from "./Loot";
import { GameScenarioModel } from "./Scenario";

export class Party {

  id: number = 0;
  name: string = "";
  edition: string | undefined;
  location: string = "";
  notes: string = "";
  achievements: string = "";
  reputation: number = 0;
  prosperity: number = 0;
  scenarios: GameScenarioModel[] = [];
  manualScenarios: GameScenarioModel[] = [];
  campaignMode: boolean = false;
  globalAchievements: string = "";
  treasures: Identifier[] = [];
  donations: number = 0;
  characters: GameCharacterModel[] = [];
  retirements: GameCharacterModel[] = [];

  weeks: number = 0;
  weekSections: Partial<Record<number, string[]>> = {};
  loot: Partial<Record<LootType, number>> = {};
  inspiration: number = 0;
  defense: number = 0;
  soldiers: number = 0;
  morale: number = 0;
  townGuardPerks: number = 0;
  townGuardPerkSections: string[] = [];
  campaignStickers: string[] = [];

}