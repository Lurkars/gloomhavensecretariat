import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { RandomManager, randomSeed } from 'src/app/game/businesslogic/RandomManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Game } from 'src/app/game/model/Game';

describe('RandomManager', () => {
  function manager(seed: number): RandomManager {
    const game = new Game();
    game.seed = seed;
    return new RandomManager(game);
  }

  it('creates 32 bit integer seeds', () => {
    const seed = randomSeed();
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBe(seed | 0);
  });

  it('produces the same sequence for the same seed', () => {
    const first = manager(42);
    const second = manager(42);
    const values = [first.next(), first.next(), first.next()];
    expect([second.next(), second.next(), second.next()]).toEqual(values);
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(new Set(values).size).toBe(3);
    expect(manager(43).next()).not.toBe(values[0]);
  });

  it('advances the seed stored in the game', () => {
    const random = manager(42);
    random.next();
    expect(random.game.seed).not.toBe(42);
    expect(random.game.seed).toBe(random.game.seed | 0);
  });

  it('returns integers in range', () => {
    const random = manager(7);
    for (let i = 0; i < 100; i++) {
      const value = random.int(6);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(6);
    }
  });

  it('shuffles deterministically in place', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8];
    const result = manager(3).shuffle(array);
    expect(result).toBe(array);
    expect([...array].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(manager(3).shuffle([1, 2, 3, 4, 5, 6, 7, 8])).toEqual(array);
  });

  it('creates deterministic v4 formatted uuids', () => {
    const uuid = manager(9).uuid();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(manager(9).uuid()).toBe(uuid);
    const random = manager(9);
    expect(random.uuid()).not.toBe(random.uuid());
  });

  it('serializes the seed with the game model', () => {
    settingsManager.settings.locale = settingsManager.defaultLocale;
    settingsManager.label.data = { partyAchievements: {}, globalAchievements: {} };
    const seed = gameManager.game.seed;
    gameManager.randomManager.next();
    const model = gameManager.game.toModel();
    expect(model.seed).toBe(gameManager.game.seed);
    expect(model.seed).not.toBe(seed);

    const game = new Game();
    game.fromModel(model);
    expect(game.seed).toBe(model.seed);
  });
});
