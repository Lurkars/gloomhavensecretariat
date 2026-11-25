import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { AttackModifierDeck } from 'src/app/game/model/data/AttackModifier';
import { CampaignData, EditionData } from 'src/app/game/model/data/EditionData';
import { GameScenarioModel } from 'src/app/game/model/Scenario';

function buildEdition(edition: string, overrides: Partial<EditionData> = {}): EditionData {
  const data = new EditionData(edition, [], [], [], [], [], []);
  return Object.assign(data, overrides);
}

describe('CampaignManager', () => {
  beforeEach(() => {
    gameManager.editionManager.editionData = [];
    settingsManager.settings.editions = [];
    gameManager.game.edition = undefined;
    gameManager.game.party.prosperity = 0;
    gameManager.game.party.donations = 0;
    gameManager.game.party.envelopeB = false;
    gameManager.game.party.imbuement = 0;
  });

  describe('prosperityLevel / prosperityTicks', () => {
    beforeEach(() => {
      gameManager.editionManager.editionData = [buildEdition('gh'), buildEdition('cs'), buildEdition('gh2e')];
    });

    it('prosperityTicks equals raw prosperity outside of gh/cs/gh2e envelope rules', () => {
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      gameManager.game.party.prosperity = 5;
      gameManager.game.party.envelopeB = false;
      expect(gameManager.campaignManager.prosperityTicks()).toEqual(5);
    });

    it('adds an envelope-B tick plus donation ticks under gh rules', () => {
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      gameManager.game.party.prosperity = 2;
      gameManager.game.party.envelopeB = true;
      gameManager.game.party.donations = 15;
      // 2 (base) + 1 (envelopeB) + floor(min(15-10,30)/5)=1 => 4
      expect(gameManager.campaignManager.prosperityTicks()).toEqual(4);
    });

    it('applies gh2e donation and imbuement based ticks without an envelope bonus', () => {
      settingsManager.settings.editions = ['gh2e'];
      gameManager.game.edition = 'gh2e';
      gameManager.game.party.prosperity = 1;
      gameManager.game.party.donations = 12;
      gameManager.game.party.imbuement = 15;
      // 1 + floor(min(12,100)/5)=2 + floor(min(15+5,80)/10)=2 => 5
      expect(gameManager.campaignManager.prosperityTicks()).toEqual(5);
    });

    it('prosperityLevel increases once ticks pass a GH prosperity step', () => {
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      gameManager.game.party.prosperity = 4; // > step 3, <= step 8
      expect(gameManager.campaignManager.prosperityLevel()).toEqual(2);
    });

    it('prosperityLevel starts at 1 when no steps are passed', () => {
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      gameManager.game.party.prosperity = 1;
      expect(gameManager.campaignManager.prosperityLevel()).toEqual(1);
    });
  });

  describe('startCampaign / cancelCampaign', () => {
    afterEach(() => vi.restoreAllMocks());

    it('starts a campaign for the edition, resets event decks and updates the default attack modifier decks', () => {
      vi.spyOn(settingsManager, 'automaticTheme').mockImplementation(() => {});
      const updateDefaultDecks = vi.spyOn(gameManager.attackModifierManager, 'updateDefaultDecks').mockImplementation(() => {});
      const buildPartyDeckMigration = vi.spyOn(gameManager.eventCardManager, 'buildPartyDeckMigration').mockImplementation(() => {});
      gameManager.game.party.eventDecks = { city: [] } as any;
      const unlockBuildings = vi.spyOn(gameManager.buildingsManager, 'unlockBuildings').mockReturnValue(false);
      const setupTownGuardDeck = vi.spyOn(gameManager.outpostAttackManager, 'setupTownGuardDeck').mockReturnValue(false);

      gameManager.campaignManager.startCampaign('fh');

      expect(gameManager.game.edition).toEqual('fh');
      expect(gameManager.game.party.edition).toEqual('fh');
      expect(gameManager.game.party.campaignMode).toBe(true);
      expect(gameManager.game.party.eventDecks).toEqual({});
      expect(updateDefaultDecks).toHaveBeenCalled();
      expect(buildPartyDeckMigration).toHaveBeenCalledWith('fh');
      expect(unlockBuildings).toHaveBeenCalled();
      expect(setupTownGuardDeck).toHaveBeenCalled();
    });

    it('sets up the campaign when enabling campaign mode', () => {
      const unlockBuildings = vi.spyOn(gameManager.buildingsManager, 'unlockBuildings').mockReturnValue(false);
      const setupTownGuardDeck = vi.spyOn(gameManager.outpostAttackManager, 'setupTownGuardDeck').mockReturnValue(false);
      gameManager.campaignManager.setCampaignMode(false);
      expect(gameManager.game.party.campaignMode).toBe(false);
      expect(setupTownGuardDeck).not.toHaveBeenCalled();
      gameManager.campaignManager.setCampaignMode(true);
      expect(gameManager.game.party.campaignMode).toBe(true);
      expect(unlockBuildings).toHaveBeenCalled();
      expect(setupTownGuardDeck).toHaveBeenCalled();
    });

    it('unlocks buildings on prosperity changes', () => {
      const unlockBuildings = vi.spyOn(gameManager.buildingsManager, 'unlockBuildings').mockReturnValue(false);
      gameManager.campaignManager.changeProsperity(1);
      expect(unlockBuildings).toHaveBeenCalled();
    });

    it('keeps buildings and town guard deck when cancelling a campaign with progress', () => {
      gameManager.game.edition = 'fh';
      gameManager.game.party.campaignMode = true;
      gameManager.game.party.scenarios = [new GameScenarioModel('1', 'fh')];
      gameManager.game.party.townGuardDeck = new AttackModifierDeck([]).toModel();
      const resetBuildings = vi.spyOn(gameManager.buildingsManager, 'resetBuildings').mockImplementation(() => {});
      try {
        gameManager.campaignManager.cancelCampaign();
        expect(resetBuildings).not.toHaveBeenCalled();
        expect(gameManager.game.party.townGuardDeck).toBeDefined();
        expect(gameManager.game.party.campaignMode).toBe(false);
      } finally {
        gameManager.game.party.scenarios = [];
      }
    });

    it('detects a missing campaign setup', () => {
      gameManager.game.party.campaignMode = true;
      vi.spyOn(gameManager.campaignManager, 'campaignData').mockReturnValue(undefined as any);
      const unlocks = vi.spyOn(gameManager.buildingsManager, 'buildingsToUnlock').mockReturnValue([]);
      expect(gameManager.campaignManager.campaignSetupMissing()).toBe(false);
      unlocks.mockReturnValue([{ data: {} as any, level: 1 }]);
      expect(gameManager.campaignManager.campaignSetupMissing()).toBe(true);
      gameManager.game.party.campaignMode = false;
      expect(gameManager.campaignManager.campaignSetupMissing()).toBe(false);
    });

    it('cancels a campaign', () => {
      gameManager.game.edition = 'fh';
      gameManager.game.party.campaignMode = true;
      gameManager.game.party.scenarios = [];
      gameManager.game.party.conclusions = [];
      gameManager.game.party.retirements = [];
      gameManager.game.party.weeks = 0;
      gameManager.game.party.buildings = [];
      gameManager.game.party.townGuardDeck = new AttackModifierDeck([]).toModel();
      const resetBuildings = vi.spyOn(gameManager.buildingsManager, 'resetBuildings').mockImplementation(() => {});
      gameManager.campaignManager.cancelCampaign();
      expect(resetBuildings).toHaveBeenCalled();
      expect(gameManager.game.party.townGuardDeck).toBeUndefined();
      expect(gameManager.game.edition).toBeUndefined();
      expect(gameManager.game.party.campaignMode).toBe(false);
      expect(gameManager.game.party.eventDecks).toEqual({});
    });
  });

  describe('morale conclusions', () => {
    beforeEach(() => {
      gameManager.game.edition = 'fh';
      gameManager.game.party.conclusions = [];
      vi.spyOn(gameManager.campaignManager, 'campaignData').mockReturnValue(
        Object.assign(new CampaignData(), { lowMorale: ['l1', 'l2'], highMorale: ['h1'] })
      );
    });

    afterEach(() => vi.restoreAllMocks());

    it('picks the next unsolved conclusion and repeats the last low morale one', () => {
      const campaignManager = gameManager.campaignManager;
      expect(campaignManager.prepareMoraleConclusion(5)).toBeUndefined();
      expect(campaignManager.prepareMoraleConclusion(0)).toBe('l1');
      gameManager.game.party.conclusions = [new GameScenarioModel('l1', 'fh'), new GameScenarioModel('l2', 'fh')];
      expect(campaignManager.moraleConclusionsSolved(['l1', 'l2'])).toBe(2);
      expect(campaignManager.prepareMoraleConclusion(0)).toBe('l2');
      expect(gameManager.game.party.conclusions.map((model) => model.index)).toEqual(['l1']);
      expect(campaignManager.prepareMoraleConclusion(20)).toBe('h1');
      gameManager.game.party.conclusions.push(new GameScenarioModel('h1', 'fh'));
      expect(campaignManager.prepareMoraleConclusion(20)).toBeUndefined();
    });
  });

  it('keeps inspiration from dropping below zero', () => {
    gameManager.game.party.inspiration = 2;
    gameManager.campaignManager.changeInspiration(-5);
    expect(gameManager.game.party.inspiration).toBe(0);
    gameManager.campaignManager.changeInspiration(3);
    expect(gameManager.game.party.inspiration).toBe(3);
  });
});
