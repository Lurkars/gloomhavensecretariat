import { GameAttackModifierDeckModel } from "./data/AttackModifier";
import { GameCharacterModel } from "./Character";
import { BuildingModel } from "./data/BuildingData";
import { CountIdentifier, Identifier } from "./data/Identifier";
import { LootType } from "./data/Loot";
import { GameScenarioModel } from "./Scenario";
import { ConditionName } from "./data/Condition";

export class Party {

  id: number = 0;
  name: string = "";
  edition: string | undefined;
  conditions: ConditionName[] = [];
  battleGoalEditions: string[] = [];
  filteredBattleGoals: Identifier[] = [];
  location: string = "";
  notes: string = "";
  achievements: string = "";
  achievementsList: string[] = [];
  reputation: number = 0;
  prosperity: number = 0;
  scenarios: GameScenarioModel[] = [];
  conclusions: GameScenarioModel[] = [];
  casualScenarios: GameScenarioModel[] = [];
  manualScenarios: GameScenarioModel[] = [];
  campaignMode: boolean = false;
  globalAchievements: string = "";
  globalAchievementsList: string[] = [];
  treasures: Identifier[] = [];
  donations: number = 0;
  players: string[] = [];
  characters: GameCharacterModel[] = [];
  retirements: GameCharacterModel[] = [];
  unlockedItems: CountIdentifier[] = [];

  weeks: number = 0;
  weekSections: Partial<Record<number, string[]>> = {};
  loot: Partial<Record<LootType, number>> = {};
  randomItemLooted: GameScenarioModel[] = [];
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