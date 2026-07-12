import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifier, AttackModifierDeck, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { GameScenarioModel } from 'src/app/game/model/Scenario';

describe('ImbuementManager', () => {
  let imbuementManager: typeof gameManager.imbuementManager;

  beforeEach(() => {
    gameManager.game.party.conclusions = [];
    gameManager.game.monsterAttackModifierDeck = new AttackModifierDeck();
    settingsManager.settings.alwaysGh2eImbuement = false;
    settingsManager.settings.partySheet = false;
    settingsManager.settings.gh2eImbuement = false;
    settingsManager.settings.gh2eImbuementKeep = false;
    vi.spyOn(gameManager, 'gh2eRules').mockReturnValue(true);

    imbuementManager = gameManager.imbuementManager;
    imbuementManager.available = false;
    imbuementManager.enabled = false;
    imbuementManager.imbuement = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('update', () => {
    it('is unavailable outside gh2e rules (with partySheet on, so the unavailable->advanced fallback does not mask it)', () => {
      settingsManager.settings.partySheet = true;
      vi.spyOn(gameManager, 'gh2eRules').mockReturnValue(false);
      gameManager.game.party.conclusions = [new GameScenarioModel('48.2', 'gh2e')];

      imbuementManager.update();

      expect(imbuementManager.available).toBe(false);
    });

    it('is unavailable when the required conclusion (48.2) is missing (with partySheet on)', () => {
      settingsManager.settings.partySheet = true;
      gameManager.game.party.conclusions = [];

      imbuementManager.update();

      expect(imbuementManager.available).toBe(false);
    });

    it('is available (basic) when conclusion 48.2 exists but not 16.5', () => {
      gameManager.game.party.conclusions = [new GameScenarioModel('48.2', 'gh2e')];

      imbuementManager.update();

      expect(imbuementManager.available).toBe(true);
    });

    it('is available as "advanced" when both conclusions 48.2 and 16.5 exist', () => {
      gameManager.game.party.conclusions = [new GameScenarioModel('48.2', 'gh2e'), new GameScenarioModel('16.5', 'gh2e')];

      imbuementManager.update();

      expect(imbuementManager.available).toBe('advanced');
    });

    it('forces "advanced" via alwaysGh2eImbuement setting even without any conclusion', () => {
      settingsManager.settings.alwaysGh2eImbuement = true;
      gameManager.game.party.conclusions = [];

      imbuementManager.update();

      expect(imbuementManager.available).toBe('advanced');
    });

    it('forces "advanced" when unavailable and partySheet setting is off', () => {
      settingsManager.settings.partySheet = false;
      gameManager.game.party.conclusions = [];

      imbuementManager.update();

      expect(imbuementManager.available).toBe('advanced');
    });

    it('enables imbuement when alwaysGh2eImbuement is set', () => {
      settingsManager.settings.alwaysGh2eImbuement = true;

      imbuementManager.update();

      expect(imbuementManager.enabled).toBe(true);
    });

    it('enables imbuement when available and the gh2eImbuement setting is on', () => {
      gameManager.game.party.conclusions = [new GameScenarioModel('48.2', 'gh2e')];
      settingsManager.settings.gh2eImbuement = true;

      imbuementManager.update();

      expect(imbuementManager.enabled).toBe(true);
    });

    it('does not enable imbuement when available but the gh2eImbuement setting is off', () => {
      gameManager.game.party.conclusions = [new GameScenarioModel('48.2', 'gh2e')];
      settingsManager.settings.gh2eImbuement = false;

      imbuementManager.update();

      expect(imbuementManager.enabled).toBe(false);
    });

    it('derives imbuement=true from the monster attack modifier deck containing an imbue card', () => {
      gameManager.game.monsterAttackModifierDeck.cards = [new AttackModifier(AttackModifierType.imbue)];

      imbuementManager.update();

      expect(imbuementManager.imbuement).toBe(true);
    });

    it('derives imbuement="advanced" when the deck also contains an advancedImbue card', () => {
      gameManager.game.monsterAttackModifierDeck.cards = [
        new AttackModifier(AttackModifierType.imbue),
        new AttackModifier(AttackModifierType.advancedImbue)
      ];

      imbuementManager.update();

      expect(imbuementManager.imbuement).toBe('advanced');
    });

    it('derives imbuement=false when the deck has no imbue cards', () => {
      gameManager.game.monsterAttackModifierDeck.cards = [new AttackModifier(AttackModifierType.plus1)];

      imbuementManager.update();

      expect(imbuementManager.imbuement).toBe(false);
    });

    it('keeps the previous imbuement value when gh2eImbuementKeep is set and imbuement was already truthy', () => {
      settingsManager.settings.gh2eImbuementKeep = true;
      imbuementManager.imbuement = 'advanced';
      gameManager.game.monsterAttackModifierDeck.cards = []; // deck would otherwise say "false"

      imbuementManager.update();

      expect(imbuementManager.imbuement).toBe('advanced');
    });

    it('recomputes imbuement from the deck when gh2eImbuementKeep is set but imbuement was falsy', () => {
      settingsManager.settings.gh2eImbuementKeep = true;
      imbuementManager.imbuement = false;
      gameManager.game.monsterAttackModifierDeck.cards = [new AttackModifier(AttackModifierType.imbue)];

      imbuementManager.update();

      expect(imbuementManager.imbuement).toBe(true);
    });
  });

  describe('disable', () => {
    it('strips imbue and advancedImbue cards from the deck', () => {
      vi.spyOn(gameManager.attackModifierManager, 'shuffleModifiers').mockImplementation(() => {});
      vi.spyOn(gameManager.attackModifierManager, 'addModifierByType').mockImplementation(() => {});
      const deck = new AttackModifierDeck();
      deck.cards = [
        new AttackModifier(AttackModifierType.imbue),
        new AttackModifier(AttackModifierType.advancedImbue),
        new AttackModifier(AttackModifierType.plus1)
      ];

      imbuementManager.disable(deck);

      expect(deck.cards.every((am) => am.type !== AttackModifierType.imbue && am.type !== AttackModifierType.advancedImbue)).toBe(true);
    });

    it('adds the "advanced" replacement set (2x minus1, 1x minus2, 2x plus0) when imbuement was "advanced"', () => {
      vi.spyOn(gameManager.attackModifierManager, 'shuffleModifiers').mockImplementation(() => {});
      const addSpy = vi.spyOn(gameManager.attackModifierManager, 'addModifierByType').mockImplementation(() => {});
      imbuementManager.imbuement = 'advanced';
      const deck = new AttackModifierDeck();
      deck.cards = [];

      imbuementManager.disable(deck);

      const types = addSpy.mock.calls.map((call) => call[1]);
      expect(types).toEqual([
        AttackModifierType.minus2,
        AttackModifierType.minus1,
        AttackModifierType.minus1,
        AttackModifierType.minus1,
        AttackModifierType.plus0,
        AttackModifierType.plus0
      ]);
    });

    it('adds the basic replacement set (3x minus1) when imbuement was not "advanced"', () => {
      vi.spyOn(gameManager.attackModifierManager, 'shuffleModifiers').mockImplementation(() => {});
      const addSpy = vi.spyOn(gameManager.attackModifierManager, 'addModifierByType').mockImplementation(() => {});
      imbuementManager.imbuement = true;
      const deck = new AttackModifierDeck();
      deck.cards = [];

      imbuementManager.disable(deck);

      const types = addSpy.mock.calls.map((call) => call[1]);
      expect(types).toEqual([AttackModifierType.minus1, AttackModifierType.minus1, AttackModifierType.minus1]);
    });

    it('sets imbuement back to false', () => {
      vi.spyOn(gameManager.attackModifierManager, 'shuffleModifiers').mockImplementation(() => {});
      vi.spyOn(gameManager.attackModifierManager, 'addModifierByType').mockImplementation(() => {});
      imbuementManager.imbuement = 'advanced';
      const deck = new AttackModifierDeck();
      deck.cards = [];

      imbuementManager.disable(deck);

      expect(imbuementManager.imbuement).toBe(false);
    });
  });

  describe('enable', () => {
    it('removes up to 3 minus1 cards and adds the basic imbuement modifier set', () => {
      const removeSpy = vi.spyOn(gameManager.attackModifierManager, 'removeModifierByType').mockImplementation(() => {});
      const addSpy = vi.spyOn(gameManager.attackModifierManager, 'addModifier').mockImplementation(() => {});
      const deck = new AttackModifierDeck();

      imbuementManager.enable(deck);

      expect(removeSpy).toHaveBeenCalledTimes(3);
      expect(removeSpy.mock.calls.every((call) => call[1] === AttackModifierType.minus1)).toBe(true);
      expect(addSpy).toHaveBeenCalled();
      expect(imbuementManager.imbuement).toBe(true);
    });

    it('sets imbuement=true immediately when gh2eImbuementKeep is set', () => {
      settingsManager.settings.gh2eImbuementKeep = true;
      vi.spyOn(gameManager.attackModifierManager, 'removeModifierByType').mockImplementation(() => {});
      vi.spyOn(gameManager.attackModifierManager, 'addModifier').mockImplementation(() => {});
      const deck = new AttackModifierDeck();

      imbuementManager.enable(deck);

      expect(imbuementManager.imbuement).toBe(true);
    });
  });

  describe('advanced', () => {
    it('removes the basic set (2x minus1, 1x minus2, 2x plus0) and adds both imbuement modifier sets', () => {
      const removeSpy = vi.spyOn(gameManager.attackModifierManager, 'removeModifierByType').mockImplementation(() => {});
      const addSpy = vi.spyOn(gameManager.attackModifierManager, 'addModifier').mockImplementation(() => {});
      const deck = new AttackModifierDeck();

      imbuementManager.advanced(deck);

      const removedTypes = removeSpy.mock.calls.map((call) => call[1]);
      expect(removedTypes).toEqual([
        AttackModifierType.minus2,
        AttackModifierType.minus1,
        AttackModifierType.minus1,
        AttackModifierType.minus1,
        AttackModifierType.plus0,
        AttackModifierType.plus0
      ]);
      expect(addSpy).toHaveBeenCalled();
      expect(imbuementManager.imbuement).toBe('advanced');
    });

    it('sets imbuement="advanced" immediately when gh2eImbuementKeep is set', () => {
      settingsManager.settings.gh2eImbuementKeep = true;
      vi.spyOn(gameManager.attackModifierManager, 'removeModifierByType').mockImplementation(() => {});
      vi.spyOn(gameManager.attackModifierManager, 'addModifier').mockImplementation(() => {});
      const deck = new AttackModifierDeck();

      imbuementManager.advanced(deck);

      expect(imbuementManager.imbuement).toBe('advanced');
    });
  });
});
