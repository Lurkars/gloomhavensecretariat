import { sortAction } from './action.mjs';
import { sortObjectKeys, removeEmptyValues } from './sort-helper.mjs';

export const sortMonsterStat = function (monsterStat) {

    if (monsterStat.actions) {
        if (!monsterStat.actions.length) {
            monsterStat.actions = undefined;
        } else {
            monsterStat.actions = monsterStat.actions.map((action) => sortAction(action));
        }
    }

    if (monsterStat.special) {
        if (!monsterStat.special.length) {
            monsterStat.special = undefined;
        } else {
            monsterStat.special = monsterStat.special.map((special) => special.map((action) => sortAction(action)));
        }
    }

    if (monsterStat.immunities && !monsterStat.immunities.length) {
        monsterStat.immunities = undefined;
    }

    removeEmptyValues(monsterStat, 'level', 'health');

    return sortObjectKeys(monsterStat, 'type', 'level', 'health', 'movement', 'attack', 'range', 'note', 'actions', 'immunities', 'special');
}