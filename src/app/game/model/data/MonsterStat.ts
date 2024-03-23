import { Action } from "./Action";
import { ConditionName } from "./Condition";
import { MonsterType } from "./MonsterType";

export class MonsterStat {
  type: MonsterType;
  level: number;
  health: number | string;
  movement: number | string;
  attack: number | string;
  range: number | string;
  actions: Action[];
  immunities: ConditionName[];
  special: Action[][];
  note: string;

  constructor(type: MonsterType,
    level: number,
    health: number | string,
    movement: number | string,
    attack: number | string,
    range: number | string,
    actions: Action[] = [],
    immunities: ConditionName[] = [],
    special: Action[][] = [],
    note: string = ""
  ) {
    this.type = type;
    this.level = level;
    this.health = health;
    this.movement = movement;
    this.attack = attack;
    this.range = range;
    this.actions = actions || [];
    this.immunities = immunities || [];
    this.special = special || [];
    this.note = note;
  }
}

export class MonsterStatEffect {

  health: number | string = 0;
  movement: number | string = 0;
  attack: number | string = 0;
  range: number | string = 0;
  actions: Action[] | undefined = undefined;
  immunities: ConditionName[] | undefined = undefined;
  deck: string | undefined = undefined;
  absolute: boolean = false;
  note: string = "";

  toModel(): GameMonsterStatEffectModel {
    return new GameMonsterStatEffectModel(this.health, this.movement, this.attack, this.range, this.actions, this.immunities, this.deck, this.absolute, this.note);
  }

  fromModel(model: GameMonsterStatEffectModel) {
    this.health = model.health;
    this.movement = model.movement;
    this.attack = model.attack;
    this.range = model.range;
    this.actions = model.actions ? (JSON.parse(model.actions) as Action[]).map((action) => action as Action) : undefined;
    this.immunities = model.immunities;
    this.deck = model.deck;
    this.absolute = model.absolute;
    this.note = model.note;
  }

}


export class GameMonsterStatEffectModel {

  health: number | string;
  movement: number | string;
  attack: number | string;
  range: number | string;
  actions: string | undefined;
  immunities: ConditionName[] | undefined;
  deck: string | undefined;
  absolute: boolean;
  note: string;

  constructor(health: number | string,
    movement: number | string,
    attack: number | string,
    range: number | string,
    actions: Action[] | undefined,
    immunities: ConditionName[] | undefined,
    deck: string | undefined,
    absolute: boolean,
    note: string) {
    this.health = health;
    this.movement = movement;
    this.attack = attack;
    this.range = range;
    this.actions = actions ? JSON.stringify(actions) : undefined;
    this.immunities = immunities;
    this.deck = deck;
    this.absolute = absolute;
    this.note = note;
  }
}