import { Figure } from "./Figure";
import { Entity } from "./Entity";
import { EntityCondition, GameEntityConditionModel } from "./Condition";
import { ScenarioObjectiveIdentifier } from "./data/ObjectiveData";
import { v4 as uuidv4 } from 'uuid';

export class Objective implements Entity, Figure {

  uuid: string;
  id: number;
  marker: string = "";
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
  tags: string[] = [];

  initiative: number = 99;

  objectiveId: ScenarioObjectiveIdentifier | undefined;

  constructor(uuid: string, id: number, objectiveId: ScenarioObjectiveIdentifier | undefined = undefined) {
    this.uuid = uuid || uuidv4();
    this.id = id;
    this.objectiveId = objectiveId;
  }

  getInitiative(): number {
    return (this.exhausted || this.health <= 0) ? 100 : this.initiative;
  }

  toModel(): GameObjectiveModel {
    return new GameObjectiveModel(this.uuid || uuidv4(), this.id, this.marker, this.title, this.name, this.escort, this.level, this.exhausted, this.off, this.active, this.health, this.maxHealth, this.entityConditions.map((condition) => condition.toModel()), this.markers, this.tags || [], this.initiative, this.objectiveId);
  }

  fromModel(model: GameObjectiveModel) {
    this.uuid = model.uuid || uuidv4();
    this.id = model.id;
    this.marker = model.marker;
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
    this.markers = model.markers || this.markers;
    this.tags = model.tags || this.tags;
    this.initiative = model.initiative
    this.objectiveId = model.objectiveId;
  }

}

export class GameObjectiveModel {

  uuid: string;
  id: number;
  marker: string;
  title: string;
  name: string;
  escort: boolean;
  level: number;
  exhausted: boolean;
  off: boolean;
  active: boolean;
  health: number;
  maxHealth: number | string;
  entityConditions: GameEntityConditionModel[];
  markers: string[];
  tags: string[];
  initiative: number;
  objectiveId: ScenarioObjectiveIdentifier | undefined;

  constructor(
    uuid: string,
    id: number,
    marker: string,
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
    tags: string[],
    initiative: number,
    objectiveId: ScenarioObjectiveIdentifier | undefined) {
    this.uuid = uuid;
    this.id = id;
    this.marker = marker;
    this.title = title;
    this.name = name;
    this.escort = escort;
    this.level = level;
    this.exhausted = exhausted;
    this.off = off;
    this.active = active;
    this.health = health;
    this.maxHealth = maxHealth;
    this.entityConditions = JSON.parse(JSON.stringify(entityConditions));
    this.markers = JSON.parse(JSON.stringify(markers));
    this.tags = JSON.parse(JSON.stringify(tags));
    this.initiative = initiative;
    this.objectiveId = objectiveId && JSON.parse(JSON.stringify(objectiveId)) || undefined;
  }
}

export const OBJECTIV_MARKERS: string[] = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];