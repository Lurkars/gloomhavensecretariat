import { AdditionalIdentifier, Identifier } from "./data/Identifier";
import { LootType } from "./data/Loot";
import { GameScenarioModel } from "./Scenario";

export class CharacterProgress {

  experience: number = 0;
  gold: number = 0;
  loot: Partial<Record<LootType, number>> = {};
  itemNotes: string = "";
  items: Identifier[] = [];
  equippedItems: AdditionalIdentifier[] = [];
  personalQuest: string = "";
  personalQuestProgress: number[] = [];
  battleGoals: number = 0;
  notes: string = "";
  retired: boolean = false;
  retirements: number = 0;
  extraPerks: number = 0;
  perks: number[] = [];
  masteries: number[] = [];
  donations: number = 0;
  scenarioStats: ScenarioStats[] = [];
  trial: Identifier | undefined;
  deck: number[] = [];

}

export class DamageStats {
  dealtDamage: number = 0;
  monsterDamage: number = 0;
  otherDamage: number = 0;
  healedDamage: number = 0;
  heals: number = 0;
  normalKills: number = 0;
  eliteKills: number = 0;
  bossKills: number = 0;
  exhausts: number = 0;
  maxDealtDamage: number = 0;
  maxDamage: number = 0;
}

export class ScenarioStats extends DamageStats {

  scenario: GameScenarioModel | undefined;
  success: boolean = false;
  level: number = 0;
  difficulty: number = 0;
  gold: number = 0;
  xp: number = 0;
  treasures: number = 0;
  loot: Partial<Record<LootType, number>> = {};
  summons: DamageStats = new DamageStats();

}