import { ScenarioData } from "./data/ScenarioData";

export class Scenario extends ScenarioData {

  custom: boolean;
  revealedRooms: number[];

  constructor(scenarioData: ScenarioData, revealedRooms: number[] = [], custom: boolean = false) {
    super(scenarioData);
    this.solo = scenarioData.solo;
    this.revealedRooms = JSON.parse(JSON.stringify(revealedRooms));
    if (scenarioData.rooms) {
      scenarioData.rooms.forEach((roomData) => {
        if (roomData.initial && this.revealedRooms.indexOf(roomData.roomNumber) == -1) {
          this.revealedRooms.push(roomData.roomNumber);
        }
      })
    }
    this.custom = custom;
  }
}

export class ScenarioCache extends ScenarioData {

  isSuccess: boolean;
  isBlocked: boolean;
  isLocked: boolean;

  constructor(scenarioData: ScenarioData, isSuccess: boolean, isBlocked: boolean, isLocked: boolean) {
    super(scenarioData);
    this.isSuccess = isSuccess;
    this.isBlocked = isBlocked;
    this.isLocked = isLocked;
  }

}

export class GameScenarioModel {

  index: string;
  edition: string;
  group: string | undefined;
  isCustom: boolean;
  custom: string;
  revealedRooms: number[] | undefined;

  constructor(index: string,
    edition: string,
    group: string | undefined = undefined,
    isCustom: boolean = false,
    custom: string = '',
    revealedRooms: number[] | undefined = undefined) {
    this.index = index;
    this.edition = edition;
    this.group = group;
    this.isCustom = isCustom;
    this.custom = custom;
    this.revealedRooms = revealedRooms;
  }
}