import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { valueCalc } from 'src/app/ui/helper/valueCalc';

// valueCalc() is the pure formatting core behind the [value-calc] directive: given a raw
// action value (number, arithmetic expression, bracketed "[...]" expression, or free text with
// %label%/Math.* placeholders), it either evaluates it to a number (when settings.calculate is
// on) or renders a human display string. This spec exercises both modes; the label lookups fall
// back to the raw label key since no label data is loaded in the test environment (consistent
// with SettingsManager.spec.ts).

describe('valueCalc', () => {
  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.level = 1;
    settingsManager.settings.calculate = true;
  });

  describe('number input', () => {
    it('passes numbers through unchanged', () => {
      expect(valueCalc(5)).toEqual(5);
    });

    it('renders 0 as "-" when empty=true', () => {
      expect(valueCalc(0, undefined, true)).toEqual('-');
      expect(valueCalc(0)).toEqual(0);
    });
  });

  describe('string "0" / falsy input', () => {
    it('the literal string "0" always renders as "-"', () => {
      expect(valueCalc('0')).toEqual('-');
    });

    it('an empty string renders as "" normally, "-" when empty=true', () => {
      expect(valueCalc('')).toEqual('');
      expect(valueCalc('', undefined, true)).toEqual('-');
    });
  });

  describe('calculation mode (settings.calculate = true)', () => {
    it('evaluates a bare arithmetic expression using the given level as L', () => {
      expect(valueCalc('L+1', 5)).toEqual(6);
    });

    it('evaluates a bracketed expression, stripping the brackets', () => {
      expect(valueCalc('[L+1]', 5)).toEqual(6);
    });

    it('falls back to game.level when no level is given', () => {
      gameManager.game.level = 3;
      expect(valueCalc('L')).toEqual(3);
    });
  });

  describe('display mode (settings.calculate = false)', () => {
    beforeEach(() => {
      settingsManager.settings.calculate = false;
    });

    it('renders a bracketed expression as plain text instead of evaluating it', () => {
      expect(valueCalc('[L+1]', 5)).toEqual('L+1');
    });

    it('substitutes Math.floor(...) with an inline label (falls back to the raw label key)', () => {
      expect(valueCalc('[Math.floor(3.5)]')).toEqual('3.5 game.custom.math.floor');
    });

    it('renders free text, substituting %label% placeholders with the raw label key fallback', () => {
      expect(valueCalc('%game.action.attack%')).toEqual('game.action.attack');
    });
  });
});
