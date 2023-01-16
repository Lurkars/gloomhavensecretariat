import { ElementModel } from "../Element";
import { MonsterStandeeData } from "./RoomData";

export class ScenarioRule {
  round: string;
  always: boolean = false;
  note: string = "";
  start: boolean = false;
  spawns: MonsterSpawnData[] = [];
  elements: ElementModel[] = [];
  rooms: number[] = [];
  sections: string[] = [];
  disableRules: ScenarioRuleIdentifier[] = [];
  finish: "won" | "lost" | undefined = undefined;
  figures: ScenarioRuleFigures[] = [];
  requiredRooms: number[] = [];

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
  manual: boolean = false;

  constructor(monster: MonsterStandeeData) {
    this.monster = monster;
  }

}

export class ScenarioRuleFigures {

  identifier: FigureIdentifier = undefined;
  type: "present" | "dead" | "gainCondition" | "looseCondition" | "damage" | "hp" | "toggleOff" | "toggleOn" | "transfer" | "amAdd" | "amRemove" = "present";
  value: string = "";
  scenarioEffect: boolean = false;

}

export type ScenarioRuleIdentifier = { "edition": string, "scenario": string, "group": string | undefined, "index": number, "section": boolean };

export type FigureIdentifier = { "type": string, "edition": string, "name": string, "marker": string | undefined } | undefined;