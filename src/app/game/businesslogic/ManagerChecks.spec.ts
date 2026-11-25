import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import {
  createTestCharacter,
  createTestMonster,
  createTestMonsterEntity,
  createTestObjective,
  createTestSummon,
  resetTestGame
} from 'src/app/game/commands/commandsTestHelpers';
import { CharacterSpecialAction } from 'src/app/game/model/data/CharacterStat';
import { Condition, ConditionName } from 'src/app/game/model/data/Condition';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { Perk } from 'src/app/game/model/data/Perks';
import { RoomData } from 'src/app/game/model/data/RoomData';
import { GameState } from 'src/app/game/model/Game';
import { SummonState } from 'src/app/game/model/Summon';

describe('manager checks for entity, monster, objective, level and scenario edits', () => {
  beforeEach(() => {
    resetTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets immunities and markers for all entities', () => {
    const character = createTestCharacter(1);
    const other = createTestCharacter(2);
    expect(gameManager.conditionManager.setImmunity([character, other], ConditionName.poison, true)).toBe(true);
    expect(gameManager.conditionManager.setImmunity([character], ConditionName.poison, true)).toBe(true);
    expect(character.immunities).toEqual([ConditionName.poison]);
    expect(gameManager.conditionManager.setImmunity([character], ConditionName.invalid, true)).toBe(false);
    gameManager.conditionManager.setImmunity([character, other], ConditionName.poison, false);
    expect(other.immunities).toEqual([]);

    expect(gameManager.entityManager.setMarker([character], 'invalid', true)).toBe(false);
    expect(gameManager.entityManager.setMarker([character], 'gh-brute', true)).toBe(true);
    expect(character.markers).toEqual(['gh-brute']);
    gameManager.entityManager.setMarker([character], 'gh-brute', false);
    expect(character.markers).toEqual([]);
  });

  it('turns muddle into strengthen with the GH item 108 and rejects deck conditions', () => {
    const character = createTestCharacter(1);
    character.progress.equippedItems = [{ name: '108', edition: 'gh' } as never];
    expect(gameManager.conditionManager.addManualCondition(character, character, new Condition(ConditionName.muddle))).toBe(true);
    expect(character.entityConditions.map((condition) => condition.name)).toEqual([ConditionName.strengthen]);
    expect(gameManager.conditionManager.addManualCondition(character, character, new Condition(ConditionName.bless))).toBe(false);
  });

  it('sets stack condition values and removes them at 0', () => {
    const character = createTestCharacter(1);
    expect(gameManager.conditionManager.setConditionValue(character, character, ConditionName.poison, 1)).toBe(false);
    expect(gameManager.conditionManager.setConditionValue(character, character, ConditionName.bane, -1)).toBe(false);
    const stack = Object.values(ConditionName).find((name) => new Condition(name).types.includes('stack' as never));
    if (stack) {
      expect(gameManager.conditionManager.setConditionValue(character, character, stack, 2)).toBe(true);
      expect(character.entityConditions.find((condition) => condition.name === stack)?.value).toBe(2);
      gameManager.conditionManager.setConditionValue(character, character, stack, 1);
      expect(character.entityConditions.find((condition) => condition.name === stack)?.value).toBe(1);
      gameManager.conditionManager.setConditionValue(character, character, stack, 0);
      expect(character.entityConditions.some((condition) => condition.name === stack && !condition.expired)).toBe(false);
    }
  });

  it('changes max health only while it stays at least 1', () => {
    const character = createTestCharacter(1, 1, 5);
    character.health = 5;
    expect(gameManager.entityManager.changeMaxHealth([character], -5)).toBe(false);
    expect(gameManager.entityManager.changeMaxHealth([character], 2)).toBe(true);
    expect(character.maxHealth).toBe(7);
    expect(character.health).toBe(7);
  });

  it('sets summon state, dormant and monster level within limits', () => {
    const monster = createTestMonster();
    const entity = createTestMonsterEntity(monster, 1);
    expect(gameManager.monsterManager.setSummonState(entity, SummonState.new)).toBe(true);
    expect(entity.summon).toBe(SummonState.new);
    expect(gameManager.monsterManager.setDormant(monster, true)).toBe(true);
    expect(entity.dormant).toBe(true);
    expect(gameManager.monsterManager.canSetLevel(monster, 8)).toBe(false);
    expect(gameManager.monsterManager.canSetLevel(monster, 0)).toBe(true);
  });

  it('sets objective deck, number and marker within limits', () => {
    const objective = createTestObjective(false, 2);
    const [first, second] = objective.entities;
    expect(gameManager.objectiveManager.setObjectiveNumber(objective, first, second.number)).toBe(false);
    expect(gameManager.objectiveManager.setObjectiveNumber(objective, first, 13)).toBe(false);
    expect(gameManager.objectiveManager.setObjectiveNumber(objective, first, 9)).toBe(true);
    expect(first.number).toBe(9);
    expect(gameManager.objectiveManager.setObjectiveMarker(objective, undefined, 'unknown')).toBe(false);
    expect(gameManager.objectiveManager.setAmDeck(objective, 'unknown')).toBe(false);
    expect(gameManager.objectiveManager.setAmDeck(objective, '')).toBe(true);
    gameManager.objectiveManager.removeAllObjectives();
    expect(gameManager.game.figures).toEqual([]);
  });

  it('limits level settings', () => {
    expect(gameManager.levelManager.setManualLevel(8)).toBe(false);
    expect(gameManager.levelManager.canSetPlayerCount(0)).toBe(false);
    expect(gameManager.levelManager.canSetPlayerCount(-1)).toBe(true);
    expect(gameManager.levelManager.canSetBbMonsterDifficulty(5)).toBe(false);
    expect(gameManager.levelManager.setSolo(true)).toBe(true);
    expect(gameManager.game.solo).toBe(true);
    gameManager.game.solo = false;
  });

  it('toggles custom scenarios, names them and reveals rooms once', () => {
    vi.spyOn(gameManager.scenarioManager, 'openRoom').mockImplementation(() => {});
    expect(gameManager.scenarioManager.setCustomScenarioName('name')).toBe(false);
    expect(gameManager.scenarioManager.setCustomScenario(true)).toBe(true);
    expect(gameManager.scenarioManager.canSetCustomScenario(true)).toBe(false);
    expect(gameManager.scenarioManager.setCustomScenarioName('name')).toBe(true);
    expect(gameManager.game.scenario?.name).toBe('name');
    const room = Object.assign(new RoomData(), { roomNumber: 2 });
    const scenario = gameManager.game.scenario!;
    expect(gameManager.scenarioManager.revealRoom(room, scenario)).toBe(true);
    scenario.revealedRooms = [2];
    expect(gameManager.scenarioManager.revealRoom(room, scenario)).toBe(false);
    expect(gameManager.scenarioManager.setCustomScenario(false)).toBe(true);
    expect(gameManager.game.scenario).toBeUndefined();
  });

  it('activates characters only during the round with initiative', () => {
    const character = createTestCharacter(1);
    const initiativeRequired = settingsManager.settings.initiativeRequired;
    settingsManager.settings.initiativeRequired = true;
    expect(gameManager.characterManager.canToggleActive(character)).toBe(false);
    gameManager.game.state = GameState.next;
    character.initiative = 0;
    expect(gameManager.characterManager.canToggleActive(character)).toBe(false);
    character.initiative = 10;
    expect(gameManager.characterManager.canToggleActive(character)).toBe(true);
    character.exhausted = true;
    expect(gameManager.characterManager.canToggleActive(character)).toBe(false);
    settingsManager.settings.initiativeRequired = initiativeRequired;
  });
});

