import { MonsterType } from "../MonsterType";

export class RoomData {
    roomNumber: number = 0;
    ref: string = "";
    initial: boolean = false;
    marker: string = "";
    rooms: number[] = [];
    treasures: ('G' | number)[] = [];
    monster: MonsterStandeeData[] = [];
    allies: string[] = [];
    objectives: (string | number)[] = [];
}

export class MonsterStandeeData {
    name: string = "";
    marker: string = "";
    tags: string[] = [];
    type: MonsterType | undefined;
    player2: MonsterType | undefined;
    player3: MonsterType | undefined;
    player4: MonsterType | undefined;
    health: string | number | undefined;

    constructor(name: string) {
        this.name = name;
    }
}