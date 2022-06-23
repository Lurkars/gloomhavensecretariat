export type Condition = ActionCondition | EntityCondition | CharacterCondition | UpgradeCondition | StackableCondition | RoundCondition;

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
  regenerate = "regenerate",
  chill = "chill",
  infect = "infect",
  ward = "ward",
  bane = "bane",
  brittle = "brittle",
  impair = "impair",
  poison_upgrade = "poison_upgrade",
  wound_upgrade = "wound_upgrade",
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
  regenerate = "regenerate",
  chill = "chill",
  infect = "infect",
  ward = "ward",
  bane = "bane",
  brittle = "brittle",
}

export enum CharacterCondition {
  impair = "impair",
}

export enum UpgradeCondition {
  poison_upgrade = "poison_upgrade",
  wound_upgrade = "wound_upgrade",
}

export enum StackableCondition {
  ward = "ward",
}

export enum RoundCondition {
  stun = "stun",
  immobilize = "immobilize",
  disarm = "disarm",
  muddle = "muddle",
  invisible = "invisible",
  strengthen = "strengthen",
}

export const Condition = { ...ActionCondition, ...EntityCondition, ...CharacterCondition, ...UpgradeCondition, ...StackableCondition, ...RoundCondition };