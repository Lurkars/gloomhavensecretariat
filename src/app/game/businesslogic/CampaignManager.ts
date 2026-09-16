import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CampaignData, FH_PROSPERITY_STEPS, GH2E_PROSPERITY_STEPS, GH_PROSPERITY_STEPS } from 'src/app/game/model/data/EditionData';
import { Game } from 'src/app/game/model/Game';
import { ghsClamp } from 'src/app/ui/helper/Static';

export class CampaignManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  campaignData(edition: string | undefined = undefined): CampaignData {
    edition = edition || gameManager.currentEdition();
    const editionData = gameManager.editionData.find((editionData) => editionData.edition === edition);

    if (editionData && editionData.campaign) {
      return Object.assign(new CampaignData(), editionData.campaign);
    }

    const extensionCampaign = gameManager
      .relevantEditions(edition)
      .map((e) => gameManager.editionData.find((editionData) => editionData.edition === e))
      .map((editionData) => (editionData ? editionData.campaign : undefined))
      .find((campaignData) => campaignData);
    if (extensionCampaign) {
      return Object.assign(new CampaignData(), extensionCampaign);
    }

    return new CampaignData();
  }

  resetCampaign() {
    this.game.figures = [];
    this.game.party.characters = [];
    this.game.party.location = '';
    this.game.party.achievements = '';
    this.game.party.achievementsList = [];
    this.game.party.reputation = 0;
    this.game.party.prosperity = 0;
    this.game.party.scenarios = [];
    this.game.party.conclusions = [];
    this.game.party.casualScenarios = [];
    this.game.party.manualScenarios = [];
    this.game.party.globalAchievements = '';
    this.game.party.globalAchievementsList = [];
    this.game.party.treasures = [];
    this.game.party.donations = 0;
    this.game.party.retirements = [];
    this.game.party.unlockedItems = [];
    this.game.party.unlockedCharacters = [];
    this.game.party.envelopeB = false;
    this.game.party.weeks = 0;
    this.game.party.weekSections = [];
    this.game.party.loot = {};
    this.game.party.randomItemLooted = [];
    this.game.party.inspiration = 0;
    this.game.party.defense = 0;
    this.game.party.soldiers = 0;
    this.game.party.morale = 0;
    this.game.party.townGuardPerks = 0;
    this.game.party.townGuardPerkSections = [];
    this.game.party.campaignStickers = [];
    this.game.party.townGuardDeck = undefined;
    this.game.party.buildings = [];
    this.game.party.lootDeckEnhancements = [];
    this.game.party.lootDeckFixed = [];
    this.game.party.lootDeckSections = [];
  }

  prosperitySteps(): number[] {
    if (gameManager.fhRules()) {
      return FH_PROSPERITY_STEPS;
    } else if (gameManager.gh2eRules()) {
      return GH2E_PROSPERITY_STEPS;
    }
    return GH_PROSPERITY_STEPS;
  }

  prosperityLevel(): number {
    let prosperityLevel = 1;
    this.prosperitySteps().forEach((step) => {
      if (this.prosperityTicks() > step) {
        prosperityLevel++;
      }
    });
    return prosperityLevel;
  }

  prosperityTicks(): number {
    let ticks = this.game.party.prosperity;
    if ((this.game.party.envelopeB && gameManager.editionRules('gh')) || gameManager.editionRules('cs')) {
      if (!gameManager.editionRules('cs')) {
        ticks += 1;
      }
      if (this.game.party.donations > 10) {
        ticks += Math.floor(Math.min(this.game.party.donations - 10, 30) / 5);
      }

      if (this.game.party.donations > 40) {
        ticks += Math.floor((this.game.party.donations - 40) / 10);
      }
    } else if (gameManager.gh2eRules()) {
      ticks += Math.floor(Math.min(this.game.party.donations, 100) / 5);
      ticks += Math.floor(Math.min(this.game.party.imbuement + 5, 80) / 10);
    }

    return ticks;
  }

  changeReputation(value: number) {
    this.game.party.reputation = ghsClamp(this.game.party.reputation + value, -20, 20);
  }

  changeMorale(value: number) {
    this.game.party.morale = ghsClamp(this.game.party.morale + value, 0, 20);
  }

  changeProsperity(value: number) {
    const steps = this.prosperitySteps();
    this.game.party.prosperity = ghsClamp(this.game.party.prosperity + value, 0, steps[steps.length - 1] + 1);
  }

  changeFactionReputation(faction: string, value: number, force: boolean = false) {
    const current = this.game.party.factionReputation[faction] || 0;
    const unlocked = force || this.gh2eFactionUnlock(faction);
    const max = unlocked ? 20 : Math.max(12, current);
    this.game.party.factionReputation[faction] = ghsClamp(current + value, -10, max);
  }

  gh2eFactionUnlocks(): string[] {
    if (settingsManager.settings.gh2eForceFactionEnvelopes) {
      return this.campaignData('gh2e')?.factions || [];
    }

    const sectionUnlocks = this.game.party.conclusions
      .map((c) => gameManager.scenarioManager.sectionDataForModel(c))
      .filter((sectionData) => {
        if (sectionData) {
          return sectionData.rewards && sectionData.rewards.factionUnlock;
        }
        return false;
      })
      .map((sectionData) => (sectionData && sectionData.rewards && sectionData.rewards.factionUnlock) || '');

    return [...new Set([...sectionUnlocks, ...this.game.party.factionUnlocks])];
  }

  gh2eFactionUnlock(faction: string): boolean {
    return this.gh2eFactionUnlocks().includes(faction);
  }

  unlockGh2eFaction(faction: string) {
    if (!this.game.party.factionUnlocks.includes(faction)) {
      this.game.party.factionUnlocks.push(faction);
    }
  }
}
