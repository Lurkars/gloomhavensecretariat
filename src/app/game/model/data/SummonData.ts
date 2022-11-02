import { Action } from "../Action";

export class SummonData {

  name: string;
  health: number | string;
  attack: number | string;
  movement: number | string;
  range: number | string;
  action: Action | undefined;
  additionalAction: Action | undefined;
  level: number | undefined;
  special: boolean;
  count: number;

  constructor(name: string, health: number | string,
    attack: number | string,
    movement: number | string,
    range: number | string,
    action: Action | undefined = undefined,
    additionaAction: Action | undefined = undefined,
    level: number | undefined = undefined,
    special: boolean = false,
    count: number = 1) {
    this.name = name;
    this.health = health;
    this.attack = attack;
    this.movement = movement;
    this.range = range;
    this.action = action;
    this.additionalAction = additionaAction;
    this.level = level;
    this.special = special;
    this.count = count;
  }

}