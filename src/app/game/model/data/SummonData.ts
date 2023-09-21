import { Action } from "./Action";

export class SummonData {

  name: string;
  cardId: string;
  edition: string;
  health: number | string;
  attack: number | string;
  movement: number | string;
  range: number | string;
  flying: boolean;
  action: Action | undefined;
  additionalAction: Action | undefined;
  level: number | undefined;
  special: boolean;
  count: number;
  thumbnail: boolean;
  thumbnailUrl: string | undefined;
  noThumbnail: boolean = false;

  constructor(name: string, cardId: string, edition: string, health: number | string,
    attack: number | string,
    movement: number | string,
    range: number | string,
    flying: boolean,
    action: Action | undefined = undefined,
    additionaAction: Action | undefined = undefined,
    level: number | undefined = undefined,
    special: boolean = false,
    count: number = 1,
    thumbnail: boolean = false,
    thumbnailUrl: string | undefined = undefined,
    noThumbnail: boolean = false) {
    this.name = name;
    this.cardId = cardId;
    this.edition = edition;
    this.health = health;
    this.attack = attack;
    this.movement = movement;
    this.range = range;
    this.flying = flying;
    this.action = action;
    this.additionalAction = additionaAction;
    this.level = level;
    this.special = special;
    this.count = count;
    this.thumbnail = thumbnail;
    this.thumbnail = thumbnail;
    this.thumbnailUrl = thumbnailUrl;
    this.noThumbnail = noThumbnail;
  }

}