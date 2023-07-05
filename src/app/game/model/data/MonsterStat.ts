import { Action } from "./Action";
import { MonsterType } from "./MonsterType";

export class MonsterStat {
  type: MonsterType;
  level: number;
  health: number | string;
  movement: number;
  attack: number | string;
  range: number;
  actions: Action[];
  immunities: string[];
  special: Action[][];
  note: string;

  constructor(type: MonsterType,
    level: number,
    health: number | string,
    movement: number,
    attack: number | string,
    range: number,
    actions: Action[] = [],
    immunities: string[] = [],
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

  health: number = 0;
  movement: number = 0;
  attack: number = 0;
  range: number = 0;
  actions: Action[] = [];
  immunities: string[] = [];

}