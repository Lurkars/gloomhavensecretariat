import { sortMonsterStandees } from "./monster-standees.mjs";
import { sortObjectKeys } from './sort-helper.mjs';

export const sortRoom = function (room) {

    Object.keys(room).forEach((key) => {
        if (!room[key]) {
            room[key] = undefined;
        }
    });

    if (room.monster) {
        room.monster = room.monster.map((standeeData) => sortObjectKeys(standeeData, 'name', 'type', 'player2', 'player3', 'player4', 'marker', 'tags'));
        room.monster = sortMonsterStandees(room.monster);
    }

    return sortObjectKeys(room, 'roomNumber', 'ref', 'initial', 'marker', 'rooms', 'treasures', 'monster', 'allies', 'objectives');
} 