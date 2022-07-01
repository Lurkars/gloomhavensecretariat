import { Condition } from "./Condition";
import { Entity } from "./Entity";

export enum SummonState {
  new = "new",
  true = "true",
  false = "false"
}

export enum SummonColor {
  blue = "blue",
  green = "green",
  yellow = "yellow",
  orange = "orange",
  white = "white",
  purple = "purple",
  pink = "pink",
  red = "red",
  custom = "custom"
}

export class Summon implements Entity {

  number: number;
  color: SummonColor;
  attack: number;
  movement: number;
  range: number;
  dead: boolean = false;
  state: SummonState = SummonState.new;
  init: boolean = true;

  // from entity
  level: number;
  health: number;
  maxHealth: number;
  conditions: Condition[] = [];
  turnConditions: Condition[] = [];
  expiredConditions: Condition[] = [];
  markers: string[] = [];

  constructor(level: number, number: number, color: SummonColor, maxHealth: number = 2, attack: number = 0,
    movement: number = 0,
    range: number = 0) {
    this.level = level;
    this.number = number;
    this.color = color;
    this.health = maxHealth;
    this.maxHealth = maxHealth;
    this.attack = attack;
    this.movement = movement;
    this.range = range;
  }

  toModel(): GameSummonModel {
    return new GameSummonModel(this.number, this.color, this.attack, this.movement, this.range, this.dead, this.state, this.level, this.health, this.maxHealth, this.conditions, this.turnConditions, this.expiredConditions, this.markers);
  }

  fromModel(model: GameSummonModel) {
    this.number = model.number;
    this.color = model.color;
    this.attack = model.attack;
    this.movement = model.movement;
    this.range = model.range;
    this.dead = model.dead;
    this.state = model.state;
    this.level = model.level;
    this.health = model.health;
    this.maxHealth = model.maxHealth;
    this.conditions = model.conditions;
    this.turnConditions = model.turnConditions;
    this.markers = model.markers;
    this.init = false;
  }

}

export class GameSummonModel {
  number: number;
  color: SummonColor;
  attack: number;
  movement: number;
  range: number;
  dead: boolean;
  state: SummonState;
  level: number;
  health: number;
  maxHealth: number;
  conditions: Condition[];
  turnConditions: Condition[];
  expiredConditions: Condition[];
  markers: string[];


  constructor(number: number,
    color: SummonColor,
    attack: number,
    movement: number,
    range: number,
    dead: boolean,
    state: SummonState,
    level: number,
    health: number,
    maxHealth: number,
    conditions: Condition[],
    turnConditions: Condition[],
    expiredConditions: Condition[],
    markers: string[]) {
    this.number = number;
    this.color = color;
    this.attack = attack;
    this.movement = movement;
    this.range = range;
    this.dead = dead;
    this.state = state;
    this.level = level;
    this.health = health;
    this.maxHealth = maxHealth;
    this.conditions = conditions;
    this.turnConditions = turnConditions;
    this.expiredConditions = expiredConditions;
    this.markers = markers;
  }
}