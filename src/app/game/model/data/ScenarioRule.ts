import { ElementModel } from "./Element";
import { AdditionalIdentifier } from "./Identifier";
import { LootType } from "./Loot";
import { MonsterStandeeData } from "./RoomData";

export class ScenarioRule {
  round: string;
  start: boolean = false;
  always: boolean = false;
  once: boolean = false;
  requiredRooms: number[] = [];
  requiredRules: ScenarioRuleIdentifier[] = [];
  note: string = "";
  rooms: number[] = [];
  sections: string[] = [];
  figures: ScenarioFigureRule[] = [];
  spawns: MonsterSpawnData[] = [];
  objectiveSpawns: ObjectiveSpawnData[] = [];
  elements: ElementModel[] = [];
  disableRules: ScenarioRuleIdentifier[] = [];
  treasures: number | string | ('G' | number)[] = [];
  finish: "won" | "lost" | undefined = undefined;

  constructor(round: string, note: string = "", start: boolean = false) {
    this.round = round;
    this.note = note;
    this.start = start;
  }
}

export class MonsterSpawnData {

  monster: MonsterStandeeData;
  count: string | number = "";
  marker: string = "";
  summon: boolean = false;
  manual: boolean = false;
  manualMin: number = 0;
  manualMax: number = 0;

  constructor(monster: MonsterStandeeData) {
    this.monster = monster;
  }

}

export class ObjectiveSpawnData {

  objective: {
    index: number,
    name: string | undefined,
    escort: boolean,
    marker: string | undefined,
    tags: string[] | undefined
  };
  count: string | number = "";
  marker: string = "";
  summon: boolean = false;
  manual: boolean = false;
  manualMin: number = 0;
  manualMax: number = 0;

  constructor(objective: {
    index: number,
    name: string | undefined,
    escort: boolean,
    marker: string | undefined,
    tags: string[] | undefined
  }) {
    this.objective = objective;
  }

}

export class ScenarioFigureRule {

  identifier: ScenarioFigureRuleIdentifier | undefined = undefined;
  identifierRef: number | undefined = undefined;
  type: "present" | "dead" | "killed" | "gainCondition" | "loseCondition" | "permanentCondition" | "damage" | "setHp" | "heal" | "discard" | "toggleOff" | "toggleOn" | "transfer" | "remove" | "amAdd" | "amRemove" = "present";
  value: string = "";
  scenarioEffect: boolean = false;

}

export class ScenarioFigureRuleIdentifier extends AdditionalIdentifier {

  health: string | undefined;

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
  chooseItem: string[] = [];
  chooseLocation: string[] = [];
  itemDesigns: string[] = [];
  events: string[] = [];
  itemBlueprints: string[] = [];
  randomItemBlueprint: number = 0;
  morale: number | string = "";
  inspiration: number | string = "";
  resources: Partial<Record<LootType, number | string>> = {};
  loseResources: Partial<Record<LootType, number | string>> = {};
  collectiveResources: Partial<Record<LootType, number | string>> = {};
  loseCollectiveResources: Partial<Record<LootType, number | string>> = {};
  calenderSection: string[] = [];
  townGuardAm: string[] = []; // TODO
  unlockClass: string = "";
  chooseUnlockClass: string[] = [];
  custom: string = "";
  ignoredBonus: string[] = [];
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
  itemBlueprints: string[] = [];
  randomItemBlueprint: string = "";
  morale: string = "";
  inspiration: string = "";
  resources: Partial<Record<LootType, string>> = {};
  loseResources: Partial<Record<LootType, string>> = {};
  collectiveResources: Partial<Record<LootType, string>> = {};
  loseCollectiveResources: Partial<Record<LootType, string>> = {};
  calenderSection: string[] = [];
  townGuardAm: string[] = [];
  unlockClass: string = "";
  chooseUnlockClass: string[] = [];
}

export class ScenarioRuleIdentifier {
  edition: string = "";
  scenario: string = "";
  group: string | undefined;
  index: number = -1;
  section: boolean = false;
};