import { Action } from "./Action";
import { Condition } from "./Condition";
import { MonsterType } from "./MonsterType";

export class MonsterStat {
  type: MonsterType;
  level: number;
  health: number | string;
  movement: number;
  attack: number | string;
  range: number;
  conditions: Condition[];
  actions: Action[];
  immunities: Condition[];
  special: Action[];

  constructor(type: MonsterType,
    level: number,
    health: number | string,
    movement: number,
    attack: number | string,
    range: number,
    conditions: Condition[] = [],
    actions: Action[] = [],
    immunities: Condition[] = [],
    special: Action[] = []
  ) {
    this.type = type;
    this.level = level;
    this.health = health;
    this.movement = movement;
    this.attack = attack;
    this.range = range;
    this.conditions = conditions || [];
    this.actions = actions || [];
    this.immunities = immunities || [];
    this.special = special || [];
  }
}