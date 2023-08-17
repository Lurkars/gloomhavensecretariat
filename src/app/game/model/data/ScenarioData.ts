import { Editional } from "./Editional";
import { LootDeckConfig } from "./Loot";
import { Spoilable } from "./Spoilable";
import { ObjectiveData } from "./ObjectiveData";
import { RoomData } from "./RoomData";
import { ScenarioRewards, ScenarioRule } from "./ScenarioRule";
import { GameScenarioModel } from "../Scenario";
import { Identifier } from "./Identifier";

export class ScenarioData implements Editional, Spoilable {

  name: string = "";
  index: string = "";
  gridLocation: string | undefined = "";
  coordinates: { x: number, y: number, width: number, height: number } | undefined;
  unlocks: string[] = [];
  blocks: string[] = [];
  requires: string[][] = [];
  requirements: ScenarioRequirement[] = [];
  links: string[] = [];
  forcedLinks: string[] = [];
  group: string | undefined;
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
  resetRound: "visible" | "hidden" | undefined;
  rewards: ScenarioRewards | undefined;
  conclusion: boolean = false;
  named: boolean = false;
  hideIndex: boolean = false;
  complexity: number = 0;

  // from Editional
  edition: string = "";

  // from Spoilable
  spoiler: boolean = false;

  constructor(scenarioData: ScenarioData | undefined = undefined) {
    if (scenarioData) {
      this.name = scenarioData.name;
      this.index = scenarioData.index;
      this.gridLocation = scenarioData.gridLocation;
      this.unlocks = scenarioData.unlocks;
      this.blocks = scenarioData.blocks;
      this.requires = scenarioData.requires;
      this.requirements = scenarioData.requirements || [];
      this.links = scenarioData.links;
      this.forcedLinks = scenarioData.forcedLinks;
      this.group = scenarioData.group;
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
      this.conclusion = scenarioData.conclusion;
      this.edition = scenarioData.edition;
      this.spoiler = scenarioData.spoiler;
      this.named = scenarioData.named;
      this.hideIndex = scenarioData.hideIndex;
      this.complexity = scenarioData.complexity;
    }
  }
}

export class ScenarioRequirement {

  global: string[] | undefined;
  party: string[] | undefined;
  buildings: string[] | undefined;
  campaignSticker: string[] | undefined;
  puzzle: string[] | undefined;
  solo: string | undefined;

}

export class ScenarioFinish {

  conclusion: GameScenarioModel | undefined;
  success: boolean = false;
  battleGoals: number[] = [];
  collectiveGold: number[] = [];
  items: number[][] = [];
  chooseLocation: string | undefined;
  chooseUnlockCharacter: string | undefined;
  challenges: number = 0;
  calenderSectionManual: number[] = [];
  randomItem: Identifier | undefined = undefined;
  randomItemIndex: number = -1;
  randomItems: (Identifier | undefined)[] = [];
  randomItemBlueprints: number[] = [];

}