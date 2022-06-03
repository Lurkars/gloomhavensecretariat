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
  red = "red"
}

export class Summon implements Entity {

  attack: number;
  movement: number;
  range: number;
  number: number;
  color: SummonColor;
  dead: boolean = false;

  // from entity
  level: number;
  health: number;
  maxHealth: number;
  conditions: Condition[] = [];
  turnConditions: Condition[] = [];


  constructor(level: number, number: number, maxHealth: number, attack: number,
    movement: number,
    range: number, color: SummonColor) {
    this.level = level;
    this.number = number;
    this.health = maxHealth;
    this.maxHealth = maxHealth;
    this.attack = attack;
    this.movement = movement;
    this.range = range;
    this.color = color;
  }
}