import { Action } from "./Action";
import { ConditionName } from "./Condition";
import { MonsterType } from "./MonsterType";

export class MonsterStat {
  type: MonsterType;
  level: number;
  health: number | string;
  movement: number | string;
  attack: number | string;
  range: number | string;
  actions: Action[];
  immunities: ConditionName[];
  special: Action[][];
  note: string;

  constructor(type: MonsterType,
    level: number,
    health: number | string,
    movement: number | string,
    attack: number | string,
    range: number | string,
    actions: Action[] = [],
    immunities: ConditionName[] = [],
    special: Action[][] = [],
    note: string = ""
  ) {
    this.type = type;
    this.level = level;
    this.health = health;
    this.movement = movement;
    this.attack = attack;
    this.range = range;
    this.actions = actions || [];
    this.immunities = immunities || [];
    this.special = special || [];
    this.note = note;
  }
}

export class MonsterStatEffect {

  health: number | string = 0;
  movement: number | string = 0;
  attack: number | string = 0;
  range: number | string = 0;
  actions: Action[] | undefined = undefined;
  immunities: ConditionName[] | undefined = undefined;
  special: Action[][] = [];
  deck: string | undefined = undefined;
  absolute: boolean = false;
  note: string = "";

}