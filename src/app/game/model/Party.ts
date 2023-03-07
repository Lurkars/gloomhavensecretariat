import { GameAttackModifierDeckModel } from "./AttackModifier";
import { GameCharacterModel } from "./Character";
import { BuildingModel } from "./data/BuildingData";
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
  achievementsList: string[] = [];
  reputation: number = 0;
  prosperity: number = 0;
  scenarios: GameScenarioModel[] = [];
  conclusions: GameScenarioModel[] = [];
  manualScenarios: GameScenarioModel[] = [];
  campaignMode: boolean = false;
  globalAchievements: string = "";
  globalAchievementsList: string[] = [];
  treasures: Identifier[] = [];
  donations: number = 0;
  characters: GameCharacterModel[] = [];
  retirements: GameCharacterModel[] = [];
  unlockedItems: Identifier[] = [];

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
  townGuardDeck: GameAttackModifierDeckModel | undefined;
  buildings: BuildingModel[] = [];

}