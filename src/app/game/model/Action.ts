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
  special = "special",
  specialTarget = "specialTarget",
  summon = "summon",
  swing = "swing",
  target = "target",
  teleport = "teleport",
  trigger = "trigger",
  concatenation = "concatenation",
  grid = "grid",
  box = "box",
}

export const ActionTypesIcons: ActionType[] = [ActionType.attack, ActionType.fly, ActionType.heal, ActionType.jump, ActionType.loot, ActionType.move, ActionType.range, ActionType.retaliate, ActionType.shield, ActionType.target, ActionType.teleport]

export enum ActionValueType {
  plus = "plus",
  minus = "minus",
  add = "add",
  subtract = "subtract",
  fixed = "fixed"
}

export enum ActionHexType {
  active = "active",
  target = "target",
  conditional = "conditional",
  ally = "ally",
  blank = "blank",
  invisible = "invisible"
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
  enemiesRangeAffect = "enemiesRangeAffect",
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

export class ActionHex {

  x: number = 0;
  y: number = 0;
  type: ActionHexType = ActionHexType.active;

  constructor(x: number, y: number, type: ActionHexType) {
    this.x = x;
    this.y = y;
    this.type = type;
  }

  public static fromString(string: string): ActionHex | null {

    let groups: RegExpExecArray | null = new RegExp(/^\((\d+),(\d+),(active|target|conditional|ally|blank|invisible)\)$/).exec(string);

    if (groups == null) {
      return null;
    }

    return new ActionHex(+groups[1], +groups[2], groups[3] as ActionHexType);
  }

  public static toString(actionHex: ActionHex): string {
    return "(" + actionHex.x + "," + actionHex.y + "," + ActionHexType[actionHex.type] + ")"
  }

}
