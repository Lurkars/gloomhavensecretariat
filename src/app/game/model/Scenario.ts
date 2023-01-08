import { ScenarioData } from "./data/ScenarioData";

export class Scenario extends ScenarioData {

  custom: boolean;
  revealedRooms: number[];

  constructor(scenarioData: ScenarioData, revealedRooms: number[] = [], custom: boolean = false) {
    super(scenarioData.name, scenarioData.index, scenarioData.unlocks, scenarioData.blocks, scenarioData.requires, scenarioData.links, scenarioData.monsters, scenarioData.allies, scenarioData.drawExtra, scenarioData.objectives, scenarioData.rooms, scenarioData.marker, scenarioData.rules, scenarioData.edition, scenarioData.group, scenarioData.spoiler, scenarioData.allyDeck);
    this.solo = scenarioData.solo;
    this.revealedRooms = revealedRooms;
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

export class GameScenarioModel {

  index: string;
  edition: string;
  group: string | undefined;
  isCustom: boolean;
  custom: string;
  revealedRooms: number[] | undefined;

  constructor(index: string,
    edition: string,
    group: string | undefined,
    isCustom: boolean,
    custom: string,
    revealedRooms: number[]) {
    this.index = index;
    this.edition = edition;
    this.group = group;
    this.isCustom = isCustom;
    this.custom = custom;
    this.revealedRooms = revealedRooms;
  }
}