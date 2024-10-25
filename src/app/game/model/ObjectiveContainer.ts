import { Figure } from "./Figure";
import { GameObjectiveEntityModel, ObjectiveEntity } from "./ObjectiveEntity";
import { AdditionalIdentifier } from "./data/Identifier";
import { ScenarioObjectiveIdentifier } from "./data/ObjectiveData";

export class ObjectiveContainer implements Figure {

  uuid: string;
  marker: string = "";
  title: string = "";
  escort: boolean = false;
  entities: ObjectiveEntity[] = [];
  amDeck: string | undefined;

  // workaround
  noThumbnail: true = true;
  summonColor: "" = "";

  // from figure
  name: string = "";
  level: number = 0;
  off: boolean = false;
  active: boolean = false;
  edition: string = "";
  health: number | string = 7;
  initiative: number = 99;
  type: string = 'objectiveContainer';

  objectiveId: AdditionalIdentifier | ScenarioObjectiveIdentifier | undefined;

  constructor(uuid: string, objectiveId: AdditionalIdentifier | ScenarioObjectiveIdentifier | undefined = undefined) {
    this.uuid = uuid;
    this.objectiveId = objectiveId;
  }

  getInitiative(): number {
    return this.initiative;
  }

  toModel(): GameObjectiveContainerModel {
    return new GameObjectiveContainerModel(this.uuid, this.marker, this.title, this.name, this.escort, this.entities.map((value) => value.toModel()), this.level, this.off, this.active, this.health, this.initiative, this.objectiveId && "scenario" in this.objectiveId ? this.objectiveId : undefined, this.objectiveId && !("scenario" in this.objectiveId) ? this.objectiveId : undefined, this.amDeck);
  }


  fromModel(model: GameObjectiveContainerModel) {
    this.marker = model.marker;
    this.title = model.title;
    this.name = model.name;
    this.escort = model.escort;
    this.edition = model.escort ? 'escort' : 'objective';
    this.entities = this.entities.filter((entity) => model.entities.some((value) => value.uuid == entity.uuid));

    model.entities.forEach((value, index) => {
      let entity = this.entities.find((entity) => value.uuid == entity.uuid) as ObjectiveEntity;
      if (!entity) {
        entity = new ObjectiveEntity(value.uuid, value.number, this, this.marker);
        this.entities.splice(index, 0, entity);
      } else if (index != this.entities.indexOf(entity)) {
        this.entities.splice(this.entities.indexOf(entity), 1);
        this.entities.splice(index, 0, entity);
      }
      entity.fromModel(value);
    })

    this.entities.sort((a, b) => model.entities.map((model) => model.uuid).indexOf(a.uuid) - model.entities.map((model) => model.uuid).indexOf(b.uuid));

    this.level = model.level;
    this.off = model.off;
    this.active = model.active;
    this.health = model.health;
    this.initiative = model.initiative;
    this.objectiveId = model.additionalObjectiveId || model.objectiveId;
    this.amDeck = model.amDeck || undefined;
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
  off: boolean;
  active: boolean;
  health: number | string;
  initiative: number;
  objectiveId: ScenarioObjectiveIdentifier | undefined;
  additionalObjectiveId: AdditionalIdentifier | undefined;
  amDeck: string | undefined;

  constructor(
    uuid: string,
    marker: string,
    title: string,
    name: string,
    escort: boolean,
    entities: GameObjectiveEntityModel[],
    level: number,
    off: boolean,
    active: boolean,
    health: number | string,
    initiative: number,
    objectiveId: ScenarioObjectiveIdentifier | undefined,
    additionalObjectiveId: AdditionalIdentifier | undefined,
    amDeck: string | undefined) {
    this.uuid = uuid;
    this.marker = marker;
    this.title = title;
    this.name = name;
    this.escort = escort;
    this.entities = entities;
    this.level = level;
    this.off = off;
    this.active = active;
    this.health = health;
    this.initiative = initiative;
    this.objectiveId = objectiveId && JSON.parse(JSON.stringify(objectiveId)) || undefined;
    this.additionalObjectiveId = additionalObjectiveId && JSON.parse(JSON.stringify(additionalObjectiveId)) || undefined;
    this.amDeck = amDeck;
  }
}

export const OBJECTIV_MARKERS: string[] = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];