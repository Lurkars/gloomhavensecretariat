import { sortObjectKeys } from "./sort-object-keys.mjs";

export const sortSummon = function (summon) {
    return sortObjectKeys(summon, 'name', 'cardId', 'level', 'edition', 'health', 'attack', 'movement', 'range', 'flying', 'special', 'count', 'thumbnail', 'action', 'additionalAction');
}