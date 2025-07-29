import { sortAction } from './action.mjs';
import { removeEmptyValues, sortObjectKeys } from './sort-helper.mjs';

export const sortSummon = function (summon) {

    if (summon) {
        if (summon.action) {
            summon.action = sortAction(summon.action);
        }

        if (summon.additionalAction) {
            summon.additionalAction = sortAction(summon.additionalAction);
        }

        removeEmptyValues(summon);
    }

    return sortObjectKeys(summon, 'name', 'cardId', 'thumbnail', 'level', 'edition', 'health', 'attack', 'movement', 'range', 'flying', 'special', 'count', 'enhancements', 'action', 'additionalAction');
}