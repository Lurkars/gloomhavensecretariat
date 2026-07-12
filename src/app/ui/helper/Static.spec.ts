import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { SpoilableMock } from 'src/app/game/model/data/Spoilable';
import {
  ghsDurationLabel,
  ghsFilterInputFocus,
  ghsHasSpoilers,
  ghsIsSpoiled,
  ghsModulo,
  ghsNotSpoiled,
  ghsShuffleArray,
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

  describe('ghsShuffleArray', () => {
    it('returns an array with the same elements (possibly reordered)', () => {
      const input = [1, 2, 3, 4, 5];
      const result = ghsShuffleArray([...input]);
      expect(result.sort()).toEqual(input.sort());
    });

    it('shuffles in place and returns the same array reference', () => {
      const input = [1, 2, 3];
      expect(ghsShuffleArray(input)).toBe(input);
    });
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
