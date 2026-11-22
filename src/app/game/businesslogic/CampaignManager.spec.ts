import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { AttackModifierDeck } from 'src/app/game/model/data/AttackModifier';
import { EditionData } from 'src/app/game/model/data/EditionData';

function buildEdition(edition: string, overrides: Partial<EditionData> = {}): EditionData {
  const data = new EditionData(edition, [], [], [], [], [], []);
  return Object.assign(data, overrides);
}

describe('CampaignManager', () => {
  beforeEach(() => {
    gameManager.editionData = [];
    settingsManager.settings.editions = [];
    gameManager.game.edition = undefined;
    gameManager.game.party.prosperity = 0;
    gameManager.game.party.donations = 0;
    gameManager.game.party.envelopeB = false;
    gameManager.game.party.imbuement = 0;
  });

  describe('prosperityLevel / prosperityTicks', () => {
    beforeEach(() => {
      gameManager.editionData = [buildEdition('gh'), buildEdition('cs'), buildEdition('gh2e')];
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

    it('cancels a campaign', () => {
      gameManager.game.edition = 'fh';
      gameManager.game.party.campaignMode = true;
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
});
