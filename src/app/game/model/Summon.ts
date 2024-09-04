import { Action } from "./data/Action";
import { ConditionName, EntityCondition, GameEntityConditionModel } from "./data/Condition";
import { SummonData } from "./data/SummonData";
import { Entity, EntityValueFunction } from "./Entity";
import { v4 as uuidv4 } from 'uuid';

export enum SummonState {
  new = "new",
  true = "true",
  false = "false"
}

export enum SummonColor {
  blue = "blue",
  green = "green",
  yellow = "yellow",
  orange = "orange",
  white = "white",
  purple = "purple",
  pink = "pink",
  red = "red",
  custom = "custom",
  fh = "fh"
}

export class Summon implements Entity {

  uuid: string;
  name: string;
  title: string;
  cardId: string;
  number: number;
  color: SummonColor;
  attack: number | string = 0;
  movement: number = 0;
  range: number = 0;
  flying: boolean = false;
  dead: boolean = false;
  state: SummonState = SummonState.new;
  init: boolean = true;
  action: Action | undefined;
  additionalAction: Action | undefined;
  thumbnail: string | undefined;
  thumbnailUrl: string | undefined;
  noThumbnail: boolean = false;
  dormant: boolean = false;
  revealed: boolean = false;

  // from entity
  active: boolean = false;
  off: boolean = false;
  level: number;
  health: number = 2;
  maxHealth: number = 2;
  entityConditions: EntityCondition[] = [];
  immunities: ConditionName[] = [];
  markers: string[] = [];
  tags: string[] = [];
  shield: Action | undefined;
  shieldPersistent: Action | undefined;
  retaliate: Action[] = [];
  retaliatePersistent: Action[] = [];

  constructor(uuid: string, name: string, cardId: string, level: number, number: number, color: SummonColor, summonData: SummonData | undefined = undefined) {
    this.uuid = uuid || uuidv4();
    this.name = name;
    this.title = "";
    this.cardId = cardId;
    this.level = level;
    this.number = number;
    this.color = color;
    if (summonData) {
      this.maxHealth = EntityValueFunction(summonData.health, level);
      this.health = this.maxHealth;
      this.attack = summonData.attack || 0;
      this.movement = EntityValueFunction(summonData.movement, level);
      this.range = EntityValueFunction(summonData.range, level);
      this.flying = summonData.flying;
      this.action = summonData.action ? JSON.parse(JSON.stringify(summonData.action)) : undefined;
      this.additionalAction = summonData.additionalAction ? JSON.parse(JSON.stringify(summonData.additionalAction)) : undefined;
      if (summonData.thumbnail) {
        this.thumbnail = summonData.edition + "-" + summonData.name;
      }
      this.thumbnailUrl = summonData.thumbnailUrl;
      this.noThumbnail = summonData.noThumbnail;
    }
    this.health = this.maxHealth;
  }

  toModel(): GameSummonModel {
    return new GameSummonModel(this.uuid || uuidv4(), this.name, this.title, this.cardId, this.number, this.color, this.attack && this.attack + '' || '0', this.movement, this.range, this.flying, this.dead, this.state, this.level, this.health, this.maxHealth, this.entityConditions.map((condition) => condition.toModel()), this.immunities, this.markers, this.tags || [], this.action ? JSON.stringify(this.action) : undefined, this.additionalAction ? JSON.stringify(this.additionalAction) : undefined, this.active, this.dormant, this.thumbnail, this.thumbnailUrl, this.noThumbnail, this.shield, this.shieldPersistent, this.retaliate, this.retaliatePersistent);
  }

