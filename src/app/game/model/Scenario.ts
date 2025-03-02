import { ScenarioData } from "./data/ScenarioData";

export class Scenario extends ScenarioData {

  custom: boolean;
  revealedRooms: number[];
  additionalSections: string[] = [];

  constructor(scenarioData: ScenarioData, revealedRooms: number[] = [], additionalSections: string[] = [], custom: boolean = false) {
    super(scenarioData);
    this.solo = scenarioData.solo;
    this.revealedRooms = JSON.parse(JSON.stringify(revealedRooms));
    this.additionalSections = JSON.parse(JSON.stringify(additionalSections));
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

export class ScenarioMissingRequirements {
  globalAchievements: string[] = [];
  globalAchievementsCount: { name: string, count: number, required: number }[] = [];
  globalAchievementsMissing: string[] = [];
  partyAchievements: string[] = [];
  partyAchievementsCount: { name: string, count: number, required: number }[] = [];
  partyAchievementsMissing: string[] = [];
  campaignStickers: string[] = [];
  campaignStickersCount: { name: string, count: number, required: number }[] = [];
  campaignStickersMissing: string[] = [];
  buildings: string[] = [];
  buildingsLevel: { name: string, level: number }[] = [];
  buildingsLevelMissing: { name: string, level: number }[] = [];
  buildingsMissing: string[] = [];
  characters: string[] = [];
  charactersMissing: string[] = [];
  scenarios: string[][] = [];

  isEmpty(): boolean {
    return this.buildings.length == 0 && this.buildingsLevel.length == 0 && this.buildingsMissing.length == 0 && this.buildingsLevelMissing.length == 0 && this.campaignStickers.length == 0 && this.campaignStickersCount.length == 0 && this.campaignStickersMissing.length == 0 && this.globalAchievements.length == 0 && this.globalAchievementsCount.length == 0 && this.globalAchievementsMissing.length == 0 && this.partyAchievements.length == 0 && this.partyAchievementsCount.length == 0 && this.partyAchievementsMissing.length == 0 && this.characters.length == 0 && this.charactersMissing.length == 0 && this.scenarios.length == 0;
  }
}

export class GameScenarioModel {

  index: string;
  edition: string;
  group: string | undefined;
  isCustom: boolean;
  custom: string;
  revealedRooms: number[] | undefined;
  additionalSections: string[] | undefined;

  constructor(index: string,
    edition: string,
    group: string | undefined = undefined,
    isCustom: boolean = false,
    custom: string = '',
    revealedRooms: number[] | undefined = undefined,
    additionalSections: string[] | undefined = undefined) {
    this.index = index;
    this.edition = edition;
    this.group = group;
    this.isCustom = isCustom;
    this.custom = custom;
    this.revealedRooms = revealedRooms;
    this.additionalSections = additionalSections;
  }
}