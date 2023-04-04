export class Action {
  type: ActionType;
  value: number | string;
  valueObject: object | undefined;
  valueType: ActionValueType;
  subActions: Action[];
  small: boolean;

  constructor(type: ActionType,
    value: number | string = "",
    valueType: ActionValueType = ActionValueType.fixed,
    subActions: Action[] = [],
    small: boolean = false) {
    this.type = type;
    this.value = value;
    this.valueType = valueType;
    this.subActions = subActions || [];
    this.small = small;
  }
}

export enum ActionType {
  area = "area",
  attack = "attack",
  card = "card",
  condition = "condition",
  custom = "custom",
  element = "element",
  elementHalf = "elementHalf",
  fly = "fly",
  heal = "heal",
  grant = "grant",
  jump = "jump",
  loot = "loot",
  monsterType = "monsterType",
  move = "move",
  pierce = "pierce",
  pull = "pull",
  push = "push",
  range = "range",
  retaliate = "retaliate",
  shield = "shield",
  spawn = "spawn",
  special = "special",
  specialTarget = "specialTarget",
  sufferDamage = "sufferDamage",
  summon = "summon",
  swing = "swing",
  target = "target",
  teleport = "teleport",
  trigger = "trigger",
  concatenation = "concatenation",
  grid = "grid",
  box = "box",
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
  ally = "ally",
  allyShort = "allyShort",
  allyAffect = "allyAffect",
  allyAffectRange = "allyAffectRange",
  allyAdjacent = "allyAdjacent",
  allies = "allies",
  alliesAdjacent = "alliesAdjacent",
  alliesAdjacentAffect = "alliesAdjacentAffect",
  alliesRange = "alliesRange",
  alliesRangeAffect = "alliesRangeAffect",
  enemy = "enemy",
  enemyAdjacent = "enemyAdjacent",
  enemyRange = "enemyRange",
  enemyOneAll = "enemyOneAll",
  enemies = "enemies",
  enemiesAdjacent = "enemiesAdjacent",
  enemiesRange = "enemiesRange",
  enemiesRangeExact = "enemiesRangeExtact",
  enemiesRangeAffect = "enemiesRangeAffect",
  enemiesRangeAffectExact = "enemiesRangeAffectExact",
  enemiesMovedThrough = "enemiesMovedThrough",
  enemiesMovedThroughAdjacent = "enemiesMovedThroughAdjacent",
  figures = "figures",
  figuresAdjacent = "figuresAdjacent",
  figuresRange = "figuresRange",
  focusEnemyFarthest = "focusEnemyFarthest",
  self = "self",
  selfAllies = "selfAllies",
  selfAlliesAffect = "selfAlliesAffect",
  selfAlliesRange = "selfAlliesRange",
  selfAlliesAdjacentAffect = "selfAlliesAdjacentAffect",
  targets = "targets"
}

export enum ActionCardType {

  experience = "experience",
  lost = "lost",
  persistent = "persistent",
  recover = "recover",
  refresh = "refresh",
  round = "round",
  slot = "slot",
  slotXp = "slotXp"

}
