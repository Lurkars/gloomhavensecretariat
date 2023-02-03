import { sortObjectKeys } from "./sort-object-keys.mjs";

export const sortSummon = function (summon) {
    return sortObjectKeys(summon, 'name', 'health', 'movement', 'attack', 'range', 'automatic', 'level');
}