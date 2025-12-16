import { EnhancementType } from "./Enhancement";

export class Action {
  type: ActionType;
  value: number | string;
  valueObject: object | undefined;
  valueType: ActionValueType;
  subActions: Action[];
  small: boolean;
  hidden: boolean;
  enhancementTypes: EnhancementType[] | undefined;

  constructor(type: ActionType,
    value: number | string = "",
    valueType: ActionValueType = ActionValueType.fixed,
    subActions: Action[] = [],
    small: boolean = false,
    hidden: boolean = false) {
    this.type = type;
    this.value = value;
    this.valueType = valueType;
    this.subActions = subActions || [];
    this.small = small;
    this.hidden = hidden;
  }
}

export enum ActionType {
  area = "area",
  attack = "attack",
  box = "box",
  boxFhSubActions = "boxFhSubActions",
  card = "card",
  concatenation = "concatenation",
  concatenationSpacer = "concatenationSpacer",
  condition = "condition",
  custom = "custom",
  damage = "damage",
  element = "element",
  elementHalf = "elementHalf",
  extra = "extra",
  fly = "fly",
  forceBox = "forceBox",
  grant = "grant",
  grid = "grid",
  heal = "heal",
  hint = "hint",
  jump = "jump",
  loot = "loot",
  monsterType = "monsterType",
  move = "move",
  nonCalc = "nonCalc",
  pierce = "pierce",
  pull = "pull",
  push = "push",
  range = "range",
  retaliate = "retaliate",
  round = "round",
  shield = "shield",
  spawn = "spawn",
  special = "special",
  specialTarget = "specialTarget",
  sufferDamage = "sufferDamage",
  summon = "summon",
  swing = "swing",
  switchType = "switchType",
  target = "target",
  teleport = "teleport",
  trigger = "trigger"
}

export enum ActionValueType {
  plus = "plus",
  minus = "minus",
  add = "add",
  subtract = "subtract",
  fixed = "fixed"
}

export enum ActionSpecialTarget {
  all = "all",
  allCharacters = "allCharacters",
  allies = "allies",
  alliesAdjacent = "alliesAdjacent",
  alliesAdjacentAffect = "alliesAdjacentAffect",
  alliesAffect = "alliesAffect",
  alliesEnemies = "alliesEnemies",
  alliesRange = "alliesRange",
  alliesRangeAffect = "alliesRangeAffect",
  ally = "ally",
  allyAdjacent = "allyAdjacent",
  allyAffect = "allyAffect",
  allyAffectAdjacent = "allyAffectAdjacent",
  allyAffectRange = "allyAffectRange",
  allyShort = "allyShort",
  enemies = "enemies",
  enemiesAdjacent = "enemiesAdjacent",
  enemiesMovedThrough = "enemiesMovedThrough",
  enemiesMovedThroughAdjacent = "enemiesMovedThroughAdjacent",
  enemiesRange = "enemiesRange",
  enemiesRangeAffect = "enemiesRangeAffect",
  enemiesRangeAffectExact = "enemiesRangeAffectExact",
  enemiesRangeExact = "enemiesRangeExact",
  enemy = "enemy",
  enemyAdjacent = "enemyAdjacent",
  enemyAllyRange = "enemyAllyRange",
  enemyOneAll = "enemyOneAll",
  enemyRange = "enemyRange",
  figures = "figures",
  figuresAdjacent = "figuresAdjacent",
  figuresRange = "figuresRange",
  focusEnemyFarthest = "focusEnemyFarthest",
  self = "self",
  selfAllies = "selfAllies",
  selfAlliesAdjacentAffect = "selfAlliesAdjacentAffect",
  selfAlliesAffect = "selfAlliesAffect",
  selfAlliesAffectRange = "selfAlliesAffectRange",
  selfAlliesRange = "selfAlliesRange",
  selfOrAlly = "selfOrAlly",
  targets = "targets"
}

export enum ActionCardType {

  experience = "experience",
  flip = "flip",
  flipItem = "flipItem",
  loss = "loss",
  lost = "lost",
  minus1 = "minus1",
  persistent = "persistent",
  recover = "recover",
  refresh = "refresh",
  round = "round",
  shuffle = "shuffle",
  slot = "slot",
  slotEnd = "slotEnd",
  slotEndXp = "slotEndXp",
  slotStart = "slotStart",
  slotStartXp = "slotStartXp",
  slotXp = "slotXp",
  slotXpFh = "slotXpFh",
  spent = "spent"

}

export class ActionHint {
  type: ActionType;
  value: number;
  range: number;
  additionalRange: "add" | "substract" | false = false;

  constructor(type: ActionType,
    value: number,
    range: number = 0) {
    this.type = type;
    this.value = value;
    this.range = range;
  }
};