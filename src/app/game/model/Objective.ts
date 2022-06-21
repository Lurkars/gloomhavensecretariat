import { Figure } from "./Figure";
import { Entity } from "./Entity";
import { Condition } from "./Condition";

export class Objective implements Entity, Figure {

  id: number;
  title: string = "";
  exhausted: boolean = false;

  // from figure
  name: string = "objective";
  level: number = 0;
  off: boolean = false;
  active: boolean = false;

  // from entity
  health: number = 7;
  maxHealth: number = 7;
  conditions: Condition[] = [];
  turnConditions: Condition[] = [];

  initiative: number = 99;

  constructor(id: number) {
    this.id = id;
  }

  getInitiative(): number {
    return this.initiative;
  }

  toModel(): GameObjectiveModel {
    return new GameObjectiveModel(this.id, this.title, this.name, this.level, this.exhausted, this.off, this.active, this.health, this.maxHealth, this.initiative);
  }

  fromModel(model: GameObjectiveModel) {
    this.id = model.id;
    this.title = model.title;
    this.name = model.name;
    this.level = model.level;
    this.exhausted = model.exhausted;
    this.off = model.off;
    this.active = model.active;
    this.health = model.health;
    this.maxHealth = model.maxHealth;
    this.initiative = model.initiative
  }

}

export class GameObjectiveModel {

  id: number;
  title: string;
  name: string;
  level: number;
  exhausted: boolean;
  off: boolean;
  active: boolean;
  health: number;
  maxHealth: number;
  initiative: number;

  constructor(
    id: number,
    title: string,
    name: string,
    level: number,
    exhausted: boolean,
    off: boolean,
    active: boolean,
    health: number,
    maxHealth: number,
    initiative: number) {
    this.id = id;
    this.title = title;
    this.name = name;
    this.level = level;
    this.exhausted = exhausted;
    this.off = off;
    this.active = active;
    this.health = health;
    this.maxHealth = maxHealth;
    this.initiative = initiative;
  }
}