import { sortMonsterStandees } from "./monster-standees.mjs";
import { sortObjectKeys } from "./sort-object-keys.mjs";

export const sortRoom = function (room) {

    Object.keys(room).forEach((key) => {
        if (!room[key]) {
            room[key] = undefined;
        }
    });

    if (room.monster) {
        room.monster = sortMonsterStandees(room.monster);
    }

    return sortObjectKeys(room, 'roomNumber', 'ref', 'initial', 'marker', 'rooms', 'treasures', 'monster', 'allies', 'objectives');
} 