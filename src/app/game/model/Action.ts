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
  attack = "attack",
  range = "range",
  move = "move",
  jump = "jump",
  heal = "heal",
  specialTarget = "specialTarget",
  target = "target",
  shield = "shield",
  pierce = "pierce",
  area = "area",
  push = "push",
  pull = "pull",
  element = "element",
  condition = "condition",
  custom = "custom",
  fly = "fly",
  loot = "loot",
  retaliate = "retaliate",
  teleport = "teleport",
  special = "special",
  monsterType = "monsterType",
}

export enum ActionValueType {
  plus = "plus",
  minus = "minus",
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
