export enum ConditionName {
  stun = "stun",
  immobilize = "immobilize",
  disarm = "disarm",
  wound = "wound",
  muddle = "muddle",
  poison = "poison",
  strengthen = "strengthen",
  invisible = "invisible",
  curse = "curse",
  bless = "bless",
  regenerate = "regenerate",
  ward = "ward",
  bane = "bane",
  brittle = "brittle",
  impair = "impair",
  chill = "chill",
  infect = "infect",
  rupture = "rupture",
  dodge = "dodge",
  empower = "empower",
  enfeeble = "enfeeble",
  poison_x = "poison_x",
  wound_x = "wound_x",
  heal = "heal",
  shield = "shield",
  retaliate = "retaliate",
  invalid = "invalid",
}

export enum ConditionType {
  action = "action",
  standard = "standard",
  entity = "entity",
  character = "character",
  monster = "monster",
  upgrade = "upgrade",
  stack = "stack",
  stackable = "stackable",
  turn = "turn",
  afterTurn = "afterTurn",
  expire = "expire",
  value = "value",
  clearHeal = "clearHeal",
  preventHeal = "preventHeal",
  apply = "apply",
  autoApply = "autoApply",
  positive = "positive",
  negative = "negative",
  double = "double",
  expiredIndicator = "expiredIndicator",
  hidden = "hidden",
  amDeck = "amDeck",
  highlightOnly = "highlightOnly"
}

export type FigureCondition = { name: ConditionName, level: number | undefined };

export enum EntityConditionState {
  new = "new",
  normal = "normal",
  expire = "expire",
  removed = "removed",
  turn = "turn"
}

export class Condition {

  name: ConditionName;
  types: ConditionType[] = [];
  value: number = 1;

