export enum ConditionName {
  stun = "stun",
  immobilize = "immobilize",
  disarm = "disarm",
  wound = "wound",
  muddle = "muddle",
  poison = "poison",
  invisible = "invisible",
  strengthen = "strengthen",
  curse = "curse",
  bless = "bless",
  regenerate = "regenerate",
  chill = "chill",
  infect = "infect",
  ward = "ward",
  bane = "bane",
  brittle = "brittle",
  impair = "impair",
  rupture = "rupture",
  poison_x = "poison_x",
  wound_x = "wound_x",
}

export enum ConditionType {
  action = "action",
  standard = "standard",
  entity = "entity",
  character = "character",
  monster = "monster",
  upgrade = "upgrade",
  stack = "stack",
  turn = "turn",
  expire = "expire",
  value = "value",
  clearHeal = "clearHeal",
  preventHeal = "preventHeal"
}

export enum EntityConditionState {
  normal = "normal",
  expire = "expire",
  turn = "turn"
}

export class Condition {

  name: ConditionName;
  types: ConditionType[] = [];
  value: number = 1;

  constructor(name: ConditionName, value: number = 1) {
    this.name = name;
    this.value = value;

    this.types.push(ConditionType.action);

    if ([ ConditionName.stun, ConditionName.immobilize, ConditionName.disarm, ConditionName.wound, ConditionName.muddle, ConditionName.poison, ConditionName.invisible, ConditionName.strengthen, ConditionName.regenerate, ConditionName.infect, ConditionName.bane, ConditionName.brittle, ConditionName.ward, ConditionName.rupture, ConditionName.poison_x, ConditionName.wound_x ].indexOf(this.name) != -1) {
      this.types.push(ConditionType.entity);
    }


    if ([ ConditionName.stun, ConditionName.immobilize, ConditionName.disarm, ConditionName.wound, ConditionName.muddle, ConditionName.poison, ConditionName.invisible, ConditionName.strengthen, ConditionName.regenerate, ConditionName.infect, ConditionName.bane, ConditionName.brittle, ConditionName.impair, ConditionName.rupture, ConditionName.ward ].indexOf(this.name) != -1) {
      this.types.push(ConditionType.standard);
    }

    if (this.types.indexOf(ConditionType.entity) != -1 || [ ConditionName.chill, ConditionName.impair, ConditionName.ward ].indexOf(this.name) != -1) {
      this.types.push(ConditionType.character);
    }

    if (this.types.indexOf(ConditionType.entity) != -1) {
      this.types.push(ConditionType.monster);
    }

    if ([ ConditionName.poison_x, ConditionName.wound_x ].indexOf(this.name) != -1) {
      this.types.push(ConditionType.upgrade);
    }

    if ([ ConditionName.chill ].indexOf(this.name) != -1) {
      this.types.push(ConditionType.stack);
    }

    if ([ ConditionName.wound, ConditionName.wound_x, ConditionName.regenerate ].indexOf(this.name) != -1) {
      this.types.push(ConditionType.turn);
      this.types.push(ConditionType.value);
    }

    if ([ ConditionName.wound, ConditionName.wound_x, ConditionName.poison, ConditionName.poison_x, ConditionName.bane, ConditionName.brittle, ConditionName.infect, ConditionName.rupture ].indexOf(this.name) != -1) {
      this.types.push(ConditionType.clearHeal);
    }

    if ([ ConditionName.poison, ConditionName.poison_x, ConditionName.infect ].indexOf(this.name) != -1) {
      this.types.push(ConditionType.preventHeal);
    }

    if ([ ConditionName.stun, ConditionName.immobilize, ConditionName.disarm, ConditionName.muddle, ConditionName.invisible, ConditionName.strengthen, ConditionName.bane, ConditionName.impair ].indexOf(this.name) != -1) {
      this.types.push(ConditionType.expire);
    }
  }

}

export class EntityCondition extends Condition {

  state: EntityConditionState;
  expired: boolean = false;
  highlight: boolean = false;
  count: number = 0;

  constructor(name: ConditionName, value: number = 1) {
    super(name, value);
    this.state = EntityConditionState.normal;
  }

  toModel(): GameEntityConditionModel {
    return new GameEntityConditionModel(this.name, this.value, this.state, this.expired, this.count);
  }

  fromModel(model: GameEntityConditionModel) {
    this.name = model.name;
    this.value = model.value;
    this.state = model.state;
    this.expired = model.expired;
  }

}

export class GameEntityConditionModel {

  name: ConditionName;
  value: number;
  count: number;
  state: EntityConditionState;
  expired: boolean;

  constructor(name: ConditionName, value: number, state: EntityConditionState, expired: boolean, count: number) {
    this.name = name;
    this.value = value;
    this.state = state;
    this.expired = expired;
    this.count = count;
  }

}

export const Conditions: Condition[] = Object.values(ConditionName).map((name: ConditionName) => new Condition(name)); 