import { GameScenarioModel } from "../Scenario";
import { Editional } from "./Editional";
import { Identifier } from "./Identifier";
import { LootDeckConfig, LootType } from "./Loot";
import { ObjectiveData } from "./ObjectiveData";
import { RoomData } from "./RoomData";
import { ScenarioRule } from "./ScenarioRule";
import { Spoilable } from "./Spoilable";
import { WorldMapCoordinates, WorldMapOverlay } from "./WorldMap";

export class ScenarioData implements Editional, Spoilable {

  name: string = "";
  index: string = "";
  errata: string = "";
  coordinates: WorldMapCoordinates | undefined;
  unlocks: string[] = [];
  blocks: string[] = [];
  requires: string[][] = [];
  requirements: ScenarioRequirement[] = [];
  links: string[] = [];
  forcedLinks: string[] = [];
  group: string | undefined;
  flowChartGroup: string | undefined;
  monsters: string[] = [];
  allies: string[] = [];
  allied: string[] = [];
  drawExtra: string[] = [];
  objectives: ObjectiveData[] = [];
  rooms: RoomData[] = [] = [];
  marker: string = "";
  rules: ScenarioRule[] = [];
  initial: boolean = false;
  random: boolean = false;
  solo: string | undefined;
  allyDeck: boolean = false;
  lootDeckConfig: LootDeckConfig = {};
  parent: string | undefined;
  parentSections: string[][] = [];
  blockedSections: string[] = [];
  resetRound: "visible" | "visibleKeep" | "hidden" | "hiddenKeep" | undefined; // "Keep" suffix will reset even rounds to round 2 instead of round 1
  rewards: ScenarioRewards | undefined;
  retirement: string = "";
  conclusion: boolean = false;
  repeatable: boolean = false;
  named: boolean = false;
  hideIndex: boolean = false;
  complexity: number = 0;
  level: number | undefined;

  // from Editional
  edition: string = "";

  // from Spoilable
  spoiler: boolean = false;

  constructor(scenarioData: ScenarioData | undefined = undefined) {
    if (scenarioData) {
      this.name = scenarioData.name;
      this.errata = scenarioData.errata;
      this.index = scenarioData.index;
      this.unlocks = scenarioData.unlocks;
      this.blocks = scenarioData.blocks;
      this.requires = scenarioData.requires;
      this.requirements = scenarioData.requirements || [];
      this.links = scenarioData.links;
      this.forcedLinks = scenarioData.forcedLinks;
      this.group = scenarioData.group;
      this.flowChartGroup = scenarioData.flowChartGroup;
      this.monsters = scenarioData.monsters;
      this.allies = scenarioData.allies;
      this.allied = scenarioData.allied;
      this.drawExtra = scenarioData.drawExtra;
      this.objectives = scenarioData.objectives;
      this.rooms = scenarioData.rooms;
      this.marker = scenarioData.marker;
      this.rules = scenarioData.rules;
      this.initial = scenarioData.initial;
      this.random = scenarioData.random;
      this.solo = scenarioData.solo;
      this.allyDeck = scenarioData.allyDeck;
      this.lootDeckConfig = scenarioData.lootDeckConfig;
      this.parent = scenarioData.parent;
      this.parentSections = scenarioData.parentSections;
      this.blockedSections = scenarioData.blockedSections;
      this.resetRound = scenarioData.resetRound;
      this.rewards = scenarioData.rewards;
      this.retirement = scenarioData.retirement;
      this.conclusion = scenarioData.conclusion;
      this.repeatable = scenarioData.repeatable;
      this.edition = scenarioData.edition;
      this.spoiler = scenarioData.spoiler;
      this.named = scenarioData.named;
      this.hideIndex = scenarioData.hideIndex;
      this.complexity = scenarioData.complexity;
      this.level = scenarioData.level;
    }
  }
}

export class ScenarioRequirement {

