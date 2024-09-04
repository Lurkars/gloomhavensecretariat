import { Action } from "./data/Action";
import { ConditionName, EntityCondition, GameEntityConditionModel } from "./data/Condition";
import { Entity, EntityValueFunction } from "./Entity";
import { ObjectiveContainer } from "./ObjectiveContainer";

export class ObjectiveEntity implements Entity {

  uuid: string;
  marker: string = "";
  dead: boolean = false;
  dormant: boolean = false;
  revealed: boolean = false;

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
  shield: Action | undefined;
  shieldPersistent: Action | undefined;
  retaliate: Action[] = [];
  retaliatePersistent: Action[] = [];

  constructor(uuid: string, number: number, objective: ObjectiveContainer, marker: string | undefined) {
    this.uuid = uuid;
    this.number = number;
    this.marker = marker || "";
    this.maxHealth = EntityValueFunction(objective.health);
    this.health = this.maxHealth;
    if (this.health == 0) {
      this.health = 1;
    }
  }

  toModel(): GameObjectiveEntityModel {
    return new GameObjectiveEntityModel(this.uuid, this.number, this.marker, this.dead, this.active, this.dormant, this.health, this.maxHealth, this.entityConditions.map((condition) => condition.toModel()), this.immunities, this.markers, this.tags || [], this.shield, this.shieldPersistent, this.retaliate, this.retaliatePersistent);
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

    this.shield = model.shield ? JSON.parse(model.shield) : undefined;
    this.shieldPersistent = model.shieldPersistent ? JSON.parse(model.shieldPersistent) : undefined;
    this.retaliate = (model.retaliate || []).map((value) => JSON.parse(value));
    this.retaliatePersistent = (model.retaliatePersistent || []).map((value) => JSON.parse(value));
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
  shield: string;
  shieldPersistent: string;
  retaliate: string[];
  retaliatePersistent: string[];

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
    tags: string[],
    shield: Action | undefined,
    shieldPersistent: Action | undefined,
    retaliate: Action[],
    retaliatePersistent: Action[]) {
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
    this.shield = shield ? JSON.stringify(shield) : "";
    this.shieldPersistent = shieldPersistent ? JSON.stringify(shieldPersistent) : "";
    this.retaliate = retaliate.map((action) => JSON.stringify(action));
    this.retaliatePersistent = retaliatePersistent.map((action) => JSON.stringify(action));
  }
}