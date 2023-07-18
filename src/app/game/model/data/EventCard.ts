import { ScenarioFigureRule, ScenarioRewards } from "./ScenarioRule";

export class EventCard {

    cardId: number;
    type: string;
    text: string;
    options: EventCardOption[];
    constructor(cardId: number, type: string, text: string, options: EventCardOption[]) {
        this.cardId = cardId;
        this.type = type;
        this.text = text;
        this.options = options;
    }
}

export class EventCardOption {

    choice: string;
    outcome: string;
    effects: EventCardEffect[][];

    constructor(choice: string, outcome: string, effects: EventCardEffect[][]) {
        this.choice = choice;
        this.outcome = outcome;
        this.effects = effects;
    }
}

export class EventCardEffect {

    condition: ScenarioRewards | undefined;
    reward: ScenarioRewards | undefined;
    rule: ScenarioFigureRule | undefined;
    toBottom: boolean = false;
}