  constructor(name: ConditionName | string, value: number = 1) {
    if (typeof name == 'string') {
      if (Object.keys(ConditionName).indexOf(name) == -1) {
        console.warn("Invalid condition name: " + name);
        this.name = ConditionName.invalid;
      } else {
        this.name = name as ConditionName;
      }
    } else {
      this.name = name;
    }
    this.value = value;

    this.types.push(ConditionType.action);

    if ([ConditionName.stun, ConditionName.immobilize, ConditionName.disarm, ConditionName.wound, ConditionName.muddle, ConditionName.poison, ConditionName.invisible, ConditionName.strengthen, ConditionName.regenerate, ConditionName.infect, ConditionName.bane, ConditionName.brittle, ConditionName.chill, ConditionName.ward, ConditionName.rupture, ConditionName.poison_x, ConditionName.wound_x].indexOf(this.name) != -1) {
      this.types.push(ConditionType.entity);
    }


    if ([ConditionName.stun, ConditionName.immobilize, ConditionName.disarm, ConditionName.wound, ConditionName.muddle, ConditionName.poison, ConditionName.invisible, ConditionName.strengthen, ConditionName.regenerate, ConditionName.infect, ConditionName.bane, ConditionName.brittle, ConditionName.impair, ConditionName.rupture, ConditionName.ward, ConditionName.dodge].indexOf(this.name) != -1) {
      this.types.push(ConditionType.standard);
    }

    if (this.types.indexOf(ConditionType.entity) != -1 || [ConditionName.impair, ConditionName.dodge].indexOf(this.name) != -1) {
      this.types.push(ConditionType.character);
    }

    if (this.types.indexOf(ConditionType.entity) != -1) {
      this.types.push(ConditionType.monster);
    }

    if ([ConditionName.poison_x, ConditionName.wound_x].indexOf(this.name) != -1) {
      this.types.push(ConditionType.upgrade);
      this.types.push(ConditionType.value);
    }

    if ([ConditionName.chill].indexOf(this.name) != -1) {
      this.types.push(ConditionType.stack);
    }

    if ([ConditionName.chill, ConditionName.bless, ConditionName.curse, ConditionName.enfeeble, ConditionName.empower].indexOf(this.name) != -1) {
      this.types.push(ConditionType.stackable);
    }

    if ([ConditionName.wound, ConditionName.wound_x, ConditionName.regenerate].indexOf(this.name) != -1) {
      this.types.push(ConditionType.turn);
    }

    if ([ConditionName.bane].indexOf(this.name) != -1) {
      this.types.push(ConditionType.afterTurn);
    }

    if ([ConditionName.wound, ConditionName.wound_x, ConditionName.poison, ConditionName.poison_x, ConditionName.bane, ConditionName.brittle, ConditionName.infect, ConditionName.rupture].indexOf(this.name) != -1) {
      this.types.push(ConditionType.clearHeal);
    }

    if ([ConditionName.poison, ConditionName.poison_x, ConditionName.ward, ConditionName.brittle, ConditionName.heal, ConditionName.shield].indexOf(this.name) != -1) {
      this.types.push(ConditionType.apply);
    }

    if ([ConditionName.ward, ConditionName.brittle, ConditionName.heal, ConditionName.shield].indexOf(this.name) != -1) {
      this.types.push(ConditionType.autoApply);
    }

    if ([ConditionName.poison, ConditionName.poison_x].indexOf(this.name) != -1) {
      this.types.push(ConditionType.double);
    }

    if ([ConditionName.poison, ConditionName.poison_x, ConditionName.infect].indexOf(this.name) != -1) {
      this.types.push(ConditionType.preventHeal);
    }

    if ([ConditionName.stun, ConditionName.immobilize, ConditionName.disarm, ConditionName.muddle, ConditionName.invisible, ConditionName.strengthen, ConditionName.impair].indexOf(this.name) != -1) {
      this.types.push(ConditionType.expire);
    }

    if ([ConditionName.regenerate, ConditionName.ward, ConditionName.invisible, ConditionName.strengthen, ConditionName.bless, ConditionName.dodge].indexOf(this.name) != -1) {
      this.types.push(ConditionType.positive);
    }

    if ([ConditionName.stun].indexOf(this.name) != -1) {
      this.types.push(ConditionType.expiredIndicator);
    }

    if ([ConditionName.heal, ConditionName.shield, ConditionName.retaliate].indexOf(this.name) != -1) {
      this.types.push(ConditionType.positive);
      this.types.push(ConditionType.hidden);
      this.types.push(ConditionType.value);
    }

    if ([ConditionName.bless, ConditionName.curse, ConditionName.empower, ConditionName.enfeeble].indexOf(this.name) != -1) {
      this.types.push(ConditionType.hidden);
      this.types.push(ConditionType.amDeck);
    }

    if ([ConditionName.retaliate].indexOf(this.name) != -1) {
      this.types.push(ConditionType.highlightOnly);
    }

    if ([ConditionName.invalid].indexOf(this.name) != -1) {
      this.types.push(ConditionType.hidden);
    }

    if (this.types.indexOf(ConditionType.positive) == -1) {
      this.types.push(ConditionType.negative);
    }

  }

}

export class EntityCondition extends Condition {

  state: EntityConditionState;
  lastState: EntityConditionState;
  permanent: boolean = false;
  expired: boolean = false;
  highlight: boolean = false;
  constructor(name: ConditionName, value: number = 1) {
    super(name, value);
    this.state = EntityConditionState.normal;
    this.lastState = EntityConditionState.new;
  }

  toModel(): GameEntityConditionModel {
    return new GameEntityConditionModel(this.name, this.value, this.state, this.lastState, this.permanent, this.expired, this.highlight);
  }

  fromModel(model: GameEntityConditionModel) {
    this.name = model.name;
    this.value = model.value;
    this.state = model.state;
    this.lastState = model.lastState;
    this.permanent = model.permanent;
    this.expired = model.expired;
    this.highlight = model.highlight;
  }

}

export class GameEntityConditionModel {

  name: ConditionName;
  value: number;
  state: EntityConditionState;
  lastState: EntityConditionState;
  permanent: boolean;
  expired: boolean;
  highlight: boolean = false;

  constructor(name: ConditionName, value: number, state: EntityConditionState, lastState: EntityConditionState, permanent: boolean, expired: boolean, highlight: boolean) {
    this.name = name;
    this.value = value;
    this.state = state;
    this.lastState = lastState;
    this.permanent = permanent;
    this.expired = expired;
    this.highlight = highlight;
  }

}

export const Conditions: Condition[] = Object.values(ConditionName).map((name) => new Condition(name)); 