import { Editional } from "../Editional";
import { LootDeckConfig, LootType } from "../Loot";
import { Spoilable } from "../Spoilable";
import { ObjectiveData } from "./ObjectiveData";
import { RoomData } from "./RoomData";

export class ScenarioData implements Editional, Spoilable {

  name: string;
  index: string;
  unlocks: string[];
  blocks: string[];
  requires: string[][];
  links: string[];
  group: string | undefined;
  monsters: string[];
  allies: string[];
  objectives: ObjectiveData[];
  rules: ScenarioRule[];
  initial: boolean = false;
  solo: string | undefined;
  lootDeckConfig: LootDeckConfig = {};
  rooms: RoomData[] = [];

  // from Editional
  edition: string;

  // from Spoilable
  spoiler: boolean;

  constructor(name: string, index: string, unlocks: string[], blocks: string[], requires: string[][], links: string[], monsters: string[], allies: string[], objectives: ObjectiveData[], rules: ScenarioRule[], edition: string, group: string | undefined = undefined,
    spoiler: boolean = false) {
    this.name = name;
    this.index = index;
    this.unlocks = unlocks;
    this.blocks = blocks;
    this.requires = requires;
    this.links = links;
    this.monsters = monsters;
    this.allies = allies;
    this.edition = edition;
    this.objectives = objectives;
    this.rules = rules;
    this.group = group;
    this.spoiler = spoiler;
  }
}

export class ScenarioRule {
  round: string;
  start: boolean = false;

  constructor(round: string) {
    this.round = round;
  }
}

export type ScenarioRuleIdentifier = { "edition": string, "scenario": string, "group": string | undefined, "index": number, "section": boolean };

export class GameScenarioModel {

  index: string;
  edition: string;
  group: string | undefined;
  isCustom: boolean;
  custom: string;

  constructor(index: string,
    edition: string,
    group: string | undefined,
    isCustom: boolean = false,
    custom: string = "") {
    this.index = index;
    this.edition = edition;
    this.group = group;
    this.isCustom = isCustom;
    this.custom = custom;
  }

}