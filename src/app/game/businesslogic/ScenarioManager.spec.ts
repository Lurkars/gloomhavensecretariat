import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { ScenarioData, ScenarioRewards } from 'src/app/game/model/data/ScenarioData';
import { GameScenarioModel, Scenario } from 'src/app/game/model/Scenario';

// This spec covers the self-contained lookups and predicates (isCurrent/isSuccess/isBlocked,
// sortScenarios, scenarioTitle/scenarioUndoArgs, and the getScenario/getSection/getSections/
// availableSections family, all driven off small gameManager.editionData fixtures), plus the
// reward-bookkeeping slice of finishScenario below. applyScenarioData (monster/room spawning) and
// the rest of finishScenario (event decks, item unlocks, town guard deck, calendar/week-passing)
// pull in many other managers and stay out of scope here.

function buildScenarioData(overrides: Partial<ScenarioData> = {}): ScenarioData {
  // Real (JSON-sourced) ScenarioData typically leaves `parentSections` unset (undefined),
  // not an empty array - availableSections() treats an empty-but-present array as "requires
  // an (unsatisfiable) parent section", so match that shape unless a test overrides it.
  const data = Object.assign(new ScenarioData(), { edition: 'gh', index: '1', parentSections: undefined, ...overrides });
  return data;
}