describe('manager checks for game clock, unlocked items, special actions and active entities', () => {
  beforeEach(() => {
    resetTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clocks in and out and merges timestamps', () => {
    expect(gameManager.gameClockManager.canSetGameClock(false, 100)).toBe(false);
    expect(gameManager.gameClockManager.setGameClock(true, 100)).toBe(true);
    expect(gameManager.gameClockManager.setGameClock(true, 200)).toBe(false);
    expect(gameManager.gameClockManager.setGameClock(false, 50)).toBe(false);
    expect(gameManager.gameClockManager.setGameClock(false, 200)).toBe(true);
    gameManager.gameClockManager.setGameClock(true, 300);
    expect(gameManager.gameClockManager.canMergeGameClock(0)).toBe(false);
    expect(gameManager.gameClockManager.mergeGameClock(1)).toBe(true);
    expect(gameManager.game.gameClock).toEqual([expect.objectContaining({ clockIn: 100 })]);
    expect(gameManager.gameClockManager.canMergeGameClock(1)).toBe(false);
  });

  it('cycles the count of unlocked items', () => {
    const item = Object.assign(new ItemData(), { id: 1, edition: 'test', count: 3 });
    expect(gameManager.itemManager.canSetUnlockedItemCount(item, 1)).toBe(false);
    gameManager.itemManager.setItemUnlocked(item, true);
    const unlocked = gameManager.itemManager.unlockedItem(item);
    expect(unlocked?.count).toBe(-1);
    expect(gameManager.itemManager.nextUnlockedItemCount(item)).toBe(1);
    expect(gameManager.itemManager.setUnlockedItemCount(item, 1)).toBe(true);
    expect(gameManager.itemManager.nextUnlockedItemCount(item)).toBe(2);
    gameManager.itemManager.setUnlockedItemCount(item, 2);
    expect(gameManager.itemManager.nextUnlockedItemCount(item)).toBe(-1);
    expect(gameManager.itemManager.canSetUnlockedItemCount(item, 3)).toBe(false);
    expect(gameManager.itemManager.canSetUnlockedItemCount(item, 2)).toBe(false);

    const single = Object.assign(new ItemData(), { id: 2, edition: 'test', count: 1 });
    gameManager.itemManager.setItemUnlocked(single, true);
    expect(gameManager.itemManager.nextUnlockedItemCount(single)).toBe(-1);
    expect(gameManager.itemManager.canSetUnlockedItemCount(single, -1)).toBe(false);
  });

  it('requires level and perk for adding special actions but always allows removing them', () => {
    const character = createTestCharacter(1);
    const summon = createTestSummon(character);
    character.perks = [Object.assign(new Perk(), { count: 2 })];
    character.progress.perks = [1];
    const specialAction = (name: string, fields: Partial<CharacterSpecialAction> = {}) =>
      Object.assign(new CharacterSpecialAction(name, 0, false, false, false, false, undefined, 'manual'), fields);
    character.specialActions = [
      specialAction('leveled', { level: 3 }),
      specialAction('perked', { perk: 1 }),
      specialAction('summoned', { summon: true }),
      specialAction('untagged', { noTag: true })
    ];
    const manager = gameManager.specialActionsManager;
    expect(manager.canSetSpecialAction(character, character, 'leveled', true)).toBe(false);
    expect(manager.canSetSpecialAction(character, character, 'perked', true)).toBe(false);
    expect(manager.canSetSpecialAction(character, character, 'untagged', true)).toBe(false);
    expect(manager.canSetSpecialAction(character, character, 'summoned', true)).toBe(false);
    expect(manager.setSpecialAction(character, summon, 'summoned', true)).toBe(true);
    expect(summon.tags).toEqual(['summoned']);

    character.progress.perks = [2];
    expect(manager.setSpecialAction(character, character, 'perked', true)).toBe(true);
    character.progress.perks = [0];
    expect(manager.canSetSpecialAction(character, character, 'perked', true)).toBe(false);
    expect(manager.setSpecialAction(character, character, 'perked', false)).toBe(true);
    expect(character.tags).toEqual([]);
  });

  it('only toggles standees and summons active during a round', () => {
    const monster = createTestMonster();
    const entity = createTestMonsterEntity(monster, 1);
    const character = createTestCharacter(1);
    const summon = createTestSummon(character);
    const other = createTestCharacter(2);
    gameManager.game.state = GameState.draw;
    expect(gameManager.entityManager.canSetEntityActive(monster, entity, true)).toBe(false);
    gameManager.game.state = GameState.next;
    expect(gameManager.entityManager.canSetEntityActive(character, character, true)).toBe(false);
    expect(gameManager.entityManager.canSetEntityActive(other, summon, true)).toBe(false);
    expect(gameManager.entityManager.canSetEntityActive(character, summon, true)).toBe(true);
    expect(gameManager.entityManager.setEntityActive(monster, entity, true)).toBe(true);
    expect(entity.active).toBe(true);
    expect(gameManager.entityManager.canSetEntityActive(monster, entity, true)).toBe(false);
  });
});
