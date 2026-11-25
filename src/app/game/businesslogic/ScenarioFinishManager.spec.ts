import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { BattleGoal } from 'src/app/game/model/data/BattleGoal';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';
import { ScenarioData, ScenarioRewards } from 'src/app/game/model/data/ScenarioData';
import { GameScenarioModel, Scenario } from 'src/app/game/model/Scenario';

describe('ScenarioFinishManager', () => {
  const manager = gameManager.scenarioFinishManager;
  const battleGoals = settingsManager.settings.battleGoals;

  beforeEach(() => {
    resetTestGame();
    gameManager.game.scenario = new Scenario(Object.assign(new ScenarioData(), { index: '1', edition: 'test', name: 'test' }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    settingsManager.settings.battleGoals = battleGoals;
    gameManager.challengesManager.enabled = false;
  });

  it('opens a finish only once and closes it', () => {
    createTestCharacter(1);
    expect(manager.openFinish(false)).toBe(true);
    expect(gameManager.game.finish?.success).toBe(false);
    expect(manager.openFinish(true)).toBe(false);
    expect(manager.closeFinish()).toBe(true);
    expect(gameManager.game.finish).toBeUndefined();
    expect(manager.closeFinish()).toBe(false);
  });

  it('snaps battle goal checks to the checks of the selected battle goal', () => {
    const character = createTestCharacter(1);
    settingsManager.settings.battleGoals = true;
    character.battleGoal = true;
    character.battleGoals = [new Identifier('1', 'test')];
    vi.spyOn(gameManager.battleGoalManager, 'getBattleGoal').mockReturnValue(Object.assign(new BattleGoal(), { checks: 3 }));

    expect(manager.battleGoalToggleValue(character, 0, 1, true)).toBe(3);
    expect(manager.battleGoalToggleValue(character, 3, 2, false)).toBe(0);
    expect(manager.validBattleGoalValue(character, 3)).toBe(true);
    expect(manager.validBattleGoalValue(character, 2)).toBe(false);
    expect(manager.validBattleGoalValue(character, 4)).toBe(false);
    character.absent = true;
    expect(manager.validBattleGoalValue(character, 3)).toBe(false);
    expect(manager.validBattleGoalValue(character, 0)).toBe(true);
  });

  it('limits battle goal checks to 2 without trial 349', () => {
    const character = createTestCharacter(1);
    expect(manager.validBattleGoalValue(character, 2)).toBe(true);
    expect(manager.validBattleGoalValue(character, 3)).toBe(false);
    character.progress.trial = new Identifier('349', 'fh');
    expect(manager.validBattleGoalValue(character, 5)).toBe(true);
  });

  it('counts and toggles challenges, swapping kept cards for the second one first', () => {
    gameManager.challengesManager.enabled = true;
    gameManager.game.challengeDeck.keep = [0, 1, 2];
    expect(manager.finishChallengeCount()).toBe(3);
    const swap = vi.spyOn(gameManager.challengesManager, 'swapKeptCards').mockImplementation(() => {});
    expect(manager.toggleChallenges(0, true)).toBe(1);
    expect(swap).toHaveBeenCalled();
    expect(manager.toggleChallenges(1, true)).toBe(2);
    expect(manager.toggleChallenges(2, true)).toBe(1);
    expect(manager.toggleChallenges(1, false)).toBe(0);

    manager.openFinish(true);
    expect(manager.canSetFinishChallenges(2)).toBe(true);
    expect(manager.canSetFinishChallenges(3)).toBe(false);
    gameManager.game.challengeDeck.keep = [0];
    expect(manager.canSetFinishChallenges(2)).toBe(false);
  });

  it('blocks reward items that are distributed or owned', () => {
    const first = createTestCharacter(1);
    const second = createTestCharacter(2);
    const item = Object.assign(new ItemData(), { id: 1, edition: 'test', count: 2 });
    const context = {
      characters: [first, second],
      items: [[0], []],
      rewards: Object.assign(new ScenarioRewards(), { items: ['1'] }),
      rewardItems: { items: [item], counts: [1] }
    };
    expect(manager.finishItemBlocked(context, 0, 0)).toBe(false);
    expect(manager.finishItemBlocked(context, 1, 0)).toBe(true);
    context.items = [[], []];
    expect(manager.finishItemBlocked(context, 1, 0)).toBe(false);
    second.progress.items = [new Identifier('1', 'test')];
    expect(manager.finishItemBlocked(context, 1, 0)).toBe(true);
  });

  it('limits collective rewards to their totals', () => {
    const rewards = Object.assign(new ScenarioRewards(), {
      collectiveGold: 5,
      collectiveResources: [{ type: LootType.lumber, value: 2 }]
    });
    expect(manager.validCollectiveGold(rewards, [3], 1, 2)).toBe(true);
    expect(manager.validCollectiveGold(rewards, [3], 1, 3)).toBe(false);
    expect(manager.validCollectiveGold(rewards, [3], 0, 5)).toBe(true);
    expect(manager.validCollectiveGold(undefined, [], 0, 1)).toBe(false);
    expect(manager.validCollectiveResource(rewards, [{ lumber: 1 }], 1, LootType.lumber, 1)).toBe(true);
    expect(manager.validCollectiveResource(rewards, [{ lumber: 1 }], 1, LootType.lumber, 2)).toBe(false);
    expect(manager.validCollectiveResource(rewards, [], 0, LootType.metal, 1)).toBe(false);
  });

  it('prepares reward defaults for the summary', () => {
    const solo = createTestCharacter(1);
    const absent = createTestCharacter(2);
    absent.absent = true;
    gameManager.game.unlockedCharacters = ['test:brute'];
    const rewards = Object.assign(new ScenarioRewards(), {
      collectiveGold: 4,
      items: ['1'],
      chooseLocation: ['a', 'b'],
      chooseUnlockCharacter: ['brute', 'spellweaver'],
      calendarSectionManual: [{ section: '1.1', hint: '' }]
    });
    const draft = {
      collectiveGold: [],
      collectiveResources: [],
      items: [],
      chooseLocation: undefined,
      chooseUnlockCharacter: undefined,
      calendarSectionManual: [],
      randomItemBlueprints: [],
      randomItemDesigns: [],
      randomItem: undefined,
      randomItems: [],
      randomSideScenario: undefined
    };
    const item = Object.assign(new ItemData(), { id: 1, edition: 'test', count: 1 });
    manager.prepareFinishRewards(draft, gameManager.game.scenario as Scenario, rewards, [solo, absent], [item], false);
    expect(draft.collectiveGold).toEqual([0, 0]);
    expect(draft.items).toEqual([[0]]);
    expect(draft.chooseLocation).toBe('a');
    expect(draft.chooseUnlockCharacter).toBe('spellweaver');
    expect(draft.calendarSectionManual).toEqual([-1]);
    gameManager.game.unlockedCharacters = [];
  });

  it('only accepts calendar sections, locations and characters of the rewards', () => {
    const rewards = Object.assign(new ScenarioRewards(), {
      calendarSectionManual: [{ section: '1.1', hint: '' }],
      chooseLocation: ['a'],
      chooseUnlockCharacter: ['brute']
    });
    expect(manager.validCalendarSection(rewards, 0, -1)).toBe(true);
    expect(manager.validCalendarSection(rewards, 0, -2)).toBe(false);
    expect(manager.validCalendarSection(rewards, 1, 2)).toBe(false);
    expect(manager.validLocation(rewards, 'a')).toBe(true);
    expect(manager.validLocation(rewards, '')).toBe(true);
    expect(manager.validLocation(rewards, 'b')).toBe(false);
    expect(manager.validUnlockCharacter(rewards, 'brute')).toBe(true);
    expect(manager.validUnlockCharacter(rewards, 'spellweaver')).toBe(false);
  });

  it('adds and removes manual successes, rewards only for the first campaign success', () => {
    const scenarioData = Object.assign(new ScenarioData(), { index: '2', edition: 'test', name: 'two' });
    const finish = vi.spyOn(manager, 'finishScenario').mockImplementation(() => {
      gameManager.game.party.scenarios.push(new GameScenarioModel('2', 'test'));
    });
    vi.spyOn(gameManager.scenarioRequirementsManager, 'isBlocked').mockReturnValue(false);
    const locked = vi.spyOn(gameManager.scenarioRequirementsManager, 'isLocked').mockReturnValue(true);
    gameManager.game.party.campaignMode = true;
    expect(manager.addScenarioSuccess(scenarioData)).toBe(false);
    expect(manager.addScenarioSuccess(scenarioData, undefined, true)).toBe(true);
    expect(finish.mock.calls[0][6]).toBe(true);
    locked.mockReturnValue(false);
    expect(manager.addScenarioSuccess(scenarioData)).toBe(true);
    expect(finish.mock.calls[1][6]).toBe(false);
    expect(manager.finishedCount(scenarioData)).toBe(2);
    expect(manager.removeScenarioSuccess(scenarioData)).toBe(true);
    expect(manager.finishedCount(scenarioData)).toBe(1);
    expect(manager.canRemoveScenarioSuccess(scenarioData, true)).toBe(false);
    expect(manager.removeScenarioSuccess(scenarioData, true)).toBe(false);
  });

  it('passes a week only for regular FH scenarios', () => {
    vi.spyOn(gameManager, 'fhRules').mockReturnValue(true);
    const automaticPassTime = settingsManager.settings.automaticPassTime;
    const partySheet = settingsManager.settings.partySheet;
    settingsManager.settings.automaticPassTime = true;
    settingsManager.settings.partySheet = true;
    const scenarioData = Object.assign(new ScenarioData(), { index: '2', edition: 'test' });
    expect(manager.passesWeek(scenarioData, undefined, false, true)).toBe(true);
    expect(manager.passesWeek(scenarioData, undefined, true, true)).toBe(false);
    expect(manager.passesWeek(scenarioData, undefined, false, false)).toBe(false);
    expect(manager.passesWeek(scenarioData, Object.assign(new ScenarioRewards(), { calendarIgnore: true }), false, true)).toBe(false);
    expect(manager.passesWeek(Object.assign(new ScenarioData(), { solo: 'brute' }), undefined, false, true)).toBe(false);
    expect(manager.hasForcedLinks(Object.assign(new ScenarioData(), { forcedLinks: ['3'] }), undefined)).toBe(true);
    settingsManager.settings.automaticPassTime = automaticPassTime;
    settingsManager.settings.partySheet = partySheet;
  });

  it('calculates the inspiration bonus and the experience preview', () => {
    const character = createTestCharacter(1);
    createTestCharacter(2);
    const scenarioData = Object.assign(new ScenarioData(), { index: '2', edition: 'test' });
    expect(manager.inspirationBonus(scenarioData, undefined)).toBe(2);
    expect(manager.inspirationBonus(scenarioData, Object.assign(new ScenarioRewards(), { ignoredBonus: ['inspiration'] }))).toBe(0);
    expect(manager.inspirationBonus(Object.assign(new ScenarioData(), { solo: 'brute' }), undefined)).toBe(0);

    vi.spyOn(gameManager.levelManager, 'experience').mockReturnValue(4);
    character.progress.experience = 10;
    character.experience = 3;
    expect(manager.finishExperience(character, Object.assign(new ScenarioRewards(), { experience: 5 }), true, 1)).toBe(24);
    expect(manager.finishExperience(character, undefined, false, 0)).toBe(13);
    character.progress.battleGoals = 2;
    expect(manager.battleGoalPerkGained(character, 1)).toBe(true);
    expect(manager.battleGoalPerkGained(character, 0)).toBe(false);
  });

  it('keeps the custom overlay text of a solved conclusion', () => {
    const conclusion = Object.assign(new ScenarioData(), { index: 'c1', edition: 'test' });
    expect(manager.setConclusionCustomText(conclusion, 'text')).toBe(false);
    gameManager.game.party.conclusions = [new GameScenarioModel('c1', 'test')];
    expect(manager.setConclusionCustomText(conclusion, 'text')).toBe(true);
    expect(manager.conclusionCustomText(conclusion)).toBe('text');
  });
});
