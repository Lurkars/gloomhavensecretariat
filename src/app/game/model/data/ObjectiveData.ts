import { Action } from "./Action";

export class ObjectiveData {

  id: number;
  marker: string;
  name: string;
  health: number | string;
  escort: boolean;
  initiative: number | undefined;
  count: number | string;
  actions: Action[] = [];
  allyDeck: boolean = false;
  tags: string[] = [];

  constructor(name: string, health: number | string, escort: boolean = false, id: number = -1, marker: string = "", tags: string[] = [], initiative: number | undefined = undefined, count: number | string = 1) {
    this.name = name;
    this.health = health;
    this.escort = escort;
    this.id = id;
    this.marker = marker;
    this.tags = tags;
    this.initiative = initiative;
    this.count = count;
  }

}

export type ScenarioObjectiveIdentifier = { "edition": string, "scenario": string, "group": string | undefined, "section": boolean, "index": number };