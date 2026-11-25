import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { CampaignData, FH_PROSPERITY_STEPS, GH2E_PROSPERITY_STEPS, GH_PROSPERITY_STEPS } from 'src/app/game/model/data/EditionData';
import { LootType } from 'src/app/game/model/data/Loot';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Game } from 'src/app/game/model/Game';
import { Party } from 'src/app/game/model/Party';
import { GameScenarioModel, Scenario } from 'src/app/game/model/Scenario';
import { ghsClamp } from 'src/app/ui/helper/Static';

export type PartyValueField = 'name' | 'location' | 'notes' | 'donations' | 'imbuement' | 'inspiration' | 'defense' | 'townGuardPerks';

const PARTY_TEXT_FIELDS: string[] = ['name', 'location', 'notes'];
const PARTY_NUMBER_FIELDS: string[] = ['donations', 'imbuement', 'inspiration', 'defense', 'townGuardPerks'];

export interface PendingWeekSection {
  week: number;
  index: string;
  edition: string;
  group: string | undefined;
}

export class CampaignManager {
  game: Game;
  // calendar sections of passed weeks waiting to be resolved by the UI (not persisted)
  pendingWeekSections: PendingWeekSection[] = [];

  constructor(game: Game) {
    this.game = game;
  }

  campaignData(edition: string | undefined = undefined): CampaignData {
    edition = edition || gameManager.editionManager.currentEdition();
    const editionData = gameManager.editionManager.editionData.find((editionData) => editionData.edition === edition);

    if (editionData && editionData.campaign) {
      return Object.assign(new CampaignData(), editionData.campaign);
    }

    const extensionCampaign = gameManager.editionManager
      .relevantEditions(edition)
      .map((e) => gameManager.editionManager.editionData.find((editionData) => editionData.edition === e))
      .map((editionData) => (editionData ? editionData.campaign : undefined))
      .find((campaignData) => campaignData);
    if (extensionCampaign) {
      return Object.assign(new CampaignData(), extensionCampaign);
    }

    return new CampaignData();
  }

  startCampaign(edition: string) {
    settingsManager.automaticTheme(edition, this.game.edition);
    this.game.edition = edition;
    this.game.party.campaignMode = true;
    this.game.party.edition = edition;
    gameManager.attackModifierManager.updateDefaultDecks();
    this.game.party.eventDecks = {};
    gameManager.eventCardManager.buildPartyDeckMigration(edition);
    this.setupCampaign();
  }

  setCampaignMode(enabled: boolean) {
    this.game.party.campaignMode = enabled;
    if (enabled) {
      this.setupCampaign();
    }
  }

  setupCampaign() {
    gameManager.buildingsManager.unlockBuildings();
    gameManager.outpostAttackManager.setupTownGuardDeck();
  }

  campaignSetupMissing(): boolean {
    if (!this.game.party.campaignMode) {
      return false;
    }
    const campaign = this.campaignData();
    return (
      gameManager.buildingsManager.buildingsToUnlock().length > 0 ||
      (!!campaign && !!campaign.townGuardPerks && !gameManager.outpostAttackManager.hasTownGuardDeck())
    );
  }

  campaignStarted(): boolean {
    const party = this.game.party;
    return (
      party.scenarios.length > 0 ||
      party.conclusions.length > 0 ||
      party.retirements.length > 0 ||
      party.weeks > 0 ||
      party.buildings.some((model) => model.level > 1 || model.state !== 'normal')
    );
  }

