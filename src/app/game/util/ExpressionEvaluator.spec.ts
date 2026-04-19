import { evaluateExpression } from 'src/app/game/util/ExpressionEvaluator';

describe('evaluateExpression', () => {
  // ---- Literals ----
  describe('literals', () => {
    it('integer', () => {
      expect(evaluateExpression('42')).toBe(42);
    });

    it('decimal', () => {
      expect(evaluateExpression('3.14')).toBe(3.14);
    });

    it('true → 1', () => {
      expect(evaluateExpression('true')).toBe(1);
    });

    it('false → 0', () => {
      expect(evaluateExpression('false')).toBe(0);
    });
  });

  // ---- Variables ----
  describe('variables', () => {
    it('single variable', () => {
      expect(evaluateExpression('L', { L: 5 })).toBe(5);
    });

    it('unknown variable throws', () => {
      expect(() => evaluateExpression('Z')).toThrow("Unknown variable 'Z'");
    });
  });

  // ---- Arithmetic ----
  describe('arithmetic', () => {
    it('addition', () => {
      expect(evaluateExpression('2 + 3')).toBe(5);
    });

    it('subtraction', () => {
      expect(evaluateExpression('10 - 4')).toBe(6);
    });

    it('multiplication', () => {
      expect(evaluateExpression('3 * 7')).toBe(21);
    });

    it('division', () => {
      expect(evaluateExpression('20 / 4')).toBe(5);
    });

    it('modulo', () => {
      expect(evaluateExpression('7 % 3')).toBe(1);
    });

    it('x as multiplication shorthand', () => {
      expect(evaluateExpression('2x3')).toBe(6);
    });

    it('Cx2 parses as C * 2', () => {
      expect(evaluateExpression('Cx2', { C: 5 })).toBe(10);
    });
  });

  // ---- Unary ----
  describe('unary', () => {
    it('unary minus', () => {
      expect(evaluateExpression('-5')).toBe(-5);
    });

    it('unary plus', () => {
      expect(evaluateExpression('+5')).toBe(5);
    });

    it('double negation', () => {
      expect(evaluateExpression('--3')).toBe(3);
    });
  });

  // ---- Operator precedence ----
  describe('precedence', () => {
    it('mul before add', () => {
      expect(evaluateExpression('2 + 3 * 4')).toBe(14);
    });

    it('parentheses override precedence', () => {
      expect(evaluateExpression('(2 + 3) * 4')).toBe(20);
    });

    it('mixed operations', () => {
      expect(evaluateExpression('2 * L + 1', { L: 3 })).toBe(7);
    });
  });

  // ---- Comparison (two-char) ----
  describe('comparison (==, !=, >, <, >=, <=)', () => {
    it('== true', () => {
      expect(evaluateExpression('5 == 5')).toBe(1);
    });

    it('== false', () => {
      expect(evaluateExpression('5 == 3')).toBe(0);
    });

    it('!= true', () => {
      expect(evaluateExpression('5 != 3')).toBe(1);
    });

    it('!= false', () => {
      expect(evaluateExpression('5 != 5')).toBe(0);
    });

    it('> true', () => {
      expect(evaluateExpression('5 > 3')).toBe(1);
    });

    it('> false', () => {
      expect(evaluateExpression('3 > 5')).toBe(0);
    });

    it('< true', () => {
      expect(evaluateExpression('3 < 5')).toBe(1);
    });

    it('< false', () => {
      expect(evaluateExpression('5 < 3')).toBe(0);
    });

    it('>= equal', () => {
      expect(evaluateExpression('5 >= 5')).toBe(1);
    });

    it('>= greater', () => {
      expect(evaluateExpression('6 >= 5')).toBe(1);
    });

    it('>= less', () => {
      expect(evaluateExpression('4 >= 5')).toBe(0);
    });

    it('<= equal', () => {
      expect(evaluateExpression('5 <= 5')).toBe(1);
    });

    it('<= less', () => {
      expect(evaluateExpression('4 <= 5')).toBe(1);
    });

    it('<= greater', () => {
      expect(evaluateExpression('6 <= 5')).toBe(0);
    });
  });

  // ---- Three-char comparison (===, !==, >==, <==) ----
  describe('three-char comparison (===, !==, >==, <==)', () => {
    it('=== true', () => {
      expect(evaluateExpression('5 === 5')).toBe(1);
    });

    it('=== false', () => {
      expect(evaluateExpression('5 === 3')).toBe(0);
    });

    it('!== true', () => {
      expect(evaluateExpression('5 !== 3')).toBe(1);
    });

    it('!== false', () => {
      expect(evaluateExpression('5 !== 5')).toBe(0);
    });

    it('>== equal', () => {
      expect(evaluateExpression('5 >== 5')).toBe(1);
    });

    it('>== greater', () => {
      expect(evaluateExpression('6 >== 5')).toBe(1);
    });

    it('>== less', () => {
      expect(evaluateExpression('4 >== 5')).toBe(0);
    });

    it('<== equal', () => {
      expect(evaluateExpression('5 <== 5')).toBe(1);
    });

    it('<== less', () => {
      expect(evaluateExpression('4 <== 5')).toBe(1);
    });

    it('<== greater', () => {
      expect(evaluateExpression('6 <== 5')).toBe(0);
    });
  });

  // ---- Logical ----
  describe('logical', () => {
    it('&& both true', () => {
      expect(evaluateExpression('1 && 1')).toBe(1);
    });

    it('&& one false', () => {
      expect(evaluateExpression('1 && 0')).toBe(0);
    });

    it('|| both false', () => {
      expect(evaluateExpression('0 || 0')).toBe(0);
    });

    it('|| one true', () => {
      expect(evaluateExpression('0 || 1')).toBe(1);
    });

    it('&& with comparison', () => {
      expect(evaluateExpression('R > 3 && R % 3 === 1', { R: 7 })).toBe(1);
    });
  });

  // ---- Ternary ----
  describe('ternary', () => {
    it('truthy condition picks ifTrue', () => {
      expect(evaluateExpression('1 ? 10 : 20')).toBe(10);
    });

    it('falsy condition picks ifFalse', () => {
      expect(evaluateExpression('0 ? 10 : 20')).toBe(20);
    });

    it('nested ternary', () => {
      expect(evaluateExpression('1 ? 0 ? 10 : 20 : 30')).toBe(20);
    });

    it('ternary with expressions', () => {
      expect(evaluateExpression('L > 3 ? L * 2 : L + 1', { L: 5 })).toBe(10);
      expect(evaluateExpression('L > 3 ? L * 2 : L + 1', { L: 2 })).toBe(3);
    });
  });

  // ---- Grouping ----
  describe('grouping', () => {
    it('nested parentheses', () => {
      expect(evaluateExpression('((2 + 3) * (4 - 1))')).toBe(15);
    });

    it('unmatched paren throws', () => {
      expect(() => evaluateExpression('(2 + 3')).toThrow();
    });
  });

  // ---- Whitespace handling ----
  describe('whitespace', () => {
    it('no spaces', () => {
      expect(evaluateExpression('2+3*4')).toBe(14);
    });

    it('extra spaces', () => {
      expect(evaluateExpression('  2  +  3  ')).toBe(5);
    });

    it('tabs and newlines', () => {
      expect(evaluateExpression('\t2\n+\r3')).toBe(5);
    });
  });

  // ---- Error cases ----
  describe('errors', () => {
    it('unexpected character', () => {
      expect(() => evaluateExpression('2 @ 3')).toThrow();
    });

    it('trailing operator', () => {
      expect(() => evaluateExpression('2 +')).toThrow();
    });

    it('empty expression', () => {
      expect(() => evaluateExpression('')).toThrow();
    });
  });

  // ---- Game variables (HP, H, R, L, C, etc.) ----
  describe('game variables', () => {
    const vars = { H: 4, HP: 10, R: 7, L: 3, C: 6, P: 2 };

    it('HP in arithmetic', () => {
      expect(evaluateExpression('HP + 2', vars)).toBe(12);
    });

    it('HP with multiplication', () => {
      expect(evaluateExpression('HP * 2', vars)).toBe(20);
    });

    it('HP in comparison', () => {
      expect(evaluateExpression('HP > 5', vars)).toBe(1);
    });

    it('H and R combined', () => {
      expect(evaluateExpression('H + R', vars)).toBe(11);
    });

    it('R modulo check', () => {
      expect(evaluateExpression('R % 3', vars)).toBe(1);
    });

    it('R > 3 && R % 3 === 1', () => {
      expect(evaluateExpression('R > 3 && R % 3 === 1', vars)).toBe(1);
    });

    it('L-based scaling: 2 * L + 1', () => {
      expect(evaluateExpression('2 * L + 1', vars)).toBe(7);
    });

    it('C with x multiplication: Cx2', () => {
      expect(evaluateExpression('Cx2', vars)).toBe(12);
    });

    it('ternary with HP', () => {
      expect(evaluateExpression('HP > 8 ? HP - 2 : HP + 2', vars)).toBe(8);
    });

    it('ternary with low HP', () => {
      expect(evaluateExpression('HP > 8 ? HP - 2 : HP + 2', { ...vars, HP: 5 })).toBe(7);
    });

    it('nested comparison with multiple vars', () => {
      expect(evaluateExpression('H >= 4 && R <= 7', vars)).toBe(1);
    });

    it('complex expression: (HP + H) * L - R', () => {
      expect(evaluateExpression('(HP + H) * L - R', vars)).toBe(35);
    });

    it('P as divisor', () => {
      expect(evaluateExpression('HP / P', vars)).toBe(5);
    });

    it('all vars in one expression', () => {
      expect(evaluateExpression('HP + H + R + L + C + P', vars)).toBe(32);
    });

    it('three-char ops with variables: HP >== H', () => {
      expect(evaluateExpression('HP >== H', vars)).toBe(1);
    });

    it('three-char ops with variables: H >== HP', () => {
      expect(evaluateExpression('H >== HP', vars)).toBe(0);
    });

    it('three-char ops: P <== L', () => {
      expect(evaluateExpression('P <== L', vars)).toBe(1);
    });

    it('three-char ops: H !== R', () => {
      expect(evaluateExpression('H !== R', vars)).toBe(1);
    });

    it('three-char ops: HP === HP', () => {
      expect(evaluateExpression('HP === 10', vars)).toBe(1);
    });

    it('logical chain: HP > 5 && H < 10 || R === 0', () => {
      expect(evaluateExpression('HP > 5 && H < 10 || R === 0', vars)).toBe(1);
    });

    it('ternary chain with vars', () => {
      expect(evaluateExpression('L > 5 ? HP : L > 2 ? H : R', vars)).toBe(4);
    });
  });

  // ---- Real-world expressions from game data ----
  describe('real data: health formulas', () => {
    it('(6+L)xC', () => {
      expect(evaluateExpression('(6+L)xC', { L: 3, C: 2 })).toBe(18);
    });

    it('3+C+2xL', () => {
      expect(evaluateExpression('3+C+2xL', { C: 4, L: 3 })).toBe(13);
    });

    it('8+CxL', () => {
      expect(evaluateExpression('8+CxL', { C: 2, L: 5 })).toBe(18);
    });

    it('5+(CxL)', () => {
      expect(evaluateExpression('5+(CxL)', { C: 3, L: 4 })).toBe(17);
    });

    it('8+Lx2', () => {
      expect(evaluateExpression('8+Lx2', { L: 3 })).toBe(14);
    });

    it('5x(Cx2)-1', () => {
      expect(evaluateExpression('5x(Cx2)-1', { C: 3 })).toBe(29);
    });

    it('10x(C+1)', () => {
      expect(evaluateExpression('10x(C+1)', { C: 2 })).toBe(30);
    });

    it('10x(C-1)', () => {
      expect(evaluateExpression('10x(C-1)', { C: 3 })).toBe(20);
    });

    it('9xC/2', () => {
      expect(evaluateExpression('9xC/2', { C: 4 })).toBe(18);
    });

    it('HxC', () => {
      expect(evaluateExpression('HxC', { H: 6, C: 3 })).toBe(18);
    });

    it('60+(5xC)', () => {
      expect(evaluateExpression('60+(5xC)', { C: 4 })).toBe(80);
    });

    it('6+(Lx3)', () => {
      expect(evaluateExpression('6+(Lx3)', { L: 2 })).toBe(12);
    });

    it('6+2xL', () => {
      expect(evaluateExpression('6+2xL', { L: 4 })).toBe(14);
    });

    it('4+(2xL)', () => {
      expect(evaluateExpression('4+(2xL)', { L: 3 })).toBe(10);
    });

    it('10+(2xL)', () => {
      expect(evaluateExpression('10+(2xL)', { L: 5 })).toBe(20);
    });

    it('L+1', () => {
      expect(evaluateExpression('L+1', { L: 7 })).toBe(8);
    });

    it('3xC', () => {
      expect(evaluateExpression('3xC', { C: 5 })).toBe(15);
    });

    it('10xC', () => {
      expect(evaluateExpression('10xC', { C: 3 })).toBe(30);
    });

    it('C+1', () => {
      expect(evaluateExpression('C+1', { C: 4 })).toBe(5);
    });

    it('1+C', () => {
      expect(evaluateExpression('1+C', { C: 4 })).toBe(5);
    });
  });

  describe('real data: inner math expressions (stripped of brackets/functions)', () => {
    it('Cx(3/2+Lx0.5)', () => {
      expect(evaluateExpression('Cx(3/2+Lx0.5)', { C: 3, L: 2 })).toBe(7.5);
    });

    it('0.35*L+1.65', () => {
      expect(evaluateExpression('0.35*L+1.65', { L: 5 })).toBe(3.4);
    });

    it('HP/5', () => {
      expect(evaluateExpression('HP/5', { HP: 20 })).toBe(4);
    });

    it('CxH/2', () => {
      expect(evaluateExpression('CxH/2', { C: 4, H: 6 })).toBe(12);
    });

    it('(HxC)/2', () => {
      expect(evaluateExpression('(HxC)/2', { H: 6, C: 4 })).toBe(12);
    });

    it('(2+L)xC/2', () => {
      expect(evaluateExpression('(2+L)xC/2', { L: 4, C: 6 })).toBe(18);
    });

    it('2+(LxC/2)', () => {
      expect(evaluateExpression('2+(LxC/2)', { L: 4, C: 6 })).toBe(14);
    });

    it('2+(L/4)', () => {
      expect(evaluateExpression('2+(L/4)', { L: 8 })).toBe(4);
    });

    it('1+(L+1)/4', () => {
      expect(evaluateExpression('1+(L+1)/4', { L: 7 })).toBe(3);
    });

    it('C+(L/2)', () => {
      expect(evaluateExpression('C+(L/2)', { C: 3, L: 4 })).toBe(5);
    });

    it('C+L/2', () => {
      expect(evaluateExpression('C+L/2', { C: 3, L: 4 })).toBe(5);
    });

    it('Hx3/4', () => {
      expect(evaluateExpression('Hx3/4', { H: 8 })).toBe(6);
    });

    it('Hx2/3', () => {
      expect(evaluateExpression('Hx2/3', { H: 9 })).toBe(6);
    });

    it('H/3', () => {
      expect(evaluateExpression('H/3', { H: 12 })).toBe(4);
    });

    it('(L/3)+2', () => {
      expect(evaluateExpression('(L/3)+2', { L: 6 })).toBe(4);
    });

    it('(L/4)+1', () => {
      expect(evaluateExpression('(L/4)+1', { L: 8 })).toBe(3);
    });

    it('L/2+2', () => {
      expect(evaluateExpression('L/2+2', { L: 6 })).toBe(5);
    });

    it('(1+L)/6', () => {
      expect(evaluateExpression('(1+L)/6', { L: 5 })).toBe(1);
    });

    it('H/2', () => {
      expect(evaluateExpression('H/2', { H: 10 })).toBe(5);
    });

    it('HP/2', () => {
      expect(evaluateExpression('HP/2', { HP: 14 })).toBe(7);
    });

    it('(L/2)', () => {
      expect(evaluateExpression('(L/2)', { L: 6 })).toBe(3);
    });

    it('(L+1)/4', () => {
      expect(evaluateExpression('(L+1)/4', { L: 7 })).toBe(2);
    });

    it('HP/4', () => {
      expect(evaluateExpression('HP/4', { HP: 20 })).toBe(5);
    });

    it('H/4', () => {
      expect(evaluateExpression('H/4', { H: 16 })).toBe(4);
    });
  });

  describe('real data: ternary conditions', () => {
    it('C < 3 ? 0 : 3 (C=2)', () => {
      expect(evaluateExpression('C < 3 ? 0 : 3', { C: 2 })).toBe(0);
    });

    it('C < 3 ? 0 : 3 (C=4)', () => {
      expect(evaluateExpression('C < 3 ? 0 : 3', { C: 4 })).toBe(3);
    });

    it('C < 4 ? 0 : 3 (C=3)', () => {
      expect(evaluateExpression('C < 4 ? 0 : 3', { C: 3 })).toBe(0);
    });

    it('C < 4 ? 0 : 3 (C=4)', () => {
      expect(evaluateExpression('C < 4 ? 0 : 3', { C: 4 })).toBe(3);
    });

    it('C < 3 ? 1 : 0 (C=2)', () => {
      expect(evaluateExpression('C < 3 ? 1 : 0', { C: 2 })).toBe(1);
    });

    it('C>3?1:0 (no spaces, C=4)', () => {
      expect(evaluateExpression('C>3?1:0', { C: 4 })).toBe(1);
    });

    it('C>3?1:0 (no spaces, C=2)', () => {
      expect(evaluateExpression('C>3?1:0', { C: 2 })).toBe(0);
    });

    it('C>2?1:0 (C=3)', () => {
      expect(evaluateExpression('C>2?1:0', { C: 3 })).toBe(1);
    });
  });

  describe('real data: round conditions (logical + comparison + modulo)', () => {
    it('R % 2 == 0 || C > 2 (R=4, C=1)', () => {
      expect(evaluateExpression('R % 2 == 0 || C > 2', { R: 4, C: 1 })).toBe(1);
    });

    it('R % 2 == 0 || C > 2 (R=3, C=1)', () => {
      expect(evaluateExpression('R % 2 == 0 || C > 2', { R: 3, C: 1 })).toBe(0);
    });

    it('R % 2 == 0 || C > 2 (R=3, C=3)', () => {
      expect(evaluateExpression('R % 2 == 0 || C > 2', { R: 3, C: 3 })).toBe(1);
    });

    it('R > 1 && R % 6 != 1 (R=3)', () => {
      expect(evaluateExpression('R > 1 && R % 6 != 1', { R: 3 })).toBe(1);
    });

    it('R > 1 && R % 6 != 1 (R=1)', () => {
      expect(evaluateExpression('R > 1 && R % 6 != 1', { R: 1 })).toBe(0);
    });

    it('R > 1 && R % 6 != 1 (R=7)', () => {
      expect(evaluateExpression('R > 1 && R % 6 != 1', { R: 7 })).toBe(0);
    });

    it('R > 1 && R % 4 != 1 (R=5)', () => {
      expect(evaluateExpression('R > 1 && R % 4 != 1', { R: 5 })).toBe(0);
    });

    it('R > 1 && R % 6 == 1 (R=7)', () => {
      expect(evaluateExpression('R > 1 && R % 6 == 1', { R: 7 })).toBe(1);
    });

    it('R > 5 && R % 4 == 2 (R=6)', () => {
      expect(evaluateExpression('R > 5 && R % 4 == 2', { R: 6 })).toBe(1);
    });

    it('R > 5 && R % 4 == 2 (R=4)', () => {
      expect(evaluateExpression('R > 5 && R % 4 == 2', { R: 4 })).toBe(0);
    });

    it('R > 1 && R % 2 == 0 (R=4)', () => {
      expect(evaluateExpression('R > 1 && R % 2 == 0', { R: 4 })).toBe(1);
    });

    it('R > 2 && R % 3 == 0 (R=6)', () => {
      expect(evaluateExpression('R > 2 && R % 3 == 0', { R: 6 })).toBe(1);
    });

    it('R > 1 && R % 4 == 1 (R=5)', () => {
      expect(evaluateExpression('R > 1 && R % 4 == 1', { R: 5 })).toBe(1);
    });

    it('R == 2 || R == 5 || R == 8 (R=5)', () => {
      expect(evaluateExpression('R == 2 || R == 5 || R == 8', { R: 5 })).toBe(1);
    });

    it('R == 2 || R == 5 || R == 8 (R=3)', () => {
      expect(evaluateExpression('R == 2 || R == 5 || R == 8', { R: 3 })).toBe(0);
    });

    it('R == 4 || R == 19 (R=19)', () => {
      expect(evaluateExpression('R == 4 || R == 19', { R: 19 })).toBe(1);
    });

    it('R % 3 == 0 || R % 3 == 2 (R=5)', () => {
      expect(evaluateExpression('R % 3 == 0 || R % 3 == 2', { R: 5 })).toBe(1);
    });

    it('R % 3 == 0 || R % 3 == 2 (R=4)', () => {
      expect(evaluateExpression('R % 3 == 0 || R % 3 == 2', { R: 4 })).toBe(0);
    });

    it('R % 4 == 2 (R=6)', () => {
      expect(evaluateExpression('R % 4 == 2', { R: 6 })).toBe(1);
    });
  });

  describe('real data: HP conditions', () => {
    it('HP > 0 (HP=5)', () => {
      expect(evaluateExpression('HP > 0', { HP: 5 })).toBe(1);
    });

    it('HP > 0 (HP=0)', () => {
      expect(evaluateExpression('HP > 0', { HP: 0 })).toBe(0);
    });

    it('HP > 1 (HP=1)', () => {
      expect(evaluateExpression('HP > 1', { HP: 1 })).toBe(0);
    });

    it('HP == 0 (HP=0)', () => {
      expect(evaluateExpression('HP == 0', { HP: 0 })).toBe(1);
    });

    it('HP < H (HP=3, H=5)', () => {
      expect(evaluateExpression('HP < H', { HP: 3, H: 5 })).toBe(1);
    });

    it('HP < H (HP=5, H=5)', () => {
      expect(evaluateExpression('HP < H', { HP: 5, H: 5 })).toBe(0);
    });

    it('HP == H (HP=5, H=5)', () => {
      expect(evaluateExpression('HP == H', { HP: 5, H: 5 })).toBe(1);
    });
  });
});
