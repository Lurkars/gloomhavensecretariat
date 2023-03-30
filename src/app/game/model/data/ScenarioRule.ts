import { ElementModel } from "../Element";
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
  elements: ElementModel[] = [];
  disableRules: ScenarioRuleIdentifier[] = [];
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

  constructor(monster: MonsterStandeeData) {
    this.monster = monster;
  }

}

export class ScenarioFigureRule {

  identifier: FigureIdentifier = undefined;
  type: "present" | "dead" | "gainCondition" | "looseCondition" | "damage" | "hp" | "discard" | "toggleOff" | "toggleOn" | "transfer" | "remove" | "amAdd" | "amRemove" = "present";
  value: string = "";
  scenarioEffect: boolean = false;

}

export class ScenarioRewards {

  globalAchievements: string[] = [];
  partyAchievements: string[] = [];
  lostPartyAchievements: string[] = [];
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
  itemDesigns: string[] = [];
  events: string[] = [];
  custom: string = "";
  ignoredBonus: string[] = [];
  hints: ScenarioRewardHints | undefined = undefined;

}


export class ScenarioRewardHints {
  globalAchievements: string[] = [];
  partyAchievements: string[] = [];
  lostPartyAchievements: string[] = [];
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
  itemDesigns: string[] = [];
  events: string[] = [];
}

export class ScenarioRuleIdentifier {
  edition: string = "";
  scenario: string = "";
  group: string | undefined;
  index: number = -1;
  section: boolean = false;
};

export type FigureIdentifier = { "type": string, "edition": string, "name": string, "marker": string | undefined, "tag": string | undefined } | undefined;
