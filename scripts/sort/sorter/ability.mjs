import { sortAction } from './action.mjs';
import { sortObjectKeys } from './sort-helper.mjs';

export const sortAbility = function (ability) {

    if (ability.actions) {
        ability.actions = ability.actions.map((action) => sortAction(action));
    }

    if (ability.bottomActions) {
        ability.bottomActions = ability.bottomActions.map((action) => sortAction(action));
    }

    return sortObjectKeys(ability, 'name', 'cardId', 'replace', 'level', 'initiative', 'hint', 'shuffle', 'lost', 'loss', 'actions', 'bottomHint', 'bottomShuffle', 'bottomLost', 'bottomLoss', 'bottomActions');
}