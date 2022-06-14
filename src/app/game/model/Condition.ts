export type Condition = ActionCondition | EntityCondition | RoundCondition;

export enum ActionCondition {
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
}

export enum EntityCondition {
  stun = "stun",
  immobilize = "immobilize",
  disarm = "disarm",
  wound = "wound",
  muddle = "muddle",
  poison = "poison",
  invisible = "invisible",
  strengthen = "strengthen",
}

export enum RoundCondition {
  stun = "stun",
  immobilize = "immobilize",
  disarm = "disarm",
  muddle = "muddle",
  invisible = "invisible",
  strengthen = "strengthen"
}

export const Condition = { ...ActionCondition, ...EntityCondition, ...RoundCondition };