  cancelCampaign() {
    if (!this.campaignStarted()) {
      gameManager.buildingsManager.resetBuildings();
      this.game.party.townGuardDeck = undefined;
    }
    this.game.party.outpostAttack = undefined;
    this.game.edition = undefined;
    this.game.party.campaignMode = false;
    this.game.party.eventDecks = {};
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

  canSetPartyValue(field: PartyValueField, value: string | number): boolean {
    if (PARTY_TEXT_FIELDS.includes(field)) {
      return typeof value === 'string';
    }
    return PARTY_NUMBER_FIELDS.includes(field) && Number.isInteger(value) && (field === 'defense' || (value as number) >= 0);
  }

  setPartyValue(field: PartyValueField, value: string | number): boolean {
    if (!this.canSetPartyValue(field, value)) {
      return false;
    }
    if (field === 'townGuardPerks') {
      return gameManager.outpostAttackManager.setTownGuardPerks(value as number);
    }
    (this.game.party as unknown as Record<string, string | number>)[field] = value;
    if (field === 'donations' && (value as number) < 10) {
      this.game.party.envelopeB = false;
    }
    return true;
  }

  canSetEnvelopeB(envelopeB: boolean): boolean {
    return typeof envelopeB === 'boolean' && this.game.party.envelopeB !== envelopeB;
  }

  setEnvelopeB(envelopeB: boolean): boolean {
    if (!this.canSetEnvelopeB(envelopeB)) {
      return false;
    }
    this.game.party.envelopeB = envelopeB;
    if (this.game.party.donations > 10) {
      this.game.party.donations = 10;
    }
    return true;
  }

  canSetReputation(value: number): boolean {
    return Number.isInteger(value) && value >= -20 && value <= 20;
  }

  setReputation(value: number): boolean {
    if (!this.canSetReputation(value)) {
      return false;
    }
    this.changeReputation(value - this.game.party.reputation);
    return true;
  }

  manualScenario(scenarioData: ScenarioData): GameScenarioModel | undefined {
    return this.game.party.manualScenarios.find(
      (model) => model.index === scenarioData.index && model.edition === scenarioData.edition && model.group === scenarioData.group
    );
  }

  // scenarios already available can not be added manually
  canSetManualScenario(scenarioData: ScenarioData, value: boolean): boolean {
    return (
      !value ||
      !!this.manualScenario(scenarioData) ||
      !gameManager.scenarioManager
        .scenarioData(scenarioData.edition, false)
        .some(
          (available) =>
            available.edition === scenarioData.edition && available.group === scenarioData.group && available.index === scenarioData.index
        )
    );
  }

  setManualScenario(scenarioData: ScenarioData, value: boolean): boolean {
    if (!this.canSetManualScenario(scenarioData, value)) {
      return false;
    }
    const manual = this.manualScenario(scenarioData);
    if (manual && !value) {
      this.game.party.manualScenarios.splice(this.game.party.manualScenarios.indexOf(manual), 1);
    } else if (!manual && value) {
      this.game.party.manualScenarios.push(new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group));
    }
    return true;
  }

  canSetMorale(value: number): boolean {
    return Number.isInteger(value) && value >= 0 && value <= 20;
  }

  setMorale(value: number): boolean {
    if (!this.canSetMorale(value)) {
      return false;
    }
    this.changeMorale(value - this.game.party.morale);
    return true;
  }

  // number of morale conclusions solved in order
  moraleConclusionsSolved(conclusions: string[] | undefined): number {
    let solved = 0;
    while (
      conclusions &&
      solved < conclusions.length &&
      this.game.party.conclusions.some((model) => model.edition === this.game.edition && model.index === conclusions[solved])
    ) {
      solved++;
    }
    return solved;
  }

  /**
   * conclusion to solve after reaching 0 or 20 morale: the next unsolved one, the last low morale conclusion repeats
   * and gets removed to be solved again
   */
  prepareMoraleConclusion(value: number): string | undefined {
    const campaignData = this.campaignData();
    if (!campaignData) {
      return undefined;
    }
    if (value === 0 && campaignData.lowMorale && campaignData.lowMorale.length) {
      const solved = this.moraleConclusionsSolved(campaignData.lowMorale);
      if (solved < campaignData.lowMorale.length) {
        return campaignData.lowMorale[solved];
      }
      const repeated = campaignData.lowMorale[solved - 1];
      this.removeConclusion(this.game.edition, repeated);
      return repeated;
    } else if (value === 20 && campaignData.highMorale) {
      const solved = this.moraleConclusionsSolved(campaignData.highMorale);
      return solved < campaignData.highMorale.length ? campaignData.highMorale[solved] : undefined;
    }
    return undefined;
  }

  maxProsperity(): number {
    const steps = this.prosperitySteps();
    return steps[steps.length - 1] + 1;
  }

