import { ActionType } from "./Action";
import { ConditionName } from "./Condition";
import { Element } from "./Element";

export enum EnhancementType {
    square = "square",
    circle = "circle",
    diamond = "diamond",
    diamond_plus = "diamond_plus",
    hex = "hex"
}

export type EnhancementAction = "plus1" | ConditionName | ActionType.jump | Element;