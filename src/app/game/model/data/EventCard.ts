import { Editional } from "./Editional";
import { ScenarioFigureRule } from "./ScenarioRule";

export class EventCard implements Editional {

    cardId: number = 0;
    edition: string = "";
    type: string = "";
    text: string = "";
    options: EventCardOption[] = [];

}

export class EventCardOption {

    choice: string;
    outcome: string | boolean;
    return: boolean = false;
    remove: boolean = false;
    effects: EventCardEffect[];

    constructor(choice: string, outcome: string | boolean, effects: EventCardEffect[]) {
        this.choice = choice;
        this.outcome = outcome;
        this.effects = effects;
    }
}

export enum EventRewardType {
    additionalGold = "additionalGold",
    event = "event",
    collectiveGold = "collectiveGold",
    collectiveItem = "collectiveItem",
    consumeItem = "consumeItem",
    consumeCollectiveItem = "consumeCollectiveItem",
    custom = "costum",
    discard = "discard",
    experience = "experience",
    globalAchievement = "globalAchievement",
    gold = "gold",
    itemDesign = "itemDesign",
    loseBattleGoal = "loseBattleGoal",
    loseCollectiveGold = "loseCollectiveGold",
    loseGold = "loseGold",
    loseReputation = "loseReputation",
    noEffect = "noEffect",
    outcome = "outcome",
    randomItemDesign = "randomItemDesign",
    reputation = "reputation",
    partyAchievement = "partyAchievement",
    prosperity = "prosperity",
    scenario = "scenario",
    scenarioCondition = "scenarioCondition",
    scenarioDamage = "scenarioDamage",
    scenarioSingleMinus1 = "scenarioSingleMinus1"
}

export enum EventConditionType {
    otherwise = "otherwise",
    payCollectiveGold = "payCollectiveGold",
    payCollectiveGoldConditional = "payCollectiveGoldConditional",
    reputationGT = "reputationGT",
    reputationLT = "reputationLT"
}

export type EventCondition = { type: EventConditionType, value: string | number | undefined } | undefined;

export type EventReward = { type: EventRewardType, value: string | number | undefined, condition: EventCondition };

export class EventCardEffect {

    rule: ScenarioFigureRule | undefined;
    condition: EventCondition;
    text: string | boolean | undefined;
    rewards: EventReward[][] = [];
    return: boolean = false;
    remove: boolean = false;
}