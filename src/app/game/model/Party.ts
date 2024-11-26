import { GameAttackModifierDeckModel } from "./data/AttackModifier";
import { GameCharacterModel } from "./Character";
import { BuildingModel, GardenModel } from "./Building";
import { CountIdentifier, Identifier } from "./data/Identifier";
import { Loot, LootType } from "./data/Loot";
import { GameScenarioModel } from "./Scenario";
import { ConditionName } from "./data/Condition";
import { PetIdentifier } from "./data/PetCard";

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
  availableCharacters: GameCharacterModel[] = [];
  retirements: GameCharacterModel[] = [];
  unlockedItems: CountIdentifier[] = [];
  unlockedCharacters: string[] = [];
  level: number = 1;
  levelCalculation: boolean = true;
  levelAdjustment: number = 0;
  bonusAdjustment: number = 0;
  ge5Player: boolean = true;
  playerCount: number = -1;
  solo: boolean = false;
  envelopeB: boolean = false;

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
  pets: PetIdentifier[] = [];

  lootDeckEnhancements: Loot[] = [];
  lootDeckFixed: LootType[] = [];
  lootDeckSections: string[] = [];

  trials: number = -1;
  garden: GardenModel | undefined;

}