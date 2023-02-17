import { max } from "rxjs";
import { Action } from "./Action";
import { EntityCondition, GameEntityConditionModel } from "./Condition";
import { SummonData } from "./data/SummonData";
import { Entity, EntityValueFunction } from "./Entity";

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
  attack: number = 0;
  movement: number = 0;
  range: number = 0;
  dead: boolean = false;
  state: SummonState = SummonState.new;
  init: boolean = true;
  action: Action | undefined;
  additionalAction: Action | undefined;
  active: boolean = false;

  // from entity
  level: number;
  health: number = 2;
  maxHealth: number = 2;
  entityConditions: EntityCondition[] = [];
  markers: string[] = [];
  tags: string[] = [];

  constructor(name: string, level: number, number: number, color: SummonColor, summonData: SummonData | undefined = undefined) {
    this.name = name;
    this.level = level;
    this.number = number;
    this.color = color;
    if (summonData) {
      this.maxHealth = EntityValueFunction(summonData.health, level);
      this.health = this.maxHealth;
      this.attack = EntityValueFunction(summonData.attack, level);
      this.movement = EntityValueFunction(summonData.movement, level);
      this.range = EntityValueFunction(summonData.range, level);
      this.action = summonData.action ? JSON.parse(JSON.stringify(summonData.action)) : undefined;
      this.additionalAction = summonData.additionalAction ? JSON.parse(JSON.stringify(summonData.additionalAction)) : undefined;
    }
    this.health = this.maxHealth;
  }

  toModel(): GameSummonModel {
    return new GameSummonModel(this.name, this.number, this.color, this.attack, this.movement, this.range, this.dead, this.state, this.level, this.health, this.maxHealth, this.entityConditions.map((condition) => condition.toModel()), this.markers, this.tags || [], this.action ? JSON.stringify(this.action) : undefined, this.additionalAction ? JSON.stringify(this.additionalAction) : undefined, this.active);
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
      this.entityConditions = model.entityConditions.map((gecm) => {
        let condition = new EntityCondition(gecm.name, gecm.value);
        condition.fromModel(gecm);
        return condition;
      });
    }
    if (model.action) {
      this.action = JSON.parse(model.action);
    }

    if (model.additionalAction) {
      this.additionalAction = JSON.parse(model.additionalAction);
    }

    this.active = model.active;

    this.markers = model.markers || this.markers;
    this.tags = model.tags || this.tags;
    this.init = false;
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
  tags: string[];
  action: string | undefined;
  additionalAction: string | undefined;
  active: boolean = false;

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
    markers: string[],
    tags: string[],
    action: string | undefined,
    additionalAction: string | undefined,
    active: boolean) {
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
    this.entityConditions = JSON.parse(JSON.stringify(entityConditions));
    this.markers = JSON.parse(JSON.stringify(markers));
    this.tags = JSON.parse(JSON.stringify(tags));
    this.action = action;
    this.additionalAction = additionalAction;
    this.active = active;
  }
}