import { Editional } from "./Editional";

export class EventCard implements Editional {
    cardId: string;
    edition: string;
    type: string;
    narrative: string;
    options: EventCardOption[];
    attack?: EventCardAttack;

    constructor(cardId: string, edition: string, type: string, narrative: string, options: EventCardOption[], attack?: EventCardAttack) {
        this.cardId = cardId;
        this.edition = edition;
        this.type = type;
        this.narrative = narrative;
        this.options = options;
        if (attack) {
            this.attack = attack;
        }
    }
}

export class EventCardIdentifier {
    cardId: string;
    edition: string;
    type: string;
    selected: number;
    subSelections: number[];
    scenarioApply: boolean;

    constructor(cardId: string, edition: string, type: string, selected: number,
        subSelections: number[] = [], scenarioApply: boolean = false) {
        this.cardId = cardId;
        this.edition = edition;
        this.type = type;
        this.selected = selected;
        this.subSelections = subSelections;
        this.scenarioApply = scenarioApply;
    }
}

export class EventCardOption {
    label: string;
    narrative: string;
    returnToDeck?: boolean;
    removeFromDeck?: boolean;
    outcomes: EventCardOutcome[];

    constructor(label: string, narrative: string, outcomes: EventCardOutcome[], removeFromDeck?: boolean, returnToDeck?: boolean) {
        this.label = label;
        this.narrative = narrative;
        this.outcomes = outcomes;
        if (removeFromDeck !== undefined) this.removeFromDeck = removeFromDeck;
        if (returnToDeck !== undefined) this.returnToDeck = returnToDeck;
    }
}

export class EventCardOutcome {
    narrative: string;
    returnToDeck?: boolean;
    removeFromDeck?: boolean;
    condition: string | EventCardCondition | undefined;
    effects: (string | EventCardEffect)[];

    constructor(narrative: string, effects: EventCardEffect[], condition?: EventCardCondition | undefined, removeFromDeck?: boolean, returnToDeck?: boolean) {
        this.narrative = narrative;
        this.effects = effects;
        if (condition) this.condition = condition;
        if (removeFromDeck !== undefined) this.removeFromDeck = removeFromDeck;
        if (returnToDeck !== undefined) this.returnToDeck = returnToDeck;
    }
}

export enum EventCardEffectType {
    battleGoal = "battleGoal",
    campaignSticker = "campaignSticker",
    checkbox = "checkbox",
    choose = "choose",
    collectiveGold = "collectiveGold",
    collectiveGoldAdditional = "collectiveGoldAdditional",
    collectiveGoldOther = "collectiveGoldOther",
    collectiveItem = "collectiveItem",
    collectiveResource = "collectiveResource",
    collectiveResourceType = "collectiveResourceType",
    consumeItem = "consumeItem",
    consumeCollectiveItem = "consumeCollectiveItem",
    discard = "discard",
    drawAnotherEvent = "drawAnotherEvent",
    drawEvent = "drawEvent",
    event = "event",
    eventFH = "eventFH",
    experience = "experience",
    globalAchievement = "globalAchievement",
    gold = "gold",
    goldAdditional = "goldAdditional",
    inspiration = "inspiration",
    item = "item",
    itemFH = "itemFH",
    itemCollective = "itemCollective",
    itemDesign = "itemDesign",
    loseBattleGoal = "loseBattleGoal",
    loseCollectiveExperience = "loseCollectiveExperience",
    loseCollectiveGold = "loseCollectiveGold",
    loseCollectiveResource = "loseCollectiveResource",
    loseCollectiveResourceAny = "loseCollectiveResourceAny",
    loseCollectiveResourceType = "loseCollectiveResourceType",
    loseGold = "loseGold",
    loseGoldOne = "loseGoldOne",
    loseMorale = "loseMoral",
    loseProsperity = "loseProsperity",
    loseReputation = "loseReputation",
    morale = "morale",
    noEffect = "noEffect",
    outcome = "outcome",
    outpostAttack = "outpostAttack",
    randomItemDesign = "randomItemDesign",
    removeEvent = "removeEvent",
    removeEventFH = "removeEventFH",
    reputation = "reputation",
    reputationAdditional = "reputationAdditional",
    resource = "resource",
    resourceType = "resourceType",
    partyAchievement = "partyAchievement",
    prosperity = "prosperity",
    scenarioCondition = "scenarioCondition",
    scenarioDamage = "scenarioDamage",
    scenarioSingleMinus1 = "scenarioSingleMinus1",
    soldier = "soldier",
    soldiers = "soldiers",
    unlockScenario = "unlockScenario",
    unlockScenarioGroup = "unlockScenarioGroup"
}

export const EventCardApplyEffects: EventCardEffectType[] = [EventCardEffectType.battleGoal, EventCardEffectType.campaignSticker, EventCardEffectType.drawAnotherEvent, EventCardEffectType.drawEvent, EventCardEffectType.event, EventCardEffectType.eventFH, EventCardEffectType.experience, EventCardEffectType.globalAchievement, EventCardEffectType.gold, EventCardEffectType.goldAdditional, EventCardEffectType.inspiration, EventCardEffectType.loseBattleGoal, EventCardEffectType.loseGold, EventCardEffectType.loseMorale, EventCardEffectType.loseProsperity, EventCardEffectType.loseReputation, EventCardEffectType.morale, EventCardEffectType.partyAchievement, EventCardEffectType.prosperity, EventCardEffectType.removeEvent, EventCardEffectType.removeEventFH, EventCardEffectType.reputation, EventCardEffectType.reputationAdditional, EventCardEffectType.scenarioCondition, EventCardEffectType.scenarioDamage, EventCardEffectType.scenarioSingleMinus1, EventCardEffectType.soldier, EventCardEffectType.soldiers, EventCardEffectType.unlockScenario, EventCardEffectType.unlockScenarioGroup];

export class EventCardEffect {
    condition: string | EventCardCondition | undefined;
    type: EventCardEffectType = EventCardEffectType.noEffect;
    values: (string | number | EventCardEffect)[] = [];
}

export enum EventCardConditionType {
    building = "building",
    character = "character",
    class = "class",
    loseCollectiveResource = "loseCollectiveResource",
    or = "or",
    otherwise = "otherwise",
    payGold = "payGold",
    payCollectiveGold = "payCollectiveGold",
    payCollectiveItem = "payCollectiveItem",
    reputationGT = "reputationGT",
    reputationLT = "reputationLT",
    season = "season",
    trait = "trait"
}

export class EventCardCondition {
    type: EventCardConditionType = EventCardConditionType.otherwise;
    values: (string | number | EventCardCondition)[] = [];
    effect: EventCardEffect | undefined;
}

export class EventCardAttack {
    attackValue: number;
    targetNumber: number;
    targetDescription: string;
    narrative: string;
    effects: string[];

    constructor(attackValue: number, targetNumber: number, targetDescription: string, narrative: string, effects: string[]) {
        this.attackValue = attackValue;
        this.targetNumber = targetNumber;
        this.targetDescription = targetDescription;
        this.narrative = narrative;
        this.effects = effects;
    }
}