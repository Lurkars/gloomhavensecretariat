import { Editional } from "./Editional";

export class EventCard implements Editional {
    cardId: number;
    edition: string;
    type: string;
    narrative: string;
    options: EventCardOption[];
    attack?: EventCardAttack;

    constructor(cardId: number, edition: string, type: string, narrative: string, options: EventCardOption[], attack?: EventCardAttack) {
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

export class EventCardOption {
    label: string;
    narrative: string;
    outcomes: EventCardOutcome[];
    removeFromDeck?: boolean;
    returnToDeck?: boolean;

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
    condition?: string;
    effects: string[];
    removeFromDeck?: boolean;
    returnToDeck?: boolean;

    constructor(narrative: string, effects: string[], condition?: string, removeFromDeck?: boolean, returnToDeck?: boolean) {
        this.narrative = narrative;
        this.effects = effects;
        if (condition) this.condition = condition;
        if (removeFromDeck !== undefined) this.removeFromDeck = removeFromDeck;
        if (returnToDeck !== undefined) this.returnToDeck = returnToDeck;
    }
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