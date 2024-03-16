import { ElementModel } from "./Element";
import { AdditionalIdentifier } from "./Identifier";
import { ObjectiveData } from "./ObjectiveData";
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
  noteTop: string = "";
  rooms: number[] = [];
  sections: string[] = [];
  figures: ScenarioFigureRule[] = [];
  spawns: MonsterSpawnData[] = [];
  objectiveSpawns: ObjectiveSpawnData[] = [];
  elements: ElementModel[] = [];
  disableRules: ScenarioRuleIdentifier[] = [];
  treasures: number | string | ('G' | number)[] = [];
  randomDungeon: RandomDungeonRule | undefined;
  finish: "won" | "lost" | "round" | undefined = undefined;

  constructor(round: string) {
    this.round = round;
  }
}

export class MonsterSpawnData {

  monster: MonsterStandeeData;
  count: string | number;
  marker: string;
  summon: boolean;
  manual: boolean;
  manualMin: number;
  manualMax: number;

  constructor(monsterSpawnData: MonsterSpawnData | MonsterStandeeData) {
    if (monsterSpawnData instanceof MonsterSpawnData) {
      this.monster = monsterSpawnData.monster as MonsterStandeeData;
      this.count = monsterSpawnData.count || "";
      this.marker = monsterSpawnData.marker || "";
      this.summon = monsterSpawnData.summon || false;
      this.manual = monsterSpawnData.manual || false;
      this.manualMin = monsterSpawnData.manualMin || 0;
      this.manualMax = monsterSpawnData.manualMax || 0;
    } else {
      this.monster = monsterSpawnData;
      this.count = "";
      this.marker = "";
      this.summon = false;
      this.manual = false;
      this.manualMin = 0;
      this.manualMax = 0;

    }
  }

}

export class ObjectiveSpawnData {

  objective: ObjectiveData;
  count: string | number;
  marker: string;
  summon: boolean;
  manual: boolean;
  manualMin: number;
  manualMax: number;

  constructor(objectiveSpawnData: ObjectiveSpawnData) {
    this.objective = objectiveSpawnData.objective;
    this.count = objectiveSpawnData.count || "";
    this.marker = objectiveSpawnData.marker || "";
    this.summon = objectiveSpawnData.summon || false;
    this.manual = objectiveSpawnData.manual || false;
    this.manualMin = objectiveSpawnData.manualMin || 0;
    this.manualMax = objectiveSpawnData.manualMax || 0;
  }

}

export class ScenarioFigureRule {

  identifier: ScenarioFigureRuleIdentifier | undefined = undefined;
  identifierRef: number | undefined = undefined;
  type: ScenarioFigureRuleTypes = "present";
  value: string = "";
  scenarioEffect: boolean = false;

}

export class RandomDungeonRule {
  monsterCount: number = 3;
  monsterCards: string[] | undefined;
  dungeonCount: number = 3;
  dungeonCards: string[] | undefined;
  initial: boolean = true;
}

export type ScenarioFigureRuleTypes = "present" | "dead" | "killed" | "initiative" | "gainCondition" | "loseCondition" | "permanentCondition" | "damage" | "setHp" | "heal" | "discard" | "toggleOff" | "toggleOn" | "transfer" | "remove" | "removeEntity" | "amAdd" | "amRemove" | "setAbility" | "drawAbility" | "discardAbilityToBottom" | "dormant" | "activate";

export const HiddenScenarioFigureRuleTypes: ScenarioFigureRuleTypes[] = ["present", "dead", "killed", "initiative"];

export class ScenarioFigureRuleIdentifier extends AdditionalIdentifier {

  hp: string | undefined;
  health: string | undefined;
  conditions: string[] | undefined;

}

export class ScenarioRuleIdentifier {
  edition: string = "";
  scenario: string = "";
  group: string | undefined;
  index: number = -1;
  section: boolean = false;
};