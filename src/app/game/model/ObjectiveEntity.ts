import { ConditionName, EntityCondition, GameEntityConditionModel } from "./data/Condition";
import { Entity, EntityValueFunction } from "./Entity";
import { ObjectiveContainer } from "./ObjectiveContainer";

export class ObjectiveEntity implements Entity {

  uuid: string;
  marker: string = "";
  dead: boolean = false;
  dormant: boolean = false;
  revealed: boolean = false;

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
  immunities: ConditionName[] = [];
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
    return new GameObjectiveEntityModel(this.uuid, this.number, this.marker, this.dead, this.active, this.dormant, this.health, this.maxHealth, this.entityConditions.map((condition) => condition.toModel()), this.immunities, this.markers, this.tags || []);
  }

  fromModel(model: GameObjectiveEntityModel) {
    this.marker = model.marker;
    this.dead = model.dead;
    this.active = model.active;
    this.dormant = model.dormant;
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
    this.immunities = model.immunities || [];
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
  dormant: boolean
  health: number;
  maxHealth: number;
  entityConditions: GameEntityConditionModel[];
  immunities: ConditionName[];
  markers: string[];
  tags: string[];

  constructor(
    uuid: string,
    number: number,
    marker: string,
    dead: boolean,
    active: boolean,
    dormant: boolean,
    health: number,
    maxHealth: number,
    entityConditions: GameEntityConditionModel[],
    immunities: ConditionName[],
    markers: string[],
    tags: string[]) {
    this.uuid = uuid;
    this.number = number;
    this.marker = marker;
    this.dead = dead;
    this.active = active;
    this.dormant = dormant;
    this.health = health;
    this.maxHealth = maxHealth;
    this.entityConditions = JSON.parse(JSON.stringify(entityConditions));
    this.immunities = JSON.parse(JSON.stringify(immunities));
    this.markers = JSON.parse(JSON.stringify(markers));
    this.tags = JSON.parse(JSON.stringify(tags));
  }
}