  canSetProsperity(value: number): boolean {
    return Number.isInteger(value) && value >= 0 && value <= this.maxProsperity();
  }

  setProsperity(value: number): boolean {
    if (!this.canSetProsperity(value)) {
      return false;
    }
    this.changeProsperity(value - this.game.party.prosperity);
    return true;
  }

  canSetFactionReputation(faction: string, value: number, force: boolean = false): boolean {
    const current = this.game.party.factionReputation[faction] || 0;
    const max = force || this.gh2eFactionUnlock(faction) ? 20 : Math.max(12, current);
    return typeof faction === 'string' && !!faction && Number.isInteger(value) && value >= -10 && value <= max;
  }

  setFactionReputation(faction: string, value: number, force: boolean = false): boolean {
    if (!this.canSetFactionReputation(faction, value, force)) {
      return false;
    }
    if (force && value > 12) {
      this.unlockGh2eFaction(faction);
    }
    this.changeFactionReputation(faction, value - (this.game.party.factionReputation[faction] || 0), force);
    return true;
  }

  canSetWeeks(value: number): boolean {
    return Number.isInteger(value) && value >= 0;
  }

  setWeeks(value: number): boolean {
    if (!this.canSetWeeks(value)) {
      return false;
    }
    for (let week = this.game.party.weeks; week < value; week++) {
      gameManager.campaignManager.passWeekSections(
        week + 1,
        gameManager.editionManager.currentEdition(),
        undefined,
        this.game.party.campaignMode
      );
    }
    this.game.party.weeks = value;
    return true;
  }

  canSetPartyResource(type: LootType, value: number): boolean {
    return Object.values(LootType).includes(type) && Number.isInteger(value) && value >= 0;
  }

  setPartyResource(type: LootType, value: number): boolean {
    if (!this.canSetPartyResource(type, value)) {
      return false;
    }
    this.game.party.loot[type] = value;
    return true;
  }

  changeReputation(value: number) {
    this.game.party.reputation = ghsClamp(this.game.party.reputation + value, -20, 20);
  }

  changeMorale(value: number) {
    this.game.party.morale = ghsClamp(this.game.party.morale + value, 0, 20);
  }

  changeInspiration(value: number) {
    this.game.party.inspiration = Math.max(0, this.game.party.inspiration + value);
  }

