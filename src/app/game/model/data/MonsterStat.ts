import { Action } from "./Action";
import { ConditionName } from "./Condition";
import { MonsterType } from "./MonsterType";

export class MonsterStat {
  type: MonsterType;
  level: number;
  health: number | string;
  movement: number;
  attack: number | string;
  range: number;
  actions: Action[];
  immunities: ConditionName[];
  special: Action[][];
  note: string;

  constructor(type: MonsterType,
    level: number,
    health: number | string,
    movement: number,
    attack: number | string,
    range: number,
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
  additionalActions: Action[] | undefined = undefined;
  immunities: ConditionName[] | undefined = undefined;
  additionalImmunities: ConditionName[] | undefined = undefined;

  toModel(): GameMonsterStatEffectModel {
    return new GameMonsterStatEffectModel(this.health, this.movement, this.attack, this.range, this.actions, this.additionalActions, this.immunities, this.additionalImmunities);
  }

  fromModel(model: GameMonsterStatEffectModel) {
    this.health = model.health;
    this.movement = model.movement;
    this.attack = model.attack;
    this.range = model.range;
    this.actions = model.actions ? (JSON.parse(model.actions) as Action[]).map((action) => action as Action) : undefined;
    this.additionalActions = model.additionalActions ? (JSON.parse(model.additionalActions) as Action[]).map((action) => action as Action) : undefined;
    this.immunities = model.immunities;
    this.additionalImmunities = model.additionalImmunities;
  }

}


export class GameMonsterStatEffectModel {

  health: number | string;
  movement: number | string;
  attack: number | string;
  range: number | string;
  actions: string | undefined;
  additionalActions: string | undefined;
  immunities: ConditionName[] | undefined;
  additionalImmunities: ConditionName[] | undefined;

  constructor(health: number | string,
    movement: number | string,
    attack: number | string,
    range: number | string,
    actions: Action[] | undefined,
    additionalActions: Action[] | undefined,
    immunities: ConditionName[] | undefined,
    additionalImmunities: ConditionName[] | undefined) {
    this.health = health;
    this.movement = movement;
    this.attack = attack;
    this.range = range;
    this.actions = actions ? JSON.stringify(actions) : undefined;
    this.additionalActions = additionalActions ? JSON.stringify(additionalActions) : undefined;
    this.immunities = immunities;
    this.additionalImmunities = additionalImmunities;
  }
}