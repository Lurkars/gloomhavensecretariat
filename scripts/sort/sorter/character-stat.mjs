import { sortObjectKeys } from './sort-helper.mjs';

export const sortCharacterStat = function (characterStat) {
    return sortObjectKeys(characterStat, 'level', 'health', 'permanentConditions');
}