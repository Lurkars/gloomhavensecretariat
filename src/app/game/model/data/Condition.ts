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
  safeguard = "safeguard",
  plague = "plague",
  invalid = "invalid",
}

export enum ConditionType {
  action = "action",
  standard = "standard",
  entity = "entity",
  character = "character",
  monster = "monster",
  objective = "objective",
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
  neutral = "neutral",
  double = "double",
  expiredIndicator = "expiredIndicator",
  hidden = "hidden",
  amDeck = "amDeck",
  highlightOnly = "highlightOnly",
  special = "special"
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
      if (Object.keys(!ConditionName).includes(name)) {
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

    if ([ConditionName.stun, ConditionName.immobilize, ConditionName.disarm, ConditionName.wound, ConditionName.muddle, ConditionName.poison, ConditionName.invisible, ConditionName.strengthen, ConditionName.regenerate, ConditionName.infect, ConditionName.bane, ConditionName.brittle, ConditionName.chill, ConditionName.ward, ConditionName.rupture, ConditionName.poison_x, ConditionName.wound_x, ConditionName.safeguard].includes(this.name)) {
      this.types.push(ConditionType.entity);
    }


    if ([ConditionName.stun, ConditionName.immobilize, ConditionName.disarm, ConditionName.wound, ConditionName.muddle, ConditionName.poison, ConditionName.invisible, ConditionName.strengthen, ConditionName.regenerate, ConditionName.infect, ConditionName.bane, ConditionName.brittle, ConditionName.impair, ConditionName.rupture, ConditionName.ward, ConditionName.dodge, ConditionName.safeguard].includes(this.name)) {
      this.types.push(ConditionType.standard);
    }

    if (this.types.includes(ConditionType.entity) || [ConditionName.impair, ConditionName.dodge].includes(this.name)) {
      this.types.push(ConditionType.character);
    }

    if (this.types.includes(ConditionType.entity) || [ConditionName.plague].includes(this.name)) {
      this.types.push(ConditionType.monster);
    }

    if ([ConditionName.poison_x, ConditionName.wound_x].includes(this.name)) {
      this.types.push(ConditionType.upgrade);
      this.types.push(ConditionType.value);
    }

    if ([ConditionName.chill, ConditionName.plague].includes(this.name)) {
      this.types.push(ConditionType.stack);
    }

    if ([ConditionName.chill, ConditionName.plague, ConditionName.bless, ConditionName.curse, ConditionName.enfeeble, ConditionName.empower].includes(this.name)) {
      this.types.push(ConditionType.stackable);
    }

    if ([ConditionName.wound, ConditionName.wound_x, ConditionName.regenerate].includes(this.name)) {
      this.types.push(ConditionType.turn);
    }

    if ([ConditionName.bane].includes(this.name)) {
      this.types.push(ConditionType.afterTurn);
    }

    if ([ConditionName.wound, ConditionName.wound_x, ConditionName.poison, ConditionName.poison_x, ConditionName.bane, ConditionName.brittle, ConditionName.infect, ConditionName.rupture].includes(this.name)) {
      this.types.push(ConditionType.clearHeal);
    }

    if ([ConditionName.poison, ConditionName.poison_x, ConditionName.ward, ConditionName.brittle, ConditionName.heal, ConditionName.shield].includes(this.name)) {
      this.types.push(ConditionType.apply);
    }

    if ([ConditionName.ward, ConditionName.brittle, ConditionName.heal, ConditionName.shield, ConditionName.safeguard].includes(this.name)) {
      this.types.push(ConditionType.autoApply);
    }

    if ([ConditionName.poison, ConditionName.poison_x].includes(this.name)) {
      this.types.push(ConditionType.double);
    }

    if ([ConditionName.poison, ConditionName.poison_x, ConditionName.infect].includes(this.name)) {
      this.types.push(ConditionType.preventHeal);
    }

    if ([ConditionName.stun, ConditionName.immobilize, ConditionName.disarm, ConditionName.muddle, ConditionName.invisible, ConditionName.strengthen, ConditionName.impair].includes(this.name)) {
      this.types.push(ConditionType.expire);
    }

    if ([ConditionName.regenerate, ConditionName.ward, ConditionName.invisible, ConditionName.strengthen, ConditionName.bless, ConditionName.dodge, ConditionName.safeguard].includes(this.name)) {
      this.types.push(ConditionType.positive);
    }

    if ([ConditionName.stun].includes(this.name)) {
      this.types.push(ConditionType.expiredIndicator);
    }

    if ([ConditionName.heal, ConditionName.shield, ConditionName.retaliate].includes(this.name)) {
      this.types.push(ConditionType.positive);
      this.types.push(ConditionType.hidden);
      this.types.push(ConditionType.value);
    }

    if ([ConditionName.bless, ConditionName.curse, ConditionName.empower, ConditionName.enfeeble].includes(this.name)) {
      this.types.push(ConditionType.hidden);
      this.types.push(ConditionType.amDeck);
    }

    if ([ConditionName.retaliate].includes(this.name)) {
      this.types.push(ConditionType.highlightOnly);
    }

    if ([ConditionName.invalid].includes(this.name)) {
      this.types.push(ConditionType.hidden);
    }

    if ([ConditionName.plague].includes(this.name)) {
      this.types.push(ConditionType.neutral);
      this.types.push(ConditionType.objective);
      this.types.push(ConditionType.special);
    }

    if (!this.types.includes(ConditionType.positive) && !this.types.includes(ConditionType.neutral)) {
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