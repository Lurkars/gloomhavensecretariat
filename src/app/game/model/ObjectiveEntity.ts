import { EntityCondition, GameEntityConditionModel } from "./data/Condition";
import { Entity, EntityValueFunction } from "./Entity";
import { ObjectiveContainer } from "./ObjectiveContainer";

export class ObjectiveEntity implements Entity {

  uuid: string;
  marker: string = "";
  dead: boolean = false;

  // workaround
  type: "" = "";
  summon: "" = "";

  // from entity
  active: boolean = false;
  off: boolean = false;
  level: number = -1;
  health: number;
  maxHealth: number;
  entityConditions: EntityCondition[] = [];
  number: number;
  markers: string[] = [];
  tags: string[] = [];

  constructor(uuid: string, number: number, objective: ObjectiveContainer) {
    this.uuid = uuid;
    this.number = number;
    this.marker = objective.marker;
    this.maxHealth = EntityValueFunction(objective.health);
    this.health = this.maxHealth;
    if (this.health == 0) {
      this.health = 1;
    }
  }

  toModel(): GameObjectiveEntityModel {
    return new GameObjectiveEntityModel(this.uuid, this.number, this.marker, this.dead, this.active, this.health, this.maxHealth, this.entityConditions.map((condition) => condition.toModel()), this.markers, this.tags || []);
  }

  fromModel(model: GameObjectiveEntityModel) {
    this.marker = model.marker;
    this.dead = model.dead;
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
    this.markers = model.markers || [];
    this.tags = model.tags || [];
  }


}

export class GameObjectiveEntityModel {
  uuid: string;
  number: number;
  marker: string;
  dead: boolean;
  active: boolean;
  health: number;
  maxHealth: number;
  entityConditions: GameEntityConditionModel[];
  markers: string[];
  tags: string[];

  constructor(
    uuid: string,
    number: number,
    marker: string,
    dead: boolean,
    active: boolean,
    health: number,
    maxHealth: number,
    entityConditions: GameEntityConditionModel[],
    markers: string[],
    tags: string[]) {
    this.uuid = uuid;
    this.number = number;
    this.marker = marker;
    this.dead = dead;
    this.active = active;
    this.health = health;
    this.maxHealth = maxHealth;
    this.entityConditions = JSON.parse(JSON.stringify(entityConditions));
    this.markers = JSON.parse(JSON.stringify(markers));
    this.tags = JSON.parse(JSON.stringify(tags));
  }
}