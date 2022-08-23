export class Action {
  type: ActionType;
  value: number | string;
  valueType: ActionValueType;
  subActions: Action[];

  constructor(type: ActionType,
    value: number | string = "",
    valueType: ActionValueType = ActionValueType.fixed,
    subActions: Action[] = []) {
    this.type = type;
    this.value = value;
    this.valueType = valueType;
    this.subActions = subActions || [];
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
  jump = "jump",
  loot = "loot",
  monsterType = "monsterType",
  move = "move",
  pierce = "pierce",
  pull = "pull",
  push = "push",
  range = "range",
  refreshItem = "refreshItem",
  retaliate = "retaliate",
  shield = "shield",
  special = "special",
  specialTarget = "specialTarget",
  swing = "swing",
  target = "target",
  teleport = "teleport",
  trigger = "trigger",
}

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
  blank = "blank"
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

    let groups: RegExpExecArray | null = new RegExp(/^\((\d+),(\d+),(active|target|conditional|ally|blank)\)$/).exec(string);

    if (groups == null) {
      return null;
    }

    return new ActionHex(+groups[ 1 ], +groups[ 2 ], groups[ 3 ] as ActionHexType);
  }

  public static toString(actionHex: ActionHex): string {
    return "(" + actionHex.x + "," + actionHex.y + "," + ActionHexType[ actionHex.type ] + ")"
  }

}
