import { AttackModifier } from "./AttackModifier";
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
  disablingRules: ScenarioRuleIdentifier[] = [];
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
  type: "present" | "dead" | "killed" | "gainCondition" | "loseCondition" | "permanentCondition" | "damage" | "setHp" | "heal" | "discard" | "toggleOff" | "toggleOn" | "transfer" | "remove"| "removeEntity" | "amAdd" | "amRemove" | "setAbility" | "dormant" | "activate" = "present";
  value: string = "";
  scenarioEffect: boolean = false;

}

export class ScenarioFigureRuleIdentifier extends AdditionalIdentifier {

  hp: string | undefined;
  health: string | undefined;
  conditions: string[] | undefined;

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
  itemBlueprints: string[] = [];
  randomItemBlueprint: number = 0;
  randomItem: string = "";
  randomItems: string = "";
  morale: number | string = "";
  inspiration: number | string = "";
  resources: { type: LootType, value: number | string }[] = [];
  collectiveResources: { type: LootType, value: number | string }[] = [];
  calendarSection: string[] = [];
  calendarSectionManual: { section: string, hint: string }[] = [];
  townGuardAm: AttackModifier[] = [];
  unlockCharacter: string = "";
  chooseUnlockCharacter: string[] = [];
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
  randomItem: string = "";
  randomItems: string = "";
  morale: string = "";
  inspiration: string = "";
  resources: string[] = [];
  collectiveResources: string[] = [];
  calendarSection: string[] = [];
  townGuardAm: string[] = [];
  unlockCharacter: string = "";
  chooseUnlockCharacter: string[] = [];
}

export class ScenarioRuleIdentifier {
  edition: string = "";
  scenario: string = "";
  group: string | undefined;
  index: number = -1;
  section: boolean = false;
};