  global: string[] | undefined;
  party: string[] | undefined;
  buildings: string[] | undefined;
  campaignSticker: string[] | undefined;
  puzzle: string[] | undefined;
  characters: string[] | undefined;
  scenarios: string[][] | undefined;

}


export class ScenarioRewards {

  globalAchievements: string[] = [];
  partyAchievements: string[] = [];
  lostPartyAchievements: string[] = [];
  campaignSticker: string[] = [];
  envelopes: string[] = [];
  gold: number = 0;
  experience: number = 0;
  collectiveGold: number = 0;
  reputation: number = 0;
  prosperity: number = 0;
  perks: number = 0;
  battleGoals: number = 0;
  items: string[] = [];
  chooseItem: string[][] = [];
  chooseLocation: string[] = [];
  itemDesigns: string[] = [];
  events: string[] = [];
  removeEvents: string[] = [];
  itemBlueprints: string[] = [];
  randomItemBlueprint: number = 0;
  randomItemBlueprints: string = "";
  randomItem: string = "";
  randomItems: string = "";
  morale: number | string = "";
  inspiration: number | string = "";
  resources: { type: LootType, value: number | string }[] = [];
  collectiveResources: { type: LootType, value: number | string }[] = [];
  calendarSection: string[] = [];
  calendarSectionConditional: string[] = [];
  calendarSectionManual: { section: string, hint: string }[] = [];
  calendarIgnore: boolean = false;
  lootDeckCards: number[] = [];
  removeLootDeckCards: number[] = [];
  townGuardAm: string[] = [];
  unlockCharacter: string = "";
  chooseUnlockCharacter: string[] = [];
  lootingGold: number | string | undefined = undefined;
  custom: string = "";
  ignoredBonus: string[] = [];
  overlaySticker: WorldMapOverlay | undefined = undefined;
  overlayCampaignSticker: WorldMapOverlay | undefined = undefined;
  pet: string | undefined = undefined;
  hints: ScenarioRewardHints | undefined = undefined;

}


export class ScenarioRewardHints {
  globalAchievements: string[] = [];
  partyAchievements: string[] = [];
  lostPartyAchievements: string[] = [];
  campaignSticker: string[] = [];
  envelopes: string[] = [];
  gold: string = "";
  experience: string = "";
  collectiveGold: string = "";
  reputation: string = "";
  prosperity: string = "";
  perks: string = "";
  battleGoals: string = "";
  items: string[] = [];
  chooseItem: string[] = [];
  chooseLocation: string[] = [];
  itemDesigns: string[] = [];
  events: string[] = [];
  removeEvents: string[] = [];
  itemBlueprints: string[] = [];
  randomItemBlueprint: string = "";
  randomItem: string = "";
  randomItems: string = "";
  morale: string = "";
  inspiration: string = "";
  resources: string[] = [];
  collectiveResources: string[] = [];
  calendarSection: string[] = [];
  calendarSectionConditional: string[] = [];
  lootDeckCards: string[] = [];
  removeLootDeckCards: string[] = [];
  townGuardAm: string[] = [];
  unlockCharacter: string = "";
  chooseUnlockCharacter: string[] = [];
  overlaySticker: string = "";
  overlayCampaignSticker: string = "";
  pet: string = "";
}

export class ScenarioFinish {

  conclusion: GameScenarioModel | undefined;
  success: boolean = false;
  battleGoals: number[] = [];
  collectiveGold: number[] = [];
  collectiveResources: Partial<Record<LootType, number>>[] = [];
  items: number[][] = [];
  chooseLocation: string | undefined;
  chooseUnlockCharacter: string | undefined;
  challenges: number = 0;
  calendarSectionConditional: boolean[] = [];
  calenderSectionManual: number[] = []; // migration
  calendarSectionManual: number[] = [];
  randomItem: Identifier | undefined = undefined;
  randomItemIndex: number = -1;
  randomItems: (Identifier | undefined)[] = [];
  randomItemBlueprints: number[] = [];
  trials: boolean[] = [];

}