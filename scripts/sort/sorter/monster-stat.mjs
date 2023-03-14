import { sortAction } from './action.mjs';
import { sortObjectKeys } from './sort-helper.mjs';

export const sortMonsterStat = function (monsterStat) {

    if (monsterStat.actions) {
        monsterStat.actions = monsterStat.actions.map((action) => sortAction(action));
    }

    if (monsterStat.special) {
        monsterStat.special.map((special) => special.map((action) => sortAction(action)));
    }

    return sortObjectKeys(monsterStat, 'type', 'level', 'health', 'movement', 'attack', 'range', 'note', 'actions', 'immunities', 'special');
}