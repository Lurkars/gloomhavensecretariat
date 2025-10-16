import { Editional } from "./Editional";

export class EventCard implements Editional {
    cardId: string;
    edition: string;
    type: string;
    narrative: string;
    options: EventCardOption[];
    attack?: EventCardAttack;
    requirement: EventCardRequirement | undefined;

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
    checks: number[];
    scenarioApply: boolean;

    constructor(cardId: string, edition: string, type: string, selected: number,
        subSelections: number[] = [], checks: number[] = [], scenarioApply: boolean = false) {
        this.cardId = cardId;
        this.edition = edition;
        this.type = type;
        this.selected = selected;
        this.subSelections = subSelections;
        this.checks = checks;
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
    narrative: string = "";
    returnToDeck?: boolean;
    removeFromDeck?: boolean;
    condition: string | EventCardCondition | undefined;
    inlineEffects?: boolean;
    effects: (string | EventCardEffect)[] = [];
    attack: EventCardAttack | undefined;
}

export enum EventCardConditionType {
    and = "and",
    building = "building",
    campaignSticker = "campaignSticker",
    character = "character",
    class = "class",
    loseCollectiveResource = "loseCollectiveResource",
    loseCollectiveResourceType = "loseCollectiveResourceType",
    moraleGT = "moraleGT",
    moraleLT = "moraleLT",
    otherwise = "otherwise",
    payGold = "payGold",
    payCollectiveGold = "payCollectiveGold",
    payCollectiveGoldConditional = "payCollectiveGoldConditional",
    payCollectiveGoldReputationGT = "payCollectiveGoldReputationGT",
    payCollectiveGoldReputationLT = "payCollectiveGoldReputationLT",
    payCollectiveItem = "payCollectiveItem",
    reputationGT = "reputationGT",
    reputationLT = "reputationLT",
    season = "season",
    seasonLT = "seasonLT",
    traits = "traits"
}

export enum EventCardEffectType {
    and = "and",
    battleGoal = "battleGoal",
    campaignSticker = "campaignSticker",
    campaignStickerMap = "campaignStickerMap",
    campaignStickerReplace = "campaignStickerReplace",
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
    custom = "custom",
    discard = "discard",
    discardOne = "discardOne",
    drawAnotherEvent = "drawAnotherEvent",
    drawEvent = "drawEvent",
    event = "event",
    eventReturn = "eventReturn",
    eventsToTop = "eventsToTop",
    experience = "experience",
    globalAchievement = "globalAchievement",
    gold = "gold",
    goldAdditional = "goldAdditional",
    inspiration = "inspiration",
    item = "item",
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
    loseMorale = "loseMorale",
    loseProsperity = "loseProsperity",
    loseReputation = "loseReputation",
    loseResource = "loseResource",
    morale = "morale",
    noEffect = "noEffect",
    outcome = "outcome",
    outpostAttack = "outpostAttack",
    outpostTarget = "outpostTarget",
    randomItem = "randomItem",
    randomItemDesign = "randomItemDesign",
    randomScenario = "randomScenario",
    removeEvent = "removeEvent",
    reputation = "reputation",
    reputationAdditional = "reputationAdditional",
    resource = "resource",
    resourceType = "resourceType",
    partyAchievement = "partyAchievement",
    prosperity = "prosperity",
    scenarioCondition = "scenarioCondition",
    scenarioDamage = "scenarioDamage",
    scenarioSingleMinus1 = "scenarioSingleMinus1",
    sectionWeek = "sectionWeek",
    sectionWeeks = "sectionWeeks",
    sectionWeeksSeason = "sectionWeeksSeason",
    soldier = "soldier",
    soldiers = "soldiers",
    townGuardDeckCard = "townGuardDeckCard",
    townGuardDeckCards = "townGuardDeckCards",
    unlockEnvelope = "unlockEnvelope",
    unlockScenario = "unlockScenario",
    unlockScenarioGroup = "unlockScenarioGroup",
    upgradeBuilding = "upgradeBuilding"
}

export class EventCardEffect {
    condition: string | EventCardCondition | undefined;
    type: EventCardEffectType = EventCardEffectType.noEffect;
    values: (string | number | EventCardEffect)[] = [];
    alt: boolean = false;

    constructor(type: EventCardEffectType, values: (string | number | EventCardEffect)[] = []) {
        this.type = type;
        this.values = values;
    }
}

export class EventCardCondition {
    type: EventCardConditionType = EventCardConditionType.otherwise;
    values: (string | number | EventCardCondition)[] = [];
    effect: EventCardEffect | undefined;
}

export class EventCardAttack {
    attackValue: string | number;
    targetNumber: string | number;
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

export class EventCardRequirement {
    partyAchievement: string | undefined;
}