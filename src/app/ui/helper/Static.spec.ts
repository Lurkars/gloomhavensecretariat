import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { SpoilableMock } from 'src/app/game/model/data/Spoilable';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import {
  ghsDurationLabel,
  ghsFilterInputFocus,
  ghsHasSpoilers,
  ghsIsSpoiled,
  ghsModulo,
  ghsNotSpoiled,
  ghsRemoveDeadEntities,
  ghsTextSearch,
  ghsValueSign
} from 'src/app/ui/helper/Static';

// ghsUnit/ghsDefaultDialogPositions (CSS custom-property/ConnectionPositionPair geometry),
// ghsInputFullScreenCheck(Listener) (Capacitor/fullscreen API side effects) and
// ghsDialogClosingHelper (DialogRef/overlay DOM side effects) are thin DOM/platform wrappers
// with little branching logic of their own; this spec covers the pure helpers.

describe('Static helpers', () => {
  beforeEach(() => {
    settingsManager.settings.spoilers = [];
  });

  describe('ghsHasSpoilers', () => {
    it('is true when at least one item is spoilered and not revealed', () => {
      const items = [new SpoilableMock('a'), Object.assign(new SpoilableMock('b'), { spoiler: false })];
      expect(ghsHasSpoilers(items)).toBe(true);
    });

    it('is false once the spoilered item is revealed via settings', () => {
      settingsManager.settings.spoilers = ['a'];
      const items = [new SpoilableMock('a')];
      expect(ghsHasSpoilers(items)).toBe(false);
    });

    it('multiple=true requires more than one unrevealed spoilered item', () => {
      const items = [new SpoilableMock('a')];
      expect(ghsHasSpoilers(items, true)).toBe(false);

      items.push(new SpoilableMock('b'));
      expect(ghsHasSpoilers(items, true)).toBe(true);
    });
  });

  describe('ghsIsSpoiled', () => {
    it('a non-spoiler item is always considered spoiled (visible)', () => {
      expect(ghsIsSpoiled(Object.assign(new SpoilableMock('a'), { spoiler: false }))).toBe(true);
    });

    it('a spoiler item is spoiled once its name is in settings.spoilers', () => {
      const item = new SpoilableMock('a');
      expect(ghsIsSpoiled(item)).toBe(false);
      settingsManager.settings.spoilers = ['a'];
      expect(ghsIsSpoiled(item)).toBe(true);
    });

    it('[ALL] reveals every spoiler item', () => {
      settingsManager.settings.spoilers = ['[ALL]'];
      expect(ghsIsSpoiled(new SpoilableMock('anything'))).toBe(true);
    });
  });

  describe('ghsNotSpoiled', () => {
    it('returns only the items that are not yet revealed', () => {
      const revealed = new SpoilableMock('a');
      const hidden = new SpoilableMock('b');
      settingsManager.settings.spoilers = ['a'];
      expect(ghsNotSpoiled([revealed, hidden])).toEqual([hidden]);
    });
  });

  describe('ghsTextSearch', () => {
    it('matches case-insensitively when every space-separated part is found', () => {
      expect(ghsTextSearch('Bandit Guard', 'guard')).toBe(true);
      expect(ghsTextSearch('Bandit Guard', 'ban gua')).toBe(true);
      expect(ghsTextSearch('Bandit Guard', 'archer')).toBe(false);
    });

    it('match=true requires an exact (case-insensitive) match', () => {
      expect(ghsTextSearch('Bandit Guard', 'Bandit Guard', true)).toBe(true);
      expect(ghsTextSearch('Bandit Guard', 'bandit guard', true)).toBe(true);
      expect(ghsTextSearch('Bandit Guard', 'Bandit', true)).toBe(false);
    });
  });

  describe('ghsValueSign', () => {
    it('prefixes positive values with +', () => {
      expect(ghsValueSign(5)).toEqual('+5');
    });

    it('renders negative values as-is', () => {
      expect(ghsValueSign(-5)).toEqual('-5');
    });

    it('renders 0 as "0" by default, or "-" when empty=true', () => {
      expect(ghsValueSign(0)).toEqual('0');
      expect(ghsValueSign(0, true)).toEqual('-');
    });
  });

  describe('ghsModulo', () => {
    it('matches normal modulo for positive values', () => {
      expect(ghsModulo(7, 3)).toEqual(1);
    });

    it('wraps negative values into the positive range (unlike JS %)', () => {
      expect(ghsModulo(-1, 3)).toEqual(2);
      expect(-1 % 3).toEqual(-1); // sanity check: native % does not do this
    });
  });

  describe('ghsDurationLabel', () => {
    it('picks the largest applicable unit: days > hours > minutes > seconds', () => {
      expect(ghsDurationLabel(30)).toEqual('duration.seconds');
      expect(ghsDurationLabel(90)).toEqual('duration.minutes');
      expect(ghsDurationLabel(3700)).toEqual('duration.hours');
      expect(ghsDurationLabel(90000)).toEqual('duration.days');
    });

    it('appends a totalHours wrapper label when requested', () => {
      expect(ghsDurationLabel(3700, true)).toEqual('duration.totalHours');
    });
  });

  describe('ghsFilterInputFocus', () => {
    it('is true when no element (or a non-input element) is focused', () => {
      (document.activeElement as HTMLElement | null)?.blur();
      expect(ghsFilterInputFocus()).toBe(true);
    });

    it('is false when an input element is focused', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      expect(ghsFilterInputFocus()).toBe(false);
      input.remove();
    });
  });
});

