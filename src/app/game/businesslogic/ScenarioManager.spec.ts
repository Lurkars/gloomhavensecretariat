import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { LootType } from 'src/app/game/model/data/Loot';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { PersonalQuest, PersonalQuestAutotrackType, PersonalQuestRequirement } from 'src/app/game/model/data/PersonalQuest';
import { ScenarioData, ScenarioRequirement, ScenarioRewards } from 'src/app/game/model/data/ScenarioData';
import { ScenarioRule } from 'src/app/game/model/data/ScenarioRule';
import { GameState } from 'src/app/game/model/Game';
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

  describe('hasScenarios / hasSections', () => {
    afterEach(() => {
      gameManager.game.edition = undefined;
    });

    it('is false without any scenarios or sections', () => {
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], []), {})];
      expect(scenarioManager.hasScenarios()).toBe(false);
      expect(scenarioManager.hasSections()).toBe(false);
    });

    it('is true when any active edition provides scenarios or sections', () => {
      gameManager.editionData = [
        Object.assign(
          new EditionData(
            'gh',
            [],
            [],
            [],
            [buildScenarioData({ index: '1', edition: 'gh' })],
            [buildScenarioData({ index: '1a', edition: 'gh' })],
            []
          ),
          {}
        )
      ];
      expect(scenarioManager.hasScenarios()).toBe(true);
      expect(scenarioManager.hasSections()).toBe(true);
    });

    it('only considers the editions relevant to the set game edition', () => {
      settingsManager.settings.editions = ['gh', 'rpg'];
      gameManager.editionData = [
        Object.assign(
          new EditionData(
            'gh',
            [],
            [],
            [],
            [buildScenarioData({ index: '1', edition: 'gh' })],
            [buildScenarioData({ index: '1a', edition: 'gh' })],
            []
          ),
          {}
        ),
        Object.assign(new EditionData('rpg', [], [], [], [], [], []), {})
      ];
      gameManager.game.edition = 'rpg';
      expect(scenarioManager.hasScenarios()).toBe(false);
      expect(scenarioManager.hasSections()).toBe(false);
      gameManager.game.edition = 'gh';
      expect(scenarioManager.hasScenarios()).toBe(true);
      expect(scenarioManager.hasSections()).toBe(true);
    });

    it('ignores extra content editions and conclusion sections', () => {
      settingsManager.settings.editions = ['jotl', 'ccug'];
      gameManager.editionData = [
        Object.assign(
          new EditionData('jotl', [], [], [], [], [buildScenarioData({ index: '9-7', edition: 'jotl', conclusion: true })], []),
          {}
        ),
        Object.assign(
          new EditionData(
            'ccug',
            [],
            [],
            [],
            [buildScenarioData({ index: '1', edition: 'ccug' })],
            [buildScenarioData({ index: '1a', edition: 'ccug' })],
            []
          ),
          { type: 'content' }
        )
      ];
      gameManager.game.edition = 'jotl';
      expect(scenarioManager.hasScenarios()).toBe(false);
      expect(scenarioManager.hasSections()).toBe(false);
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

  describe('scenarios requirement', () => {
    it('requires a completed scenario, or a not completed scenario if negated', () => {
      gameManager.game.party.campaignMode = true;
      gameManager.game.party.scenarios = [];
      const completed = buildScenarioData({ index: '1A', requirements: [{ scenarios: [['60']] } as any] });
      const notCompleted = buildScenarioData({ index: '1B', requirements: [{ scenarios: [['!60']] } as any] });

      expect(scenarioManager.isLocked(completed)).toBe(true);
      expect(scenarioManager.getRequirements(completed)[0].scenarios).toEqual([['60']]);
      expect(scenarioManager.isLocked(notCompleted)).toBe(false);
      expect(scenarioManager.getRequirements(notCompleted).length).toBe(0);

      gameManager.game.party.scenarios = [new GameScenarioModel('60', 'gh')];

      expect(scenarioManager.isLocked(completed)).toBe(false);
      expect(scenarioManager.getRequirements(completed).length).toBe(0);
      expect(scenarioManager.isLocked(notCompleted)).toBe(true);
      expect(scenarioManager.getRequirements(notCompleted)[0].scenarios).toEqual([['!60']]);
    });
  });

  describe('traits requirement', () => {
    function buildCharacter(name: string, traits: string[]): Character {
      const data = Object.assign(new CharacterData(), { name, edition: 'fh', traits, stats: [new CharacterStat(1, 10)] });
      return new Character(data, 1);
    }

    afterEach(() => {
      gameManager.game.figures = [];
    });

    it('requires no present character with the trait for a negated trait', () => {
      gameManager.game.party.campaignMode = true;
      const scenarioData = buildScenarioData({ requirements: [{ traits: ['!educated'] } as any] });
      gameManager.game.figures = [buildCharacter('blinkblade', ['educated', 'resourceful'])];
      expect(scenarioManager.getRequirements(scenarioData).length).toBe(1);
      expect(scenarioManager.getRequirements(scenarioData)[0].traitsMissing).toEqual(['educated']);
      expect(scenarioManager.isLocked(scenarioData)).toBe(true);

      (gameManager.game.figures[0] as Character).absent = true;
      expect(scenarioManager.getRequirements(scenarioData).length).toBe(0);
      expect(scenarioManager.isLocked(scenarioData)).toBe(false);
    });

    it('treats the character class as trait', () => {
      gameManager.game.party.campaignMode = true;
      const character = buildCharacter('banner-spear', ['armored']);
      character.characterClass = 'human' as any;
      gameManager.game.figures = [character];
      expect(scenarioManager.hasTrait('human')).toBe(true);
      expect(scenarioManager.isLocked(buildScenarioData({ requirements: [{ traits: ['!human'] } as any] }))).toBe(true);
    });

    it('requires a present character with the trait', () => {
      gameManager.game.party.campaignMode = true;
      const scenarioData = buildScenarioData({ requirements: [{ traits: ['educated'] } as any] });
      gameManager.game.figures = [buildCharacter('drifter', ['outcast'])];
      expect(scenarioManager.getRequirements(scenarioData)[0].traits).toEqual(['educated']);
      expect(scenarioManager.isLocked(scenarioData)).toBe(true);

      gameManager.game.figures.push(buildCharacter('blinkblade', ['educated']));
      expect(scenarioManager.getRequirements(scenarioData).length).toBe(0);
      expect(scenarioManager.isLocked(scenarioData)).toBe(false);
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

  describe('addSection scenario rules', () => {
    // FH 111.2: "at the start of every odd/even round, spawn ..." (issue #1097)
    const oddRule = () => Object.assign(new ScenarioRule('R % 2 == 1'), { start: true });
    const evenRule = () => Object.assign(new ScenarioRule('R % 2 == 0'), { start: true });

    beforeEach(() => {
      settingsManager.settings.scenarioRules = true;
      gameManager.game.figures = [];
      gameManager.game.scenarioRules = [];
      gameManager.game.appliedScenarioRules = [];
      gameManager.game.discardedScenarioRules = [];
    });

    it('does not show start-of-round rules when the section is added mid-round', () => {
      gameManager.game.round = 2;
      gameManager.game.state = GameState.next;
      scenarioManager.addSection(buildScenarioData({ index: '111.2', rules: [oddRule(), evenRule()] }));

      expect(gameManager.game.scenarioRules).toEqual([]);
      expect(gameManager.game.sections.map((section) => section.index)).toEqual(['111.2']);
    });

    it('picks up start-of-round rules of a mid-round section at the end of the round', () => {
      gameManager.game.round = 2;
      gameManager.game.state = GameState.next;
      scenarioManager.addSection(buildScenarioData({ index: '111.2', rules: [oddRule(), evenRule()] }));

      gameManager.scenarioRulesManager.addScenarioRules();
      expect(gameManager.game.scenarioRules.map((model) => model.identifier.index)).toEqual([0]);
    });

    it('shows start-of-round rules for the upcoming round when the section is added between rounds', () => {
      gameManager.game.round = 2;
      gameManager.game.state = GameState.draw;
      scenarioManager.addSection(buildScenarioData({ index: '111.2', rules: [oddRule(), evenRule()] }));

      expect(gameManager.game.scenarioRules.map((model) => model.identifier.index)).toEqual([0]);
    });

    it('still shows always rules immediately when the section is added mid-round', () => {
      gameManager.game.round = 2;
      gameManager.game.state = GameState.next;
      const alwaysRule = Object.assign(new ScenarioRule('true'), { always: true, once: true });
      scenarioManager.addSection(buildScenarioData({ index: '111.2', rules: [oddRule(), alwaysRule] }));

      expect(gameManager.game.scenarioRules.map((model) => model.identifier.index)).toEqual([1]);
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

    it('records scenario stats for every present character with one shared attempt timestamp', () => {
      settingsManager.settings.scenarioStats = true;
      const first = new Character(
        Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] }),
        1
      );
      const second = new Character(
        Object.assign(new CharacterData(), { name: 'tinkerer', edition: 'gh', stats: [new CharacterStat(1, 8)] }),
        1
      );
      gameManager.game.figures = [first, second];

      scenarioManager.finishScenario(buildScenario(), true, undefined);

      expect(first.progress.scenarioStats.length).toBe(1);
      expect(second.progress.scenarioStats.length).toBe(1);
      expect(first.progress.scenarioStats[0].timestamp).toBeGreaterThan(0);
      expect(second.progress.scenarioStats[0].timestamp).toBe(first.progress.scenarioStats[0].timestamp);
    });

    it('always resets game.finish to undefined', () => {
      const scenario = buildScenario();
      scenarioManager.finishScenario(scenario, true, undefined);
      expect(gameManager.game.finish).toBeUndefined();
    });

    it('does nothing when there is no scenario', () => {
      expect(() => scenarioManager.finishScenario(undefined, true, undefined)).not.toThrow();
      expect(gameManager.game.party.prosperity).toBe(0);
    });

    it('concludes the personal quest scenario chain via characterRetirement reward, counting the final scenario', () => {
      const personalQuest = Object.assign(new PersonalQuest(), {
        cardId: '510',
        edition: 'gh',
        requirements: [Object.assign(new PersonalQuestRequirement(), { counter: 1, autotrack: 'scenario:1|3' })]
      });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], []), { personalQuests: [personalQuest] })];
      settingsManager.settings.editions = ['gh'];
      const character = new Character(
        Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] }),
        1
      );
      character.progress.personalQuest = '510';
      character.progress.personalQuestAutotrack = true;
      character.progress.personalQuestProgress = [1];
      gameManager.game.figures = [character];

      scenarioManager.finishScenario(buildScenario({ characterRetirement: '510' }), true, undefined);

      expect(gameManager.personalQuestManager.personalQuestRequirementCount(character, personalQuest, 0)).toBe(2);
      expect(gameManager.personalQuestManager.personalQuestRequirementFulfilled(character, personalQuest, 0)).toBe(true);
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

    it('pushes global/party achievements and campaign stickers regardless of partySheet setting', () => {
      settingsManager.settings.partySheet = false;
      const scenario = buildScenario({ globalAchievements: ['ga1'], partyAchievements: ['pa1'], campaignSticker: ['My Sticker'] });
      scenarioManager.finishScenario(scenario, true, undefined);
      expect(gameManager.game.party.globalAchievementsList).toContain('ga1');
      expect(gameManager.game.party.achievementsList).toContain('pa1');
      expect(gameManager.game.party.campaignStickers).toContain('my-sticker');
    });

    it('adds soldiers from rewards', () => {
      gameManager.game.party.soldiers = 1;
      gameManager.game.party.buildings = [];
      scenarioManager.finishScenario(buildScenario({ soldiers: 2 }), true, undefined);
      expect(gameManager.game.party.soldiers).toBe(3);
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

    describe('character rewards', () => {
      function buildCharacter(name: string): Character {
        const data = Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)] });
        return new Character(data, 1);
      }

      beforeEach(() => {
        settingsManager.settings.characterSheet = true;
        settingsManager.settings.scenarioRewards = true;
      });

      it('applies gold to present characters only', () => {
        const present = buildCharacter('brute');
        const absent = buildCharacter('tinkerer');
        absent.absent = true;
        gameManager.game.figures = [present, absent];

        scenarioManager.applyCharacterRewards(Object.assign(new ScenarioRewards(), { gold: 50 }));

        expect(present.progress.gold).toEqual(50);
        expect(absent.progress.gold).toEqual(0);
      });

      it('does not apply character rewards for internally finished conclusions', () => {
        const character = buildCharacter('brute');
        gameManager.game.figures = [character];
        const conclusion = new Scenario(
          buildScenarioData({ index: '1a', conclusion: true, rewards: Object.assign(new ScenarioRewards(), { gold: 50 }) })
        );

        scenarioManager.finishScenario(conclusion, true, conclusion, false, false, false, true, true);

        expect(character.progress.gold).toEqual(0);
      });
    });

    describe('week sections', () => {
      let weekSection: ScenarioData;

      beforeEach(() => {
        (gameManager.fhRules as any).mockReturnValue(true);
        vi.spyOn(gameManager.buildingsManager, 'nextWeek').mockImplementation(() => {});
        settingsManager.settings.automaticPassTime = true;
        settingsManager.settings.characterSheet = false;
        weekSection = buildScenarioData({
          index: '2.1',
          conclusion: true,
          rewards: Object.assign(new ScenarioRewards(), {
            collectiveResources: [{ type: LootType.axenut, value: 3 }],
            prosperity: 1
          })
        });
        gameManager.editionData = [new EditionData('gh', [], [], [], [], [weekSection], [])];
        gameManager.game.party.weeks = 0;
        gameManager.game.party.weekSections = { 1: ['2.1', '3.2'] };
        gameManager.game.party.loot = {};
        scenarioManager.pendingWeekSections = [];
      });

      afterEach(() => {
        settingsManager.settings.automaticWeekSections = false;
        scenarioManager.pendingWeekSections = [];
      });

      it('adds calendar sections of the passed week as pending instead of applying them', () => {
        settingsManager.settings.automaticWeekSections = false;

        scenarioManager.finishScenario(buildScenario(), true, undefined);

        expect(gameManager.game.party.weeks).toEqual(1);
        expect(gameManager.game.party.prosperity).toEqual(0);
        expect(gameManager.game.party.loot[LootType.axenut]).toBeUndefined();
        expect(gameManager.game.party.conclusions).toEqual([]);
        expect(scenarioManager.pendingWeekSections).toEqual([
          { week: 1, index: '2.1', edition: 'gh', group: undefined },
          { week: 1, index: '3.2', edition: 'gh', group: undefined }
        ]);
      });

      it('skips already solved conclusions', () => {
        settingsManager.settings.automaticWeekSections = false;
        gameManager.game.party.conclusions = [new GameScenarioModel('2.1', 'gh')];

        scenarioManager.passWeekSections(1, 'gh');

        expect(scenarioManager.pendingWeekSections.map((pending) => pending.index)).toEqual(['3.2']);
      });

      it('applies conclusions automatically with collective resources to the Frosthaven supply if enabled', () => {
        settingsManager.settings.automaticWeekSections = true;

        scenarioManager.finishScenario(buildScenario(), true, undefined);

        expect(gameManager.game.party.weeks).toEqual(1);
        expect(gameManager.game.party.prosperity).toEqual(1);
        expect(gameManager.game.party.loot[LootType.axenut]).toEqual(3);
        expect(gameManager.game.party.conclusions.some((model) => model.index === '2.1')).toBe(true);
        expect(scenarioManager.pendingWeekSections).toEqual([]);
      });
    });

    describe('personal quest autotrack', () => {
      function buildCharacter(name: string): Character {
        const data = Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)] });
        return new Character(data, 1);
      }

      function assignPersonalQuest(character: Character, autotrack: string, counter: number = 1) {
        character.progress.personalQuest = 'PQ1';
        character.progress.personalQuestAutotrack = true;
        gameManager.editionData = [
          Object.assign(new EditionData('gh', [], [], [], [], [], []), {
            personalQuests: [
              Object.assign(new PersonalQuest(), {
                cardId: 'PQ1',
                edition: 'gh',
                requirements: [Object.assign(new PersonalQuestRequirement(), { counter, autotrack })]
              })
            ]
          })
        ];
        settingsManager.settings.editions = ['gh'];
      }

      it('bumps "scenario:ID" and "scenariosCompleted" for every character on a successful finish', () => {
        const character = buildCharacter('brute');
        assignPersonalQuest(character, 'scenariosCompleted', 5);
        gameManager.game.figures = [character];

        scenarioManager.finishScenario(buildScenario(), true, undefined);

        expect(character.progress.personalQuestProgress[0]).toEqual(1);
      });

      it('does not bump scenario progress when the scenario failed', () => {
        const character = buildCharacter('brute');
        assignPersonalQuest(character, 'scenariosCompleted', 5);
        gameManager.game.figures = [character];

        scenarioManager.finishScenario(buildScenario(), false, undefined);

        expect(character.progress.personalQuestProgress[0] || 0).toEqual(0);
      });

      it('bumps "completedHighHP" only for a present character finishing at full health', () => {
        const full = buildCharacter('brute');
        full.maxHealth = 10;
        full.health = 10;
        assignPersonalQuest(full, 'completedHighHP', 5);

        const hurt = buildCharacter('tinkerer');
        hurt.progress.personalQuest = 'PQ1';
        hurt.progress.personalQuestAutotrack = true;
        hurt.maxHealth = 10;
        hurt.health = 6;

        gameManager.game.figures = [full, hurt];

        scenarioManager.finishScenario(buildScenario(), true, undefined);

        expect(full.progress.personalQuestProgress[0]).toEqual(1);
        expect(hurt.progress.personalQuestProgress[0] || 0).toEqual(0);
      });

      it('bumps "completedLowHP" only for a non-exhausted character at 2 or less HP', () => {
        const low = buildCharacter('brute');
        low.maxHealth = 10;
        low.health = 2;
        low.exhausted = false;
        assignPersonalQuest(low, 'completedLowHP', 5);

        const exhausted = buildCharacter('tinkerer');
        exhausted.progress.personalQuest = 'PQ1';
        exhausted.progress.personalQuestAutotrack = true;
        exhausted.maxHealth = 10;
        exhausted.health = 0;
        exhausted.exhausted = true;

        gameManager.game.figures = [low, exhausted];

        scenarioManager.finishScenario(buildScenario(), true, undefined);

        expect(low.progress.personalQuestProgress[0]).toEqual(1);
        expect(exhausted.progress.personalQuestProgress[0] || 0).toEqual(0);
      });

      it('bumps "itemBlueprint:ID" for every character when a scenario reward unlocks that item', () => {
        const character = buildCharacter('brute');
        assignPersonalQuest(character, 'itemBlueprint:73', 1);
        gameManager.game.figures = [character];
        settingsManager.settings.partySheet = true;

        scenarioManager.finishScenario(buildScenario({ itemBlueprints: ['73'] }), true, undefined);

        expect(character.progress.personalQuestProgress[0]).toEqual(1);
      });

      it('bumps "gold"/"battleGoals" by the reward amount, not by a flat 1', () => {
        const character = buildCharacter('brute');
        assignPersonalQuest(character, PersonalQuestAutotrackType.gold, 100);
        gameManager.game.figures = [character];
        settingsManager.settings.characterSheet = true;
        settingsManager.settings.scenarioRewards = true;

        scenarioManager.finishScenario(buildScenario({ gold: 15 }), true, undefined);

        expect(character.progress.personalQuestProgress[0]).toEqual(15);
      });

      it('bumps "sideScenarios" only when the finished scenario index falls in the tag range, and "bossScenarios" only when a boss-type monster was present', () => {
        const sideCharacter = buildCharacter('brute');
        assignPersonalQuest(sideCharacter, 'sideScenarios:52-95', 5);
        gameManager.game.figures = [sideCharacter];

        scenarioManager.finishScenario(buildScenario(), true, undefined); // index '1', outside 52-95
        expect(sideCharacter.progress.personalQuestProgress[0] || 0).toEqual(0);

        const bossCharacter = buildCharacter('tinkerer');
        assignPersonalQuest(bossCharacter, PersonalQuestAutotrackType.bossScenarios, 5);
        gameManager.editionData[0].monsters.push(Object.assign(new MonsterData(), { name: 'bandit-commander', edition: 'gh', boss: true }));
        gameManager.game.figures = [bossCharacter];
        const data = buildScenarioData({ edition: 'gh', index: '2', monsters: ['bandit-commander'] });
        scenarioManager.finishScenario(new Scenario(data), true, undefined);
        expect(bossCharacter.progress.personalQuestProgress[0]).toEqual(1);
      });

      it('bumps "scenarioRequirements" for a building named in the scenario\'s requirements', () => {
        const character = buildCharacter('brute');
        assignPersonalQuest(character, 'scenarioRequirements:board|climbing-gear|sled', 5);
        gameManager.game.figures = [character];
        const data = buildScenarioData({
          edition: 'gh',
          index: '1',
          requirements: [Object.assign(new ScenarioRequirement(), { buildings: ['climbing-gear'] })]
        });

        scenarioManager.finishScenario(new Scenario(data), true, undefined);

        expect(character.progress.personalQuestProgress[0]).toEqual(1);
      });

      it('bumps "exhaustedCharsFinish" by the count of exhausted allies, not counting the owner', () => {
        const owner = buildCharacter('brute');
        owner.exhausted = false;
        assignPersonalQuest(owner, PersonalQuestAutotrackType.exhaustedCharsFinish, 5);
        const exhaustedAlly = buildCharacter('tinkerer');
        exhaustedAlly.exhausted = true;
        const activeAlly = buildCharacter('spellweaver');
        activeAlly.exhausted = false;
        gameManager.game.figures = [owner, exhaustedAlly, activeAlly];

        scenarioManager.finishScenario(buildScenario(), true, undefined);

        expect(owner.progress.personalQuestProgress[0]).toEqual(1);
      });
    });
  });
});
