import { Editional } from "./Editional";
import { LootDeckConfig } from "./Loot";
import { Spoilable } from "./Spoilable";
import { ObjectiveData } from "./ObjectiveData";
import { RoomData } from "./RoomData";
import { ScenarioRewards, ScenarioRule } from "./ScenarioRule";

export class ScenarioData implements Editional, Spoilable {

  name: string = "";
  index: string = "";
  gridLocation: string = "";
  unlocks: string[] = [];
  blocks: string[] = [];
  requires: string[][] = [];
  links: string[] = [];
  forcedLinks: string[] = [];
  group: string | undefined;
  monsters: string[] = [];
  allies: string[] = [];
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
  parentSections: string[] = [];
  blockedSections: string[] = [];
  resetRound: "visible" | "hidden" | undefined;
  rewards: ScenarioRewards | undefined;
  conclusion: boolean = false;

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
      this.links = scenarioData.links;
      this.forcedLinks = scenarioData.forcedLinks;
      this.group = scenarioData.group;
      this.monsters = scenarioData.monsters;
      this.allies = scenarioData.allies;
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
    }
  }
}