describe('ghsRemoveDeadEntities', () => {
  function deadMonster(): { monster: Monster; entity: MonsterEntity } {
    const monster = new Monster(Object.assign(new MonsterData(), { name: 'bandit-guard', edition: 'gh' }), 1);
    const entity = new MonsterEntity(1, MonsterType.normal, monster);
    entity.dead = true;
    monster.entities = [entity];
    return { monster, entity };
  }

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    settingsManager.settings.animations = true;
  });

  it('removes dead entities immediately without animations', () => {
    settingsManager.settings.animations = false;
    const { monster, entity } = deadMonster();
    const before = vi.spyOn(gameManager.stateManager, 'beforeAutomatic');
    ghsRemoveDeadEntities([{ entity, figure: monster }]);
    expect(monster.entities).toEqual([]);
    expect(before).not.toHaveBeenCalled();
  });

  it('removes dead entities as automatic change after the animation', async () => {
    vi.useFakeTimers();
    settingsManager.settings.animations = true;
    settingsManager.settings.animationSpeed = 1;
    const { monster, entity } = deadMonster();
    const before = vi.spyOn(gameManager.stateManager, 'beforeAutomatic').mockImplementation(() => {});
    const after = vi.spyOn(gameManager.stateManager, 'afterAutomatic').mockImplementation(async () => {});
    ghsRemoveDeadEntities([{ entity, figure: monster }]);
    expect(monster.entities).toEqual([entity]);
    await vi.advanceTimersByTimeAsync(1500);
    expect(monster.entities).toEqual([]);
    expect(before).toHaveBeenCalledWith('removeDeadEntities');
    expect(after).toHaveBeenCalled();
  });

  it('skips entities revived in the meantime (e.g. undo)', async () => {
    vi.useFakeTimers();
    settingsManager.settings.animations = true;
    settingsManager.settings.animationSpeed = 1;
    const { monster, entity } = deadMonster();
    const before = vi.spyOn(gameManager.stateManager, 'beforeAutomatic').mockImplementation(() => {});
    ghsRemoveDeadEntities([{ entity, figure: monster }]);
    entity.dead = false;
    await vi.advanceTimersByTimeAsync(1500);
    expect(monster.entities).toEqual([entity]);
    expect(before).not.toHaveBeenCalled();
  });
});
