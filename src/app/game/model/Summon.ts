import { ConditionName, EntityCondition, EntityConditionState, GameEntityConditionModel } from "./Condition";
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

  name: string;
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
  entityConditions: EntityCondition[] = [];
  markers: string[] = [];

  constructor(name: string, level: number, number: number, color: SummonColor, maxHealth: number = 2, attack: number = 0,
    movement: number = 0,
    range: number = 0) {
    this.name = name;
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
    return new GameSummonModel(this.name, this.number, this.color, this.attack, this.movement, this.range, this.dead, this.state, this.level, this.health, this.maxHealth, this.entityConditions.map((condition: EntityCondition) => condition.toModel()), this.markers);
  }

  fromModel(model: GameSummonModel) {
    this.name = model.name || "";
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
    this.entityConditions = [];
    if (model.entityConditions) {
      this.entityConditions = model.entityConditions.map((gecm: GameEntityConditionModel) => {
        let condition = new EntityCondition(gecm.name, gecm.value);
        condition.fromModel(gecm);
        return condition;
      });
    }

    this.markers = model.markers;
    this.init = false;

    // migration
    if (model.conditions) {
      model.conditions.forEach((value: string) => {
        let entityCondition = new EntityCondition(value as ConditionName);
        if (model.turnConditions && model.turnConditions.indexOf(value) != -1) {
          entityCondition.state = EntityConditionState.expire;
        }
        if (model.expiredConditions && model.expiredConditions.indexOf(value) != -1) {
          entityCondition.expired = true;
        }
        this.entityConditions.push(entityCondition);
      })
    }
  }

}

export class GameSummonModel {
  name: string;
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
  entityConditions: GameEntityConditionModel[];
  markers: string[];

  // depreacted
  conditions: string[] = [];
  turnConditions: string[] = [];
  expiredConditions: string[] = [];


  constructor(name: string,
    number: number,
    color: SummonColor,
    attack: number,
    movement: number,
    range: number,
    dead: boolean,
    state: SummonState,
    level: number,
    health: number,
    maxHealth: number,
    entityConditions: GameEntityConditionModel[],
    markers: string[]) {
    this.name = name;
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
    this.entityConditions = entityConditions;
    this.markers = markers;
  }
}