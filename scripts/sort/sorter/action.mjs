import { sortObjectKeys } from './sort-helper.mjs';
import { sortSummon } from './summon.mjs';

export const sortAction = function (action) {

    if (action.subActions) {
        action.subActions = action.subActions.map((subAction) => sortAction(subAction));

        if (action.subActions.length == 0) {
            delete action.subActions;
        }
    }

    if (action.hidden == false) {
        delete action.hidden;
    }

    if (action.small == false) {
        delete action.small;
    }

    if (action.enhancementTypes && action.enhancementTypes.length == 0) {
        delete action.enhancementTypes;
    }

    if (action.type == 'summon' && action.value == 'summonData' && action.valueObject) {
        action.valueObject = sortSummon(action.valueObject);
    }

    // sort area effects by coordinates
    if (action.type === 'area' && action.value) {
        let hexes = [];

        action.value.split('|').forEach((hexString) => {
            let groups = new RegExp(/^\((\d+),(\d+),(active|target|conditional|ally|blank|enhance|invisible)(\:(\w*))?\)$/).exec(hexString);
            if (groups == null) {
                return null;
            }

            let actionHex = {};
            actionHex.x = +groups[1];
            actionHex.y = +groups[2];
            actionHex.type = groups[3];
            if (groups.length > 5 && groups[5]) {
                actionHex.value = groups[5];
            }
            hexes.push(actionHex)
        })

        hexes.sort((a, b) => {
            if (a.x == b.x) {
                return a.y - b.y;
            }

            return a.x - b.x;
        })

        action.value = hexes.map((actionHex) => "(" + actionHex.x + "," + actionHex.y + "," + actionHex.type + (actionHex.value ? ":" + actionHex.value : "") + ")").join('|');
    }

    return sortObjectKeys(action, 'type', 'value', 'valueType', 'valueObject', 'small', 'enhancementTypes', 'subActions');
}