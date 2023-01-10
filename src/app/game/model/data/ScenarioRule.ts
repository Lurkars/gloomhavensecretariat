import { ElementModel } from "../Element";
import { MonsterStandeeData } from "./RoomData";

export class ScenarioRule {
  round: string;
  note: string = "";
  start: boolean = false;
  spawns: ScenarioRuleSpawnData[] = [];
  elements: ElementModel[] = [];
  rooms: number[] = [];
  sections: string[] = [];
  finish: "won" | "lost" | undefined = undefined;
  figures: ScenarioRuleFigures[] = [];

  constructor(round: string, note: string = "", start: boolean = false) {
    this.round = round;
    this.note = note;
    this.start = start;
  }
}

export class ScenarioRuleSpawnData {

  monster: MonsterStandeeData;
  count: string = "";
  marker: string = "";
  manual: boolean = false;

  constructor(monster: MonsterStandeeData) {
    this.monster = monster;
  }

}

export class ScenarioRuleFigures {

  identifier: FigureIdentifier = undefined;
  type: "present" | "dead" | "gainCondition" | "looseCondition" | "damage" | "hp" | "toggleOff" | "toggleOn" | "transfer" = "present";
  value: string = "";

}

export type ScenarioRuleIdentifier = { "edition": string, "scenario": string, "group": string | undefined, "index": number, "section": boolean };

export type FigureIdentifier = { "type": string, "edition": string, "name": string } | undefined;