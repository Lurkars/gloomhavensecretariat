import { Figure } from "./Figure";
import { Entity } from "./Entity";
import { Condition } from "./Condition";

export class Objective implements Entity, Figure {

  id: number;
  title: string = "";
  exhausted: boolean = false;
  escort: boolean = false;

  // from figure
  name: string = "";
  level: number = 0;
  off: boolean = false;
  active: boolean = false;

  // from entity
  health: number = 7;
  maxHealth: number | string = 7;
  conditions: Condition[] = [];
  turnConditions: Condition[] = [];
  markers: string[] = [];

  initiative: number = 99;

  constructor(id: number) {
    this.id = id;
  }

  getInitiative(): number {
    return this.initiative;
  }

  toModel(): GameObjectiveModel {
    return new GameObjectiveModel(this.id, this.title, this.name, this.escort, this.level, this.exhausted, this.off, this.active, this.health, this.maxHealth, this.conditions, this.turnConditions, this.markers, this.initiative);
  }

  fromModel(model: GameObjectiveModel) {
    this.id = model.id;
    this.title = model.title;
    this.name = model.name;
    this.escort = model.escort;
    this.level = model.level;
    this.exhausted = model.exhausted;
    this.off = model.off;
    this.active = model.active;
    this.health = model.health;
    this.maxHealth = model.maxHealth;
    this.conditions = model.conditions;
    this.turnConditions = model.turnConditions;
    this.markers = model.markers;
    this.initiative = model.initiative
  }

}

export class GameObjectiveModel {

  id: number;
  title: string;
  name: string;
  escort: boolean;
  level: number;
  exhausted: boolean;
  off: boolean;
  active: boolean;
  health: number;
  maxHealth: number | string;
  conditions: Condition[] = [];
  turnConditions: Condition[] = [];
  markers: string[] = [];
  initiative: number;

  constructor(
    id: number,
    title: string,
    name: string,
    escort: boolean,
    level: number,
    exhausted: boolean,
    off: boolean,
    active: boolean,
    health: number,
    maxHealth: number | string,
    conditions: Condition[],
    turnConditions: Condition[],
    markers: string[],
    initiative: number) {
    this.id = id;
    this.title = title;
    this.name = name;
    this.escort = escort;
    this.level = level;
    this.exhausted = exhausted;
    this.off = off;
    this.active = active;
    this.health = health;
    this.maxHealth = maxHealth;
    this.conditions = conditions;
    this.turnConditions = turnConditions;
    this.markers = markers;
    this.initiative = initiative;
  }
}