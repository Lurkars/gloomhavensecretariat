import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Game } from 'src/app/game/model/Game';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { Identifier } from 'src/app/game/model/data/Identifier';

describe('Game model', () => {
  beforeEach(() => {
    // Party.migrate() (invoked from Game.fromModel()) reads settingsManager.label.data.* and,
    // for non-default locales, gameManager.editionData; keep locale at the default and stub the
    // label data so migrate() doesn't throw on the unrelated label-lookup machinery.
    settingsManager.settings.locale = settingsManager.defaultLocale;
    settingsManager.label.data = { partyAchievements: {}, globalAchievements: {} };
    settingsManager.settings.gameClockMerge = false;
  });

  describe('toModel/fromModel round-trip', () => {
    it('reproduces basic scalar fields', () => {
      const game = new Game();
      game.revision = 5;
      game.revisionOffset = 1;
      game.edition = 'gh';
      game.conditions = ['poison' as any];
      game.level = 4;
      game.levelCalculation = false;
      game.levelAdjustment = 2;
      game.bonusAdjustment = -1;
      game.ge5Player = false;
      game.ge5PlayerCapped = true;
      game.playerCount = 3;
      game.round = 7;
      game.roundResets = [1, 2];
      game.roundResetsHidden = [3];
      game.solo = true;
      game.server = false;
      game.eventDraw = 'card-1';
      game.keepFavors = true;
      game.favors = [new Identifier('a', 'gh')];
      game.favorPoints = [1, 2];

      const model = game.toModel();
      const restored = new Game();
      restored.fromModel(model);

      expect(restored.revision).toBe(5);
      expect(restored.revisionOffset).toBe(1);
      expect(restored.edition).toBe('gh');
      expect(restored.conditions).toEqual(['poison']);
      expect(restored.level).toBe(4);
      expect(restored.levelCalculation).toBe(false);
      expect(restored.levelAdjustment).toBe(2);
      expect(restored.bonusAdjustment).toBe(-1);
      expect(restored.ge5Player).toBe(false);
      expect(restored.ge5PlayerCapped).toBe(true);
      expect(restored.playerCount).toBe(3);
      expect(restored.round).toBe(7);
      expect(restored.roundResets).toEqual([1, 2]);
      expect(restored.roundResetsHidden).toEqual([3]);
      expect(restored.solo).toBe(true);
      expect(restored.eventDraw).toBe('card-1');
      expect(restored.keepFavors).toBe(true);
      expect(restored.favors).toEqual([new Identifier('a', 'gh')]);
      expect(restored.favorPoints).toEqual([1, 2]);
    });

    it('defaults playerCount to -1 when the model has none', () => {
      const game = new Game();
      const model = game.toModel();
      (model as any).playerCount = undefined;

      const restored = new Game();
      restored.fromModel(model);

      expect(restored.playerCount).toBe(-1);
    });

    it('always applies playSeconds/totalSeconds when server=true and model.server=false', () => {
      const game = new Game();
      game.server = true;
      game.playSeconds = 10;
      game.totalSeconds = 20;

      const model = game.toModel();
      model.server = false;
      model.playSeconds = 999;
      model.totalSeconds = 888;

      game.fromModel(model);

      expect(game.playSeconds).toBe(999);
      expect(game.totalSeconds).toBe(888);
    });

    it('only advances playSeconds/totalSeconds (never rewinds) for a non-server restore', () => {
      const game = new Game();
      game.server = false;
      game.playSeconds = 100;
      game.totalSeconds = 200;

      const model = game.toModel();
      model.server = false;
      model.playSeconds = 10; // lower than current
      model.totalSeconds = 20;

      game.fromModel(model);

      expect(game.playSeconds).toBe(100);
      expect(game.totalSeconds).toBe(200);
    });

    it('round-trips ObjectiveContainer figures', () => {
      const game = new Game();
      const objective = new ObjectiveContainer('u1');
      objective.name = 'crate';
      objective.health = 5;
      game.figures = [objective];

      const model = game.toModel();
      const restored = new Game();
      restored.fromModel(model);

      expect(restored.figures.length).toBe(1);
      expect(restored.figures[0]).toBeInstanceOf(ObjectiveContainer);
      expect((restored.figures[0] as ObjectiveContainer).name).toBe('crate');
      expect((restored.figures[0] as ObjectiveContainer).health).toBe(5);
    });

    it('drops figures no longer referenced by the model (character/monster/objectiveContainer lists)', () => {
      const game = new Game();
      const objective = new ObjectiveContainer('u1');
      game.figures = [objective];

      const model = game.toModel();
      model.objectiveContainers = [];

      game.fromModel(model);

      expect(game.figures.length).toBe(0);
    });

    it('round-trips the elementBoard state', () => {
      const game = new Game();
      game.elementBoard[0].state = 'strong' as any;

      const model = game.toModel();
      const restored = new Game();
      restored.fromModel(model);

      expect(restored.elementBoard[0].state).toBe('strong');
    });

    it('keeps unlockedCharacters that are already in "edition:name" form untouched', () => {
      const game = new Game();
      game.unlockedCharacters = ['gh:brute'];

      const model = game.toModel();
      const restored = new Game();
      restored.fromModel(model);

      expect(restored.unlockedCharacters).toEqual(['gh:brute']);
    });

    it('creates exactly one party (parties=[party]) even when the model omits parties', () => {
      const game = new Game();
      const model = game.toModel();
      (model as any).parties = undefined;

      const restored = new Game();
      restored.fromModel(model);

      expect(restored.parties.length).toBe(1);
      expect(restored.parties[0]).toBe(restored.party);
    });
  });
});
