import { Enhancement } from 'src/app/game/model/data/Enhancement';
import { AdditionalIdentifier, Identifier } from 'src/app/game/model/data/Identifier';
import { LootType } from 'src/app/game/model/data/Loot';
import { GameScenarioModel } from 'src/app/game/model/Scenario';

export enum RpgAttribute {
  cunning = 'cunning',
  finesse = 'finesse',
  grit = 'grit',
  intuition = 'intuition',
  logic = 'logic',
  understanding = 'understanding'
}

export class RpgItem {
  equipped: boolean = false;
  slot: string = '';
  name: string = '';
  initiative: string = '';
  effect: string = '';
  spent: boolean = false;
}

export class RpgFaction {
  name: string = '';
  tier: number = -1;
  benefits: string[] = [];
}

export type RpgPowerState = 'expended' | 'lost' | undefined;

export class RpgPower {
  gained: boolean = false;
  prepared: boolean = false;
  name: string = '';
  initiative: string = '';
  bonus: string = '';
  primary: string = '';
  secondary: string = '';
  state: RpgPowerState;
}

export const RPG_ITEM_ROWS = 10;
export const RPG_FACTIONS = 2;
export const RPG_FACTION_BENEFITS = 4;
export const RPG_TALENT_ROWS = 4;
export const RPG_ANCESTRY_SKILL_ROWS = 5;
export const RPG_CLASS_SKILL_ROWS = 12;

export class RpgProgress {
  attributes: Partial<Record<RpgAttribute, number>> = {};
  pronouns: string = '';
  playerName: string = '';
  ancestry: string = '';
  backgrounds: string = '';
  personalGoal: string = '';
  items: RpgItem[] = [];
  factions: RpgFaction[] = [];
  talents: RpgPower[] = [];
  ancestrySkills: RpgPower[] = [];
  classSkills: RpgPower[] = [];
}

export class CharacterProgress {
  experience: number = 0;
  gold: number = 0;
  loot: Partial<Record<LootType, number>> = {};
  itemNotes: string = '';
  items: Identifier[] = [];
  equippedItems: AdditionalIdentifier[] = [];
  personalQuest: string = '';
  personalQuestProgress: number[] = [];
  personalQuestAutotrack: boolean = false;
  battleGoals: number = 0;
  notes: string = '';
  retired: boolean = false;
  retirements: number = 0;
  extraPerks: number = 0;
  perks: number[] = [];
  masteries: number[] = [];
  donations: number = 0;
  scenarioStats: ScenarioStats[] = [];
  trial: Identifier | undefined;
  deck: number[] = [];
  enhancements: Enhancement[] = [];
  rpg: RpgProgress | undefined;
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
