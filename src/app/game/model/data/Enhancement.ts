import { ActionType } from "./Action";
import { ConditionName } from "./Condition";
import { Element } from "./Element";

export enum EnhancementType {
    square = "square",
    circle = "circle",
    diamond = "diamond",
    diamond_plus = "diamond_plus",
    hex = "hex",
    any = "any"
}

export type EnhancementAction = "plus1" | "hex" | ConditionName | ActionType.jump | Element;

export class Enhancement {

    cardId: number;
    actionIndex: string;
    index: number;
    action: EnhancementAction;
    inherited: boolean;

    constructor(cardId: number,
        actionIndex: string,
        index: number,
        action: EnhancementAction,
        inherited: boolean = false) {
        this.cardId = cardId;
        this.actionIndex = actionIndex;
        this.index = index;
        this.action = action;
        this.inherited = inherited;
    }
}