  changeProsperity(value: number) {
    const steps = this.prosperitySteps();
    this.game.party.prosperity = ghsClamp(this.game.party.prosperity + value, 0, steps[steps.length - 1] + 1);
    gameManager.buildingsManager.unlockBuildings();
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

  nextPartyId(): number {
    let id = 0;
    while (this.game.parties.some((party) => party.id === id)) {
      id++;
    }
    return id;
  }

  addParty(name: string = ''): Party {
    const party = new Party();
    party.id = this.nextPartyId();
    party.name = name;
    this.game.parties.push(party);
    this.changeParty(party);
    return party;
  }

  removeParty(party: Party) {
    if (this.game.parties.length < 2 || !this.game.parties.includes(party)) {
      return;
    }
    this.game.parties.splice(this.game.parties.indexOf(party), 1);
    if (this.game.party.id === party.id) {
      this.changeParty(this.game.parties[0]);
    }
  }

  changeParty(party: Party) {
    if (!!party.edition) {
      settingsManager.automaticTheme(party.edition, this.game.edition);
    }

    this.game.party.characters = this.game.figures
      .filter((figure) => figure instanceof Character)
      .map((figure) => (figure as Character).toModel());
    this.game.party.edition = this.game.edition;
    this.game.party.conditions = this.game.conditions;
    this.game.party.battleGoalEditions = this.game.battleGoalEditions;
    this.game.party.filteredBattleGoals = this.game.filteredBattleGoals;
    this.game.party.unlockedCharacters = this.game.unlockedCharacters;
    this.game.party.level = this.game.level;
    this.game.party.levelCalculation = this.game.levelCalculation;
    this.game.party.levelAdjustment = this.game.levelAdjustment;
    this.game.party.bonusAdjustment = this.game.bonusAdjustment;
    this.game.party.ge5Player = this.game.ge5Player;
    this.game.party.playerCount = this.game.playerCount;
    this.game.party.solo = this.game.solo;
    this.game.party.lootDeckEnhancements = this.game.lootDeckEnhancements;
    this.game.party.lootDeckFixed = this.game.lootDeckFixed;
    this.game.party.lootDeckSections = this.game.lootDeckSections;

    this.game.party = party;
    this.game.edition = this.game.party.edition;
    this.game.conditions = this.game.party.conditions || [];
    this.game.battleGoalEditions = this.game.party.battleGoalEditions || [];
    this.game.filteredBattleGoals = this.game.party.filteredBattleGoals || [];
    this.game.unlockedCharacters = this.game.party.unlockedCharacters || [];
    this.game.level = this.game.party.level === 0 ? 0 : this.game.party.level || this.game.level;
    this.game.levelCalculation =
      this.game.party.levelCalculation === false ? false : this.game.party.levelCalculation || this.game.levelCalculation;
    this.game.levelAdjustment = this.game.party.levelAdjustment === 0 ? 0 : this.game.party.levelAdjustment || this.game.levelAdjustment;
    this.game.bonusAdjustment = this.game.party.bonusAdjustment === 0 ? 0 : this.game.party.bonusAdjustment || this.game.bonusAdjustment;
    this.game.ge5Player = this.game.party.ge5Player === false ? false : this.game.party.ge5Player || this.game.ge5Player;
    this.game.playerCount = this.game.party.playerCount || this.game.playerCount;
    this.game.solo = this.game.party.solo === false ? false : this.game.party.solo || this.game.solo;
    this.game.lootDeckEnhancements = this.game.party.lootDeckEnhancements || [];
    this.game.lootDeckFixed = this.game.party.lootDeckFixed || [];
    this.game.lootDeckSections = this.game.party.lootDeckSections || [];

    this.game.figures = this.game.figures.filter((figure) => !(figure instanceof Character));
    gameManager.scenarioManager.setScenario(undefined);
    party.characters.forEach((value) => {
      const character = new Character(gameManager.editionManager.getCharacterData(value.name, value.edition), value.level);
      character.fromModel(value);
      this.game.figures.push(character);
    });
  }

  // all sections of the calendar for the given week (fixed campaign sections and sections added to the party calendar)
  weekSections(week: number, edition: string): string[] {
    const editionData = gameManager.editionManager.editionData.find((editionData) => editionData.edition === edition);
    const sections: string[] = [];
    if (editionData && editionData.campaign && editionData.campaign.weeks) {
      sections.push(...(editionData.campaign.weeks[week] || []));
    }
    sections.push(...(this.game.party.weekSections[week] || []));
    return sections;
  }

  // conclusion data of a calendar section, if available
  weekSectionConclusion(section: string, edition: string, group: string | undefined = undefined): ScenarioData | undefined {
    return gameManager.editionManager
      .sectionData(edition)
      .find(
        (sectionData) =>
          sectionData.index === section && (sectionData.group || undefined) === (group || undefined) && sectionData.conclusion
      );
  }

  scenarioConclusions(scenario: ScenarioData): ScenarioData[] {
    return gameManager.editionManager
      .sectionData(scenario.edition)
      .filter(
        (sectionData) =>
          sectionData.edition === scenario.edition &&
          sectionData.parent === scenario.index &&
          sectionData.group === scenario.group &&
          sectionData.conclusion &&
          gameManager.scenarioRequirementsManager.getRequirements(sectionData).length === 0
      );
  }

  conclusionFinished(sectionData: ScenarioData): boolean {
    return this.game.party.conclusions.some(
      (model) => model.edition === sectionData.edition && model.index === sectionData.index && model.group === sectionData.group
    );
  }

  sectionConclusions(
    section: string,
    edition: string | undefined = this.game.edition,
    available: boolean = false,
    singleParentSet: boolean = false
  ): ScenarioData[] {
    return gameManager.editionManager
      .sectionData(edition)
      .filter(
        (sectionData) =>
          sectionData.conclusion &&
          !sectionData.parent &&
          sectionData.parentSections &&
          (!singleParentSet || sectionData.parentSections.length === 1) &&
          sectionData.parentSections.some((parentSections) => parentSections.length === 1 && parentSections.includes(section)) &&
          (!available || gameManager.scenarioRequirementsManager.getRequirements(sectionData).length === 0)
      );
  }

  hasOpenConclusions(
    section: string,
    edition: string | undefined = this.game.edition,
    available: boolean = false,
    singleParentSet: boolean = false
  ): boolean {
    const conclusions = this.sectionConclusions(section, edition, available, singleParentSet);
    return conclusions.length > 0 && conclusions.every((conclusion) => !this.conclusionFinished(conclusion));
  }

  continuingSections(index: string, edition: string, depth: number = 0): ScenarioData[] {
    if (depth > 5) {
      return [];
    }
    return gameManager.editionManager
      .sectionData(edition)
      .filter(
        (sectionData) =>
          !sectionData.parent &&
          sectionData.parentSections &&
          sectionData.parentSections.some((parentSections) => parentSections.length === 1 && parentSections.includes(index)) &&
          gameManager.scenarioRequirementsManager.getRequirements(sectionData).length === 0 &&
          (sectionData.conclusion
            ? sectionData.repeatable || !this.conclusionFinished(sectionData)
            : this.continuingSections(sectionData.index, sectionData.edition, depth + 1).length > 0)
      );
  }

  addWeekSection(week: number, section: string): boolean {
    if ((this.game.party.weekSections[week] || []).includes(section)) {
      return false;
    }
    this.game.party.weekSections[week] = [...(this.game.party.weekSections[week] || []), section];
    return true;
  }

  removeWeekSection(week: number, section: string, edition: string | undefined = this.game.edition) {
    const sections = this.game.party.weekSections[week];
    if (sections && sections.includes(section)) {
      sections.splice(sections.indexOf(section), 1);
      if (sections.length === 0) {
        delete this.game.party.weekSections[week];
      }
      this.removeConclusion(edition, section);
    }
  }

  removeConclusion(edition: string | undefined, index: string) {
    this.game.party.conclusions = this.game.party.conclusions.filter(
      (conclusion) => conclusion.edition !== edition || conclusion.index !== index
    );
  }

  finishWeekConclusion(conclusion: Scenario, week: number = -1) {
    gameManager.scenarioFinishManager.finishScenario(conclusion, true, conclusion, false, false, false, this.game.party.campaignMode, true);
    if (week !== -1 && !conclusion.repeatable) {
      this.game.party.weekSections[week] = [...(this.game.party.weekSections[week] || []), conclusion.index];
    }
  }

  /**
   * resolve all calendar sections of the given week: either apply conclusions automatically or
   * add the sections to pendingWeekSections for the UI to open the corresponding dialogs
   */
  passWeekSections(week: number, edition: string, group: string | undefined = undefined, gainRewards: boolean = true) {
    this.weekSections(week, edition).forEach((section) => {
      const sectionData = this.weekSectionConclusion(section, edition, group);
      if (
        sectionData &&
        !sectionData.repeatable &&
        this.game.party.conclusions.some(
          (model) => model.edition === sectionData.edition && model.index === sectionData.index && model.group === sectionData.group
        )
      ) {
        return;
      }

      if (settingsManager.settings.automaticWeekSections) {
        if (sectionData) {
          const conclusion = new Scenario(sectionData);
          // collective resources of automatically resolved week sections cannot be distributed, add them to the Frosthaven supply
          if (gainRewards && sectionData.rewards && sectionData.rewards.collectiveResources) {
            sectionData.rewards.collectiveResources.forEach((resource) => {
              const value = EntityValueFunction(resource.value);
              this.game.party.loot[resource.type] = Math.max(0, (this.game.party.loot[resource.type] || 0) + value);
            });
          }
          gameManager.scenarioFinishManager.finishScenario(conclusion, true, conclusion, false, undefined, false, gainRewards, true);
        }
      } else if (
        !this.pendingWeekSections.some((pending) => pending.index === section && pending.edition === edition && pending.group === group)
      ) {
        this.pendingWeekSections.push({ week, index: section, edition, group });
      }
    });
  }
}
