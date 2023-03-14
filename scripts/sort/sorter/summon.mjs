import { sortObjectKeys } from './sort-helper.mjs';

export const sortSummon = function (summon) {
    return sortObjectKeys(summon, 'name', 'cardId', 'thumbnail', 'level', 'edition', 'health', 'attack', 'movement', 'range', 'flying', 'special', 'count', 'action', 'additionalAction');
}