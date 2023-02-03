import { sortObjectKeys } from "./sort-object-keys.mjs";

export const sortAction = function (action) {

    if (action.subActions) {
        action.subActions = action.subActions.sort((subAction) => sortAction(subAction));
    }

    return sortObjectKeys(action, 'type', 'value', 'valueType', 'small', 'subActions');
}