import { settingsManager } from 'src/app/game/businesslogic/Managers';
import { RandomManager, randomSeed, randomUUID } from 'src/app/game/businesslogic/RandomManager';
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

  it('creates uuids without touching the game seed', () => {
    const random = manager(9);
    expect(randomUUID()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(random.game.seed).toBe(9);
  });

  describe('preview outside of state changes', () => {
    function previewManager(seed: number): RandomManager {
      const random = manager(seed);
      random.previewOutsideChanges = true;
      return random;
    }

    const draw = (random: RandomManager) => random.shuffle([1, 2, 3, 4, 5, 6, 7, 8]);

    it('draws without advancing the game seed and repeats the preview for the same seed', () => {
      const random = previewManager(5);
      const first = draw(random);
      expect(random.game.seed).toBe(5);
      expect(draw(previewManager(5))).toEqual(first);
      expect(draw(previewManager(6))).not.toEqual(first);
    });

    it('continues the preview stream until a state change ends', () => {
      const random = previewManager(5);
      const first = draw(random);
      expect(draw(random)).not.toEqual(first);
      random.beginChange();
      random.endChange();
      const next = previewManager(random.game.seed);
      expect(draw(random)).toEqual(draw(next));
    });

    it('advances the game seed once on the next state change after a preview', () => {
      const random = previewManager(5);
      random.beginChange();
      random.endChange();
      expect(random.game.seed).toBe(5);

      draw(random);
      draw(random);
      random.beginChange();
      const committed = random.game.seed;
      expect(committed).not.toBe(5);
      random.endChange();
      random.beginChange();
      expect(random.game.seed).toBe(committed);
    });

    it('draws from the game seed during a state change', () => {
      const random = previewManager(5);
      random.beginChange();
      const value = random.next();
      expect(random.game.seed).not.toBe(5);
      expect(manager(5).next()).toBe(value);
    });

    it('restarts the preview when the game seed changes from outside', () => {
      const random = previewManager(5);
      draw(random);
      random.game.seed = 6;
      expect(draw(random)).toEqual(draw(previewManager(6)));
    });
  });

  it('serializes the seed with the game model', () => {
    settingsManager.settings.locale = settingsManager.defaultLocale;
    settingsManager.label.data = { partyAchievements: {}, globalAchievements: {} };
    const source = new Game();
    source.seed = 12345;
    new RandomManager(source).next();
    const model = source.toModel();
    expect(model.seed).toBe(source.seed);
    expect(model.seed).not.toBe(12345);

    const game = new Game();
    game.fromModel(model);
    expect(game.seed).toBe(model.seed);
  });
});
