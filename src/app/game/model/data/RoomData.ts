import { MonsterType } from "../MonsterType";

export class RoomData {
    room: number = 0;
    initial: boolean = false;
    map: string = "";
    rotation: 0 | 1 | 2 | 3 = 0;
    overlays: RoomOverlayData[] = [];
    monster: RoomMonsterData[] = [];
    doors: RoomDoorData[] = [];
}

export type RoomCoordinate = { "x": number, "y": number };

export class RoomMonsterData {
    name: string = "";
    coordinate: RoomCoordinate = { "x": 0, "y": 0 };
    player2: MonsterType | undefined;
    player3: MonsterType | undefined;
    player4: MonsterType | undefined;
}

export enum RoomOverlayType {
    corridor = "corridor",
    difficult_terrain = "difficult_terrain",
    hazardous_terrain = "hazardous_terrain",
    marker = "marker",
    obstalce = "obstacle",
    start = "start",
    trap = "trap",
    treasure = "treasure"
}

export class RoomOverlayData {
    type: RoomOverlayType = RoomOverlayType.corridor;
    coordinates: RoomCoordinate[] = [];
    vertical: boolean = false;
    token: string = "";
    value: string = "";
}

export class RoomDoorData {
    coordinate: RoomCoordinate = { "x": 0, "y": 0 };
    token: string = "";
    room: number = 0;
    section: string = "";
}