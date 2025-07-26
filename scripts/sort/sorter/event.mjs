import { sortObjectKeys } from './sort-helper.mjs';

export const sortEvent = function (event) {

    if (event.options) {
        event.options = event.options.map((option) => sortEventOption(option));
        event.options.sort((a, b) => {
            return a.label < b.label ? -1 : 1;
        })
    }

    return sortObjectKeys(event, 'cardId', 'edition', 'type', 'narrative', 'options');
}

export const sortEventOption = function (option) {

    if (option.outcomes) {
        option.outcomes = option.outcomes.map((outcome) => sortEventOutcome(outcome));
    }

    return sortObjectKeys(option, 'label', 'narrative', 'returnToDeck', 'removeFromDeck', 'outcomes');
}

export const sortEventOutcome = function (outcome) {
    if (outcome.effects) {
        outcome.effects = outcome.effects.map((effect) => sortEventEffect(effect));
    }

    if (outcome.condition) {
        outcome.condition = sortEventCondition(outcome.condition);
    }

    return sortObjectKeys(outcome, 'condition', 'narrative', 'returnToDeck', 'removeFromDeck', 'inlineEffects', 'effects');
}

export const sortEventEffect = function (effect) {
    if (typeof effect === 'string') {
        return effect;
    }

    if (effect.condition) {
        effect.condition = sortEventCondition(effect.condition);
    }

    return sortObjectKeys(effect, 'condition', 'type', 'alt', 'values');
}

export const sortEventCondition = function (condition) {

    if (typeof condition === 'string') {
        return condition;
    }

    if (condition.effect) {
        condition.effect = sortEventEffect(condition.effect);
    }

    return sortObjectKeys(condition, 'type', 'values', 'effect');
}