describe('ScenarioManager', () => {
  const scenarioManager = gameManager.scenarioManager;

  beforeEach(() => {
    gameManager.editionData = [];
    settingsManager.settings.editions = ['gh'];
    gameManager.game.scenario = undefined;
    gameManager.game.sections = [];
    gameManager.game.party.scenarios = [];
    gameManager.game.party.conclusions = [];
    gameManager.game.party.campaignMode = false;
  });

  describe('getScenario / getSection', () => {
    it('getScenario finds a scenario by index/edition/group', () => {
      const scenario = buildScenarioData({ index: '1', edition: 'gh', group: undefined });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [scenario], [], []), {})];

      expect(scenarioManager.getScenario('1', 'gh', undefined)).toBe(scenario);
      expect(scenarioManager.getScenario('2', 'gh', undefined)).toBeUndefined();
    });

    it('getSection finds a section by index/edition/group, optionally restricted to conclusions', () => {
      const section = buildScenarioData({ index: '1a', edition: 'gh', conclusion: true });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [section], []), {})];

      expect(scenarioManager.getSection('1a', 'gh', undefined)).toBe(section);
      expect(scenarioManager.getSection('1a', 'gh', undefined, true)).toBe(section);
    });

    it('getSection with conclusionOnly excludes non-conclusion sections', () => {
      const section = buildScenarioData({ index: '1a', edition: 'gh', conclusion: false });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [section], []), {})];

      expect(scenarioManager.getSection('1a', 'gh', undefined, true)).toBeUndefined();
    });
  });

  describe('getSections / availableSections', () => {
    it('getSections returns sections whose parent/edition/group match the scenario', () => {
      const scenario = buildScenarioData({ index: '1', edition: 'gh' });
      const section = buildScenarioData({ index: '1a', edition: 'gh', parent: '1' });
      const otherSection = buildScenarioData({ index: '2a', edition: 'gh', parent: '2' });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [section, otherSection], []), {})];

      expect(scenarioManager.getSections(scenario)).toEqual([section]);
    });

    it('availableSections is empty without an active scenario', () => {
      gameManager.game.scenario = undefined;
      expect(scenarioManager.availableSections()).toEqual([]);
    });

    it('availableSections excludes sections that are already active', () => {
      const scenarioData = buildScenarioData({ index: '1', edition: 'gh' });
      const sectionData = buildScenarioData({ index: '1a', edition: 'gh', parent: '1' });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [sectionData], []), {})];
      gameManager.game.scenario = new Scenario(scenarioData);
      gameManager.game.sections = [new Scenario(sectionData)];

      expect(scenarioManager.availableSections()).toEqual([]);
      expect(scenarioManager.availableSections(false, true)).toEqual([sectionData]);
    });

    it('availableSections excludes conclusion sections unless requested', () => {
      const scenarioData = buildScenarioData({ index: '1', edition: 'gh' });
      const conclusionSection = buildScenarioData({ index: '1a', edition: 'gh', parent: '1', conclusion: true });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [conclusionSection], []), {})];
      gameManager.game.scenario = new Scenario(scenarioData);

      expect(scenarioManager.availableSections()).toEqual([]);
      expect(scenarioManager.availableSections(true)).toEqual([conclusionSection]);
    });
  });

  describe('isCurrent', () => {
    it('is true when the scenario matches the active scenario (edition/index/group/solo)', () => {
      const scenarioData = buildScenarioData({ index: '1', edition: 'gh' });
      gameManager.game.scenario = new Scenario(scenarioData);
      expect(scenarioManager.isCurrent(scenarioData)).toBe(true);
    });

    it('is false without an active scenario', () => {
      gameManager.game.scenario = undefined;
      expect(scenarioManager.isCurrent(buildScenarioData())).toBe(false);
    });

    it('is false for a different index', () => {
      gameManager.game.scenario = new Scenario(buildScenarioData({ index: '1' }));
      expect(scenarioManager.isCurrent(buildScenarioData({ index: '2' }))).toBe(false);
    });
  });

  describe('isSuccess', () => {
    it('is true once the scenario is recorded in party.scenarios', () => {
      const scenarioData = buildScenarioData({ index: '1', edition: 'gh' });
      gameManager.game.party.scenarios = [new GameScenarioModel('1', 'gh', undefined)];
      expect(scenarioManager.isSuccess(scenarioData)).toBe(true);
    });

    it('is false when not recorded', () => {
      const scenarioData = buildScenarioData({ index: '1', edition: 'gh' });
      gameManager.game.party.scenarios = [];
      expect(scenarioManager.isSuccess(scenarioData)).toBe(false);
    });
  });

  describe('isBlocked', () => {
    it('is true when a finished (successful) scenario blocks this one', () => {
      const blocker = buildScenarioData({ index: '1', edition: 'gh', blocks: ['2'] });
      const blocked = buildScenarioData({ index: '2', edition: 'gh' });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [blocker, blocked], [], []), {})];
      gameManager.game.party.scenarios = [new GameScenarioModel('1', 'gh', undefined)];

      expect(scenarioManager.isBlocked(blocked)).toBe(true);
    });

    it('is false when the blocking scenario has not been completed', () => {
      const blocker = buildScenarioData({ index: '1', edition: 'gh', blocks: ['2'] });
      const blocked = buildScenarioData({ index: '2', edition: 'gh' });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [blocker, blocked], [], []), {})];
      gameManager.game.party.scenarios = [];

      expect(scenarioManager.isBlocked(blocked)).toBe(false);
    });

    it('is true when a finished conclusion section blocks this one, regardless of scenario success', () => {
      const blockedScenario = buildScenarioData({ index: '2', edition: 'gh' });
      const conclusionSection = buildScenarioData({ index: '1a', edition: 'gh', conclusion: true, blocks: ['2'] });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [blockedScenario], [conclusionSection], []), {})];
      gameManager.game.party.conclusions = [new GameScenarioModel('1a', 'gh', undefined)];

      expect(scenarioManager.isBlocked(blockedScenario)).toBe(true);
    });
  });

  describe('isLocked', () => {
    it('is false outside of campaign mode regardless of requirements', () => {
      const scenarioData = buildScenarioData({ requirements: [{ global: ['achievement-a'] } as any] });
      gameManager.game.party.campaignMode = false;
      expect(scenarioManager.isLocked(scenarioData)).toBe(false);
    });

    it('is false when there are no requirements', () => {
      gameManager.game.party.campaignMode = true;
      expect(scenarioManager.isLocked(buildScenarioData({ requirements: [] }))).toBe(false);
    });

    it('is true in campaign mode when a required global achievement is missing', () => {
      gameManager.game.party.campaignMode = true;
      gameManager.game.party.globalAchievementsList = [];
      const scenarioData = buildScenarioData({ requirements: [{ global: ['found-the-key'] } as any] });
      expect(scenarioManager.isLocked(scenarioData)).toBe(true);
    });

    it('is false in campaign mode once the required global achievement is present', () => {
      gameManager.game.party.campaignMode = true;
      gameManager.game.party.globalAchievementsList = ['found-the-key'];
      const scenarioData = buildScenarioData({ requirements: [{ global: ['found-the-key'] } as any] });
      expect(scenarioManager.isLocked(scenarioData)).toBe(false);
    });

    it('is true (regardless of campaign mode) when a solo scenario has no eligible character present', () => {
      gameManager.game.party.campaignMode = false;
      const scenarioData = buildScenarioData({ solo: 'brute', requirements: [] });
      gameManager.game.figures = [];
      expect(scenarioManager.isLocked(scenarioData)).toBe(true);
    });
  });

  describe('sortScenarios', () => {
    it('sorts conclusions after non-conclusions', () => {
      const scenario = buildScenarioData({ index: '1', conclusion: false });
      const conclusion = buildScenarioData({ index: '1a', conclusion: true });
      expect(scenarioManager.sortScenarios(scenario, conclusion)).toEqual(-1);
      expect(scenarioManager.sortScenarios(conclusion, scenario)).toEqual(1);
    });

    it('sorts purely numeric indices numerically', () => {
      const s2 = buildScenarioData({ index: '2' });
      const s10 = buildScenarioData({ index: '10' });
      expect(scenarioManager.sortScenarios(s2, s10)).toBeLessThan(0);
    });

    it('sorts mixed alphanumeric indices by their numeric portion', () => {
      const s2 = buildScenarioData({ index: '2a' });
      const s10 = buildScenarioData({ index: '10a' });
      expect(scenarioManager.sortScenarios(s2, s10)).toBeLessThan(0);
    });

    it('falls back to alphabetic order when there is no numeric portion', () => {
      const a = buildScenarioData({ index: 'a' });
      const b = buildScenarioData({ index: 'b' });
      expect(scenarioManager.sortScenarios(a, b)).toEqual(-1);
    });
  });

  describe('scenarioTitle / scenarioUndoArgs', () => {
    it('falls back to "#index" when no label exists for the scenario', () => {
      const scenarioData = buildScenarioData({ index: '5', edition: 'gh' });
      expect(scenarioManager.scenarioTitle(scenarioData)).toEqual('#5');
    });

    it('falls back to a section placeholder for sections', () => {
      const scenarioData = buildScenarioData({ index: '5', edition: 'gh' });
      expect(scenarioManager.scenarioTitle(scenarioData, true)).toEqual('%game.section:5%');
    });

    it('returns a generic placeholder when scenarioData is undefined', () => {
      expect(scenarioManager.scenarioTitle(undefined)).toEqual('scenario');
      expect(scenarioManager.scenarioTitle(undefined, true)).toEqual('section');
    });

    it('scenarioUndoArgs returns empty placeholders without a scenario', () => {
      gameManager.game.scenario = undefined;
      expect(scenarioManager.scenarioUndoArgs()).toEqual(['', '', '']);
    });

    it('scenarioUndoArgs returns index/title/edition-label for a custom scenario', () => {
      const scenarioData = buildScenarioData({ index: '5', edition: 'gh' });
      const scenario = new Scenario(scenarioData, [], [], true);
      expect(scenarioManager.scenarioUndoArgs(scenario)).toEqual(['5', '#5', 'scenario.custom']);
    });

    it('scenarioUndoArgs returns the edition data label key for a non-custom scenario', () => {
      const scenarioData = buildScenarioData({ index: '5', edition: 'gh' });
      const scenario = new Scenario(scenarioData);
      expect(scenarioManager.scenarioUndoArgs(scenario)).toEqual(['5', '#5', 'data.edition.gh']);
    });
  });

  describe('finishScenario', () => {
    beforeEach(() => {
      gameManager.game.figures = [];
      gameManager.game.finish = 'won' as any;
      gameManager.game.party.prosperity = 0;
      gameManager.game.party.reputation = 0;
      gameManager.game.party.morale = 0;
      gameManager.game.party.inspiration = 0;
      gameManager.game.party.achievementsList = [];
      gameManager.game.party.globalAchievementsList = [];
      gameManager.game.party.campaignStickers = [];
      gameManager.game.party.pets = [];
      gameManager.game.party.conclusions = [];
      gameManager.game.party.scenarios = [];
      gameManager.game.party.casualScenarios = [];
      gameManager.game.party.campaignMode = false;
      settingsManager.settings.scenarioStats = false;
      settingsManager.settings.characterSheet = false;
      settingsManager.settings.partySheet = true;
      settingsManager.settings.events = false;
      settingsManager.settings.automaticUnlocking = false;
      vi.spyOn(gameManager, 'fhRules').mockReturnValue(false);
      vi.spyOn(gameManager, 'gh2eRules').mockReturnValue(false);
      vi.spyOn(gameManager.characterManager, 'characterCount').mockReturnValue(4); // avoid the <4-players inspiration bonus
      vi.spyOn(gameManager.roundManager, 'resetScenario').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    function buildScenario(rewards: Partial<ScenarioRewards> = {}): Scenario {
      const data = buildScenarioData({ edition: 'gh', index: '1', rewards: Object.assign(new ScenarioRewards(), rewards) });
      return new Scenario(data);
    }

    it('always resets game.finish to undefined', () => {
      const scenario = buildScenario();
      scenarioManager.finishScenario(scenario, true, undefined);
      expect(gameManager.game.finish).toBeUndefined();
    });

    it('does nothing when there is no scenario', () => {
      expect(() => scenarioManager.finishScenario(undefined, true, undefined)).not.toThrow();
      expect(gameManager.game.party.prosperity).toBe(0);
    });

    it('does not apply rewards when success is false', () => {
      const scenario = buildScenario({ prosperity: 5, reputation: 3 });
      scenarioManager.finishScenario(scenario, false, undefined);
      expect(gameManager.game.party.prosperity).toBe(0);
      expect(gameManager.game.party.reputation).toBe(0);
    });

    it('adds prosperity, clamped to 64 under non-fh rules', () => {
      gameManager.game.party.prosperity = 60;
      const scenario = buildScenario({ prosperity: 10 });
      scenarioManager.finishScenario(scenario, true, undefined);
      expect(gameManager.game.party.prosperity).toBe(64);
    });

    it('adds prosperity, clamped to 132 under fh rules', () => {
      (gameManager.fhRules as any).mockReturnValue(true);
      gameManager.game.party.prosperity = 130;
      const scenario = buildScenario({ prosperity: 10 });
      scenarioManager.finishScenario(scenario, true, undefined);
      expect(gameManager.game.party.prosperity).toBe(132);
    });

    it('adds prosperity, clamped to 89 under gh2e rules', () => {
      (gameManager.gh2eRules as any).mockReturnValue(true);
      gameManager.game.party.prosperity = 85;
      const scenario = buildScenario({ prosperity: 10 });
      scenarioManager.finishScenario(scenario, true, undefined);
      expect(gameManager.game.party.prosperity).toBe(89);
    });

    it('clamps reputation to [-20, 20]', () => {
      gameManager.game.party.reputation = 18;
      const scenario = buildScenario({ reputation: 10 });
      scenarioManager.finishScenario(scenario, true, undefined);
      expect(gameManager.game.party.reputation).toBe(20);
    });

    it('clamps morale to [0, 20], never going negative', () => {
      gameManager.game.party.morale = 2;
      const scenario = buildScenario({ morale: -10 });
      scenarioManager.finishScenario(scenario, true, undefined);
      expect(gameManager.game.party.morale).toBe(0);
    });

    it('adds inspiration, clamped at 0 minimum', () => {
      gameManager.game.party.inspiration = 1;
      const scenario = buildScenario({ inspiration: -5 });
      scenarioManager.finishScenario(scenario, true, undefined);
      expect(gameManager.game.party.inspiration).toBe(0);
    });

    it('clamps factionReputation to 12 without faction unlock', () => {
      gameManager.game.party.factionReputation['demons'] = 10;
      const scenario = buildScenario({ reputationFactions: ['demons:3'] });
      scenarioManager.finishScenario(scenario, true, undefined);
      expect(gameManager.game.party.factionReputation['demons']).toBe(12);
    });

    it('bursts factionReputation past 12 with faction unlock', () => {
      gameManager.game.party.factionReputation['demons'] = 10;
      const scenario = buildScenario({ reputationFactions: ['demons:3'], factionUnlock: 'demons' });
      scenarioManager.finishScenario(scenario, true, undefined);
      expect(gameManager.game.party.factionReputation['demons']).toBe(13);
    });

    it('pushes global/party achievements and campaign stickers regardless of partySheet setting', () => {
      settingsManager.settings.partySheet = false;
      const scenario = buildScenario({ globalAchievements: ['ga1'], partyAchievements: ['pa1'], campaignSticker: ['My Sticker'] });
      scenarioManager.finishScenario(scenario, true, undefined);
      expect(gameManager.game.party.globalAchievementsList).toContain('ga1');
      expect(gameManager.game.party.achievementsList).toContain('pa1');
      expect(gameManager.game.party.campaignStickers).toContain('my-sticker');
    });

    it('removes lostPartyAchievements from the achievements list', () => {
      gameManager.game.party.achievementsList = ['keep', 'lose'];
      const scenario = buildScenario({ lostPartyAchievements: ['lose'] });
      scenarioManager.finishScenario(scenario, true, undefined);
      expect(gameManager.game.party.achievementsList).toEqual(['keep']);
    });

    it('adds a new pet reward once, without duplicating an already-owned pet', () => {
      const scenario = buildScenario({ pet: 'wolf' });
      scenarioManager.finishScenario(scenario, true, undefined);
      expect(gameManager.game.party.pets.some((p) => p.name === 'wolf' && p.edition === 'gh')).toBe(true);

      const petCountBefore = gameManager.game.party.pets.length;
      scenarioManager.finishScenario(buildScenario({ pet: 'wolf' }), true, undefined);
      expect(gameManager.game.party.pets.length).toBe(petCountBefore);
    });

    it('records a non-repeatable conclusion section once', () => {
      const conclusionSection = buildScenarioData({ index: '1a', edition: 'gh', repeatable: false });
      const scenario = buildScenario();
      scenarioManager.finishScenario(scenario, true, conclusionSection);
      expect(gameManager.game.party.conclusions.some((c) => c.index === '1a' && c.edition === 'gh')).toBe(true);

      const countBefore = gameManager.game.party.conclusions.length;
      scenarioManager.finishScenario(scenario, true, conclusionSection);
      expect(gameManager.game.party.conclusions.length).toBe(countBefore);
    });

    it('records a completed scenario under campaignMode when it is not a conclusion', () => {
      gameManager.game.party.campaignMode = true;
      const scenario = buildScenario();
      scenarioManager.finishScenario(scenario, true, undefined);
      expect(gameManager.game.party.scenarios.some((s) => s.index === '1' && s.edition === 'gh')).toBe(true);
    });

    it('records a casual scenario on success outside of campaignMode', () => {
      gameManager.game.party.campaignMode = false;
      const scenario = buildScenario();
      scenarioManager.finishScenario(scenario, true, undefined);
      expect(gameManager.game.party.casualScenarios.some((s) => s.index === '1' && s.edition === 'gh')).toBe(true);
    });

    it('clears the active scenario and calls roundManager.resetScenario() when finishing normally', () => {
      gameManager.game.scenario = buildScenario();
      const scenario = buildScenario();
      scenarioManager.finishScenario(scenario, true, undefined);
      expect(gameManager.game.scenario).toBeUndefined();
      expect(gameManager.roundManager.resetScenario).toHaveBeenCalled();
    });

    it('delegates to setScenario instead of resetting when restart=true', () => {
      const setScenarioSpy = vi.spyOn(scenarioManager, 'setScenario').mockImplementation(() => {});
      const scenario = buildScenario();
      scenarioManager.finishScenario(scenario, true, undefined, true);
      expect(setScenarioSpy).toHaveBeenCalledWith(scenario, true);
      expect(gameManager.roundManager.resetScenario).not.toHaveBeenCalled();
    });
  });
});
