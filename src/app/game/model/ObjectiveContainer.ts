import { Figure } from "./Figure";
import { ScenarioObjectiveIdentifier } from "./data/ObjectiveData";
import { GameObjectiveEntityModel, ObjectiveEntity } from "./ObjectiveEntity";

export class ObjectiveContainer implements Figure {

  uuid: string;
  marker: string = "";
  title: string = "";
  exhausted: boolean = false;
  escort: boolean = false;
  entities: ObjectiveEntity[] = [];

  // workaround
  noThumbnail: true = true;
  summonColor: "" = "";

  // from figure
  name: string = "";
  level: number = 0;
  off: boolean = false;
  active: boolean = false;
  edition: string = "";
  maxHealth: number | string = 7;
  initiative: number = 99;
  type: string = 'objective';

  objectiveId: ScenarioObjectiveIdentifier | undefined;

  constructor(uuid: string, objectiveId: ScenarioObjectiveIdentifier | undefined = undefined) {
    this.uuid = uuid;
    this.objectiveId = objectiveId;
  }

  getInitiative(): number {
    return this.initiative;
  }

  toModel(): GameObjectiveContainerModel {
    return new GameObjectiveContainerModel(this.uuid, this.marker, this.title, this.name, this.escort, this.entities.map((value) => value.toModel()), this.level, this.exhausted, this.off, this.active, this.maxHealth, this.initiative, this.objectiveId);
  }


  fromModel(model: GameObjectiveContainerModel) {
    this.marker = model.marker;
    this.title = model.title;
    this.name = model.name;
    this.escort = model.escort;
    this.entities = this.entities.filter((entity) => model.entities.some((value) => value.uuid == entity.uuid));

    model.entities.forEach((value, index) => {
      let entity = this.entities.find((entity) => value.uuid == entity.uuid) as ObjectiveEntity;
      if (!entity) {
        entity = new ObjectiveEntity(value.uuid, value.number, this);
        this.entities.splice(index, 0, entity);
      } else if (index != this.entities.indexOf(entity)) {
        this.entities.splice(this.entities.indexOf(entity), 1);
        this.entities.splice(index, 0, entity);
      }
      entity.fromModel(value);
    })

    this.entities.sort((a, b) => model.entities.map((model) => model.uuid).indexOf(a.uuid) - model.entities.map((model) => model.uuid).indexOf(b.uuid));

    this.level = model.level;
    this.exhausted = model.exhausted;
    this.off = model.off;
    this.active = model.active;
    this.maxHealth = model.maxHealth;
    this.initiative = model.initiative;
    this.objectiveId = model.objectiveId;
  }

}

export class GameObjectiveContainerModel {

  uuid: string;
  marker: string;
  title: string;
  name: string;
  escort: boolean;
  entities: GameObjectiveEntityModel[];
  level: number;
  exhausted: boolean;
  off: boolean;
  active: boolean;
  maxHealth: number | string;
  initiative: number;
  objectiveId: ScenarioObjectiveIdentifier | undefined;

  constructor(
    uuid: string,
    marker: string,
    title: string,
    name: string,
    escort: boolean,
    entities: GameObjectiveEntityModel[],
    level: number,
    exhausted: boolean,
    off: boolean,
    active: boolean,
    maxHealth: number | string,
    initiative: number,
    objectiveId: ScenarioObjectiveIdentifier | undefined) {
    this.uuid = uuid;
    this.marker = marker;
    this.title = title;
    this.name = name;
    this.escort = escort;
    this.entities = entities;
    this.level = level;
    this.exhausted = exhausted;
    this.off = off;
    this.active = active;
    this.maxHealth = maxHealth;
    this.initiative = initiative;
    this.objectiveId = objectiveId && JSON.parse(JSON.stringify(objectiveId)) || undefined;
  }
}