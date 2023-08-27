import { Action } from "./Action";

export class ObjectiveData {

  id: number;
  marker: string;
  name: string;
  health: number | string;
  escort: boolean;
  initiative: number | undefined;
  actions: Action[] = [];
  allyDeck: boolean = false;
  tags: string[] = [];

  constructor(name: string, health: number | string, escort: boolean = false, id: number = -1, marker: string = "", tags: string[] = [], initiative: number | undefined = undefined) {
    this.name = name;
    this.health = health;
    this.escort = escort;
    this.id = id;
    this.marker = marker;
    this.tags = tags;
    this.initiative = initiative;
  }

}

export type ScenarioObjectiveIdentifier = { "edition": string, "scenario": string, "group": string | undefined, "section": boolean, "index": number };