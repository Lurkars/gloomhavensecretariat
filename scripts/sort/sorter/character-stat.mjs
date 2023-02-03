import { sortObjectKeys } from "./sort-object-keys.mjs";

export const sortCharacterStat = function (characterStat) {
    return sortObjectKeys(characterStat, 'level', 'health');
}