  fromModel(model: GameSummonModel) {
    this.uuid = model.uuid || uuidv4();
    this.name = model.name || "";
    this.title = model.title || "";
    this.cardId = model.cardId || "";
    this.number = model.number;
    this.color = model.color;
    this.attack = model.attack && !isNaN(+model.attack) ? +model.attack : model.attack || 0;
    this.movement = model.movement;
    this.range = model.range;
    this.flying = model.flying;
    this.dead = model.dead;
    this.state = model.state;
    this.level = model.level;
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
    if (model.action) {
      this.action = JSON.parse(model.action);
    }

    if (model.additionalAction) {
      this.additionalAction = JSON.parse(model.additionalAction);
    }

    this.active = model.active;
    this.dormant = model.dormant;
    this.thumbnail = model.thumbnail;
    this.thumbnailUrl = model.thumbnailUrl;
    this.noThumbnail = model.noThumbnail;

    this.markers = model.markers || this.markers;
    this.tags = model.tags || this.tags;
    this.init = false;

    this.shield = model.shield ? JSON.parse(model.shield) : undefined;
    this.shieldPersistent = model.shieldPersistent ? JSON.parse(model.shieldPersistent) : undefined;
    this.retaliate = (model.retaliate || []).map((value) => JSON.parse(value));
    this.retaliatePersistent = (model.retaliatePersistent || []).map((value) => JSON.parse(value));
  }
}

export class GameSummonModel {
  uuid: string;
  name: string;
  title: string;
  cardId: string;
  number: number;
  color: SummonColor;
  attack: string;
  movement: number;
  range: number;
  flying: boolean;
  dead: boolean;
  state: SummonState;
  level: number;
  health: number;
  maxHealth: number;
  entityConditions: GameEntityConditionModel[];
  immunities: ConditionName[];
  markers: string[];
  tags: string[];
  action: string | undefined;
  additionalAction: string | undefined;
  active: boolean = false;
  dormant: boolean
  thumbnail: string | undefined;
  thumbnailUrl: string | undefined;
  noThumbnail: boolean;
  shield: string;
  shieldPersistent: string;
  retaliate: string[];
  retaliatePersistent: string[];

  constructor(
    uuid: string,
    name: string,
    title: string,
    cardId: string,
    number: number,
    color: SummonColor,
    attack: string,
    movement: number,
    range: number,
    flying: boolean,
    dead: boolean,
    state: SummonState,
    level: number,
    health: number,
    maxHealth: number,
    entityConditions: GameEntityConditionModel[],
    immunities: ConditionName[],
    markers: string[],
    tags: string[],
    action: string | undefined,
    additionalAction: string | undefined,
    active: boolean,
    dormant: boolean,
    thumbnail: string | undefined,
    thumbnailUrl: string | undefined,
    noThumbnail: boolean,
    shield: Action | undefined,
    shieldPersistent: Action | undefined,
    retaliate: Action[],
    retaliatePersistent: Action[]) {
    this.uuid = uuid;
    this.name = name;
    this.title = title;
    this.cardId = cardId;
    this.number = number;
    this.color = color;
    this.attack = attack;
    this.movement = movement;
    this.range = range;
    this.flying = flying;
    this.dead = dead;
    this.state = state;
    this.level = level;
    this.health = health;
    this.maxHealth = maxHealth;
    this.entityConditions = JSON.parse(JSON.stringify(entityConditions));
    this.immunities = JSON.parse(JSON.stringify(immunities));
    this.markers = JSON.parse(JSON.stringify(markers));
    this.tags = JSON.parse(JSON.stringify(tags));
    this.action = action;
    this.additionalAction = additionalAction;
    this.active = active;
    this.dormant = dormant;
    this.thumbnail = thumbnail;
    this.thumbnailUrl = thumbnailUrl;
    this.noThumbnail = noThumbnail;
    this.shield = shield ? JSON.stringify(shield) : "";
    this.shieldPersistent = shieldPersistent ? JSON.stringify(shieldPersistent) : "";
    this.retaliate = retaliate.map((action) => JSON.stringify(action));
    this.retaliatePersistent = retaliatePersistent.map((action) => JSON.stringify(action));
  }
}