import { gameManager } from "../businesslogic/GameManager";
import { settingsManager } from "../businesslogic/SettingsManager";
import { BuildingModel, GardenModel } from "./Building";
import { GameCharacterModel } from "./Character";
import { GameAttackModifierDeckModel } from "./data/AttackModifier";
import { ConditionName } from "./data/Condition";
import { EventCardIdentifier } from "./data/EventCard";
import { CountIdentifier, Identifier } from "./data/Identifier";
import { Loot, LootType } from "./data/Loot";
import { PetIdentifier } from "./data/PetCard";
import { GameScenarioModel } from "./Scenario";

export class Party {

  id: number = 0;
  name: string = "";
  edition: string | undefined;
  conditions: ConditionName[] = [];
  battleGoalEditions: string[] = [];
  filteredBattleGoals: Identifier[] = [];
  location: string = "";
  notes: string = "";
  achievements: string = "";
  achievementsList: string[] = [];
  reputation: number = 0;
  prosperity: number = 0;
  scenarios: GameScenarioModel[] = [];
  conclusions: GameScenarioModel[] = [];
  casualScenarios: GameScenarioModel[] = [];
  manualScenarios: GameScenarioModel[] = [];
  campaignMode: boolean = false;
  globalAchievements: string = "";
  globalAchievementsList: string[] = [];
  treasures: Identifier[] = [];
  donations: number = 0;
  players: string[] = [];
  characters: GameCharacterModel[] = [];
  availableCharacters: GameCharacterModel[] = [];
  retirements: GameCharacterModel[] = [];
  unlockedItems: CountIdentifier[] = [];
  unlockedCharacters: string[] = [];
  level: number = 1;
  levelCalculation: boolean = true;
  levelAdjustment: number = 0;
  bonusAdjustment: number = 0;
  ge5Player: boolean = true;
  playerCount: number = -1;
  solo: boolean = false;
  envelopeB: boolean = false;
  eventDecks: Partial<Record<string, string[]>> = {};
  eventCards: EventCardIdentifier[] = [];

  // FH
  weeks: number = 0;
  weekSections: Partial<Record<number, string[]>> = {};
  loot: Partial<Record<LootType, number>> = {};
  randomItemLooted: GameScenarioModel[] = [];
  inspiration: number = 0;
  defense: number = 0;
  soldiers: number = 0;
  morale: number = 0;
  townGuardPerks: number = 0;
  townGuardPerkSections: string[] = [];
  campaignStickers: string[] = [];
  townGuardDeck: GameAttackModifierDeckModel | undefined;
  buildings: BuildingModel[] = [];
  pets: PetIdentifier[] = [];

  lootDeckEnhancements: Loot[] = [];
  lootDeckFixed: LootType[] = [];
  lootDeckSections: string[] = [];

  trials: number = -1;
  garden: GardenModel | undefined;

  // GH2E
  factionReputation: Partial<Record<string, number>> = {};;
  imbuement: number = 0;


  migrate() {
    // migration
    if (this.achievementsList) {
      const partyAchievementsLabel = settingsManager.label.data.partyAchievements;
      let partyAchievementsLabelEn = settingsManager.label.data.globalAchievements;
      if (settingsManager.settings.locale != settingsManager.defaultLocale) {
        partyAchievementsLabelEn = gameManager.editionData.map((editionData) => editionData.label[settingsManager.defaultLocale] && editionData.label[settingsManager.defaultLocale].globalAchievements || {}).reduce((a, b) => Object.assign(a, b));
      }
      this.achievementsList = this.achievementsList.filter((item) => item);
      this.achievementsList = this.achievementsList.map((value) => {
        let achievement = value;
        if (value.startsWith('!')) {
          achievement = achievement.slice(1, achievement.length);
        }
        Object.keys(partyAchievementsLabel).forEach((key) => {
          if (partyAchievementsLabel[key].toLowerCase() == achievement.toLowerCase()) {
            achievement = key;
          } else if (partyAchievementsLabelEn[key] && partyAchievementsLabelEn[key].toLowerCase() == achievement.toLowerCase()) {
            achievement = key;
          }
        })
        if (value.startsWith('!')) {
          achievement = '!' + achievement;
        }
        return achievement;
      })
    }

    if (this.globalAchievementsList) {
      const globalAchievementsLabel = settingsManager.label.data.globalAchievements;
      let globalAchievementsLabelEn = settingsManager.label.data.globalAchievements;
      if (settingsManager.settings.locale != settingsManager.defaultLocale) {
        globalAchievementsLabelEn = gameManager.editionData.map((editionData) => editionData.label[settingsManager.defaultLocale] && editionData.label[settingsManager.defaultLocale].globalAchievements || {}).reduce((a, b) => Object.assign(a, b));
      }
      this.globalAchievementsList = this.globalAchievementsList.filter((item) => item);
      this.globalAchievementsList = this.globalAchievementsList.map((value) => {
        let achievement = value;
        if (value.startsWith('!')) {
          achievement = achievement.slice(1, achievement.length);
        }
        Object.keys(globalAchievementsLabel).forEach((key) => {
          if (globalAchievementsLabel[key].toLowerCase() == achievement.toLowerCase()) {
            achievement = key;
          } else if (globalAchievementsLabelEn[key] && globalAchievementsLabelEn[key].toLowerCase() == achievement.toLowerCase()) {
            achievement = key;
          }
        })
        if (value.startsWith('!')) {
          achievement = '!' + achievement;
        }
        return achievement;
      })
    }

    if (this.campaignStickers) {
      this.campaignStickers = this.campaignStickers.filter((item) => item).map((value) => {
        let sticker = value;
        Object.keys(settingsManager.label.data.campaignSticker).forEach((key) => {
          if (settingsManager.label.data.campaignSticker[key] == sticker) {
            sticker = key;
            return;
          }
        })
        return sticker;
      })
    }

    // migrate randomScenarios to randomScenariosFh
    if (this.manualScenarios) {
      let removeManual: GameScenarioModel[] = [];
      this.manualScenarios.forEach((model) => {
        if (model.edition == 'fh' && !model.group && !model.custom) {
          const conclusion = gameManager.sectionData('fh').find((sectionData) => sectionData.random && sectionData.unlocks && sectionData.unlocks.indexOf(model.index) != -1);
          if (conclusion) {
            if (!this.conclusions.find((conclusionModel) => conclusionModel.edition == conclusion.edition && conclusionModel.group == conclusion.group && conclusionModel.index == conclusion.index)) {
              this.conclusions.push(new GameScenarioModel('' + conclusion.index, conclusion.edition, conclusion.group));
              removeManual.push(model);
            }
          }
        }
      })
      this.manualScenarios = this.manualScenarios.filter((model) => removeManual.indexOf(model) == -1);
    }

    this.players = this.players || [];
    this.casualScenarios = this.casualScenarios || [];
    this.pets = this.pets || [];

    this.eventDecks = this.eventDecks || {};
    this.eventCards = this.eventCards || [];

    if (this.campaignMode && settingsManager.settings.events) {
      gameManager.eventCardManager.buildPartyDeckMigration(this.edition || gameManager.currentEdition());
    }
  }

}