import { Figure } from "./Figure";
import { Entity } from "./Entity";
import { EntityCondition, GameEntityConditionModel } from "./Condition";

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
  edition: string = "";

  // from entity
  health: number = 7;
  maxHealth: number | string = 7;
  entityConditions: EntityCondition[] = [];
  markers: string[] = [];

  initiative: number = 99;

  constructor(id: number) {
    this.id = id;
  }

  getInitiative(): number {
    return (this.exhausted || this.health <= 0) ? 100 : this.initiative;
  }

  toModel(): GameObjectiveModel {
    return new GameObjectiveModel(this.id, this.title, this.name, this.escort, this.level, this.exhausted, this.off, this.active, this.health, this.maxHealth, this.entityConditions.map((condition) => condition.toModel()), this.markers, this.initiative);
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
    this.entityConditions = [];
    if (model.entityConditions) {
      this.entityConditions = model.entityConditions.map((gecm) => {
        let condition = new EntityCondition(gecm.name, gecm.value);
        condition.fromModel(gecm);
        return condition;
      });
    }
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
  entityConditions: GameEntityConditionModel[] = [];
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
    entityConditions: GameEntityConditionModel[],
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
    this.entityConditions = entityConditions;
    this.markers = markers;
    this.initiative = initiative;
  }
}