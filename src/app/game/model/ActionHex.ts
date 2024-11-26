
export enum ActionHexType {
    active = "active",
    target = "target",
    conditional = "conditional",
    ally = "ally",
    blank = "blank",
    invisible = "invisible"
}

export class ActionHex {

    x: number = 0;
    y: number = 0;
    type: ActionHexType = ActionHexType.active;
    value: string = "";

    constructor(x: number, y: number, type: ActionHexType, value: string) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.value = value;
    }

}

export function ActionHexFromString(string: string): ActionHex | null {

    let groups: RegExpExecArray | null = new RegExp(/^\((\d+),(\d+),(active|target|conditional|ally|blank|invisible)(\:(\w*))?\)$/).exec(string);

    if (groups == null) {
        return null;
    }

    let value = "";
    if (groups.length > 5 && groups[5]) {
        value = groups[5];
    }
    return new ActionHex(+groups[1], +groups[2], groups[3] as ActionHexType, value);
}

export function ActionHexToString(actionHex: ActionHex): string {
    return "(" + actionHex.x + "," + actionHex.y + "," + ActionHexType[actionHex.type] + (actionHex.value ? ":" + actionHex.value : "") + ")"
}
