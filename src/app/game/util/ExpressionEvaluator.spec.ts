import { evaluateExpression, UnknownVariableError } from 'src/app/game/util/ExpressionEvaluator';

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
      expect(() => evaluateExpression('Z')).toThrow(UnknownVariableError);
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

  // ---- Math functions ----
  describe('Math functions', () => {
    describe('Math.floor', () => {
      it('Math.floor(3.9)', () => {
        expect(evaluateExpression('Math.floor(3.9)')).toBe(3);
      });

      it('Math.floor(3.0)', () => {
        expect(evaluateExpression('Math.floor(3.0)')).toBe(3);
      });

      it('Math.floor(-1.2)', () => {
        expect(evaluateExpression('Math.floor(-1.2)')).toBe(-2);
      });

      it('Math.floor(7/2)', () => {
        expect(evaluateExpression('Math.floor(7/2)')).toBe(3);
      });

      it('Math.floor((L+1)/2) with L=3', () => {
        expect(evaluateExpression('Math.floor((L+1)/2)', { L: 3 })).toBe(2);
      });

      it('Math.floor((L+1)/7) with L=3', () => {
        expect(evaluateExpression('Math.floor((L+1)/7)', { L: 3 })).toBe(0);
      });
    });

    describe('Math.ceil', () => {
      it('Math.ceil(3.1)', () => {
        expect(evaluateExpression('Math.ceil(3.1)')).toBe(4);
      });

      it('Math.ceil(3.0)', () => {
        expect(evaluateExpression('Math.ceil(3.0)')).toBe(3);
      });

      it('Math.ceil(-1.8)', () => {
        expect(evaluateExpression('Math.ceil(-1.8)')).toBe(-1);
      });

      it('Math.ceil(7/2)', () => {
        expect(evaluateExpression('Math.ceil(7/2)')).toBe(4);
      });
    });

    describe('Math.round', () => {
      it('Math.round(3.5)', () => {
        expect(evaluateExpression('Math.round(3.5)')).toBe(4);
      });

      it('Math.round(3.4)', () => {
        expect(evaluateExpression('Math.round(3.4)')).toBe(3);
      });
    });

    describe('Math.abs', () => {
      it('Math.abs(-5)', () => {
        expect(evaluateExpression('Math.abs(-5)')).toBe(5);
      });

      it('Math.abs(5)', () => {
        expect(evaluateExpression('Math.abs(5)')).toBe(5);
      });
    });

    describe('Math.min / Math.max', () => {
      it('Math.min(3, 7)', () => {
        expect(evaluateExpression('Math.min(3, 7)')).toBe(3);
      });

      it('Math.min(L, 5) with L=2', () => {
        expect(evaluateExpression('Math.min(L, 5)', { L: 2 })).toBe(2);
      });

      it('Math.min(L, 5) with L=8', () => {
        expect(evaluateExpression('Math.min(L, 5)', { L: 8 })).toBe(5);
      });

      it('Math.max(3, 7)', () => {
        expect(evaluateExpression('Math.max(3, 7)')).toBe(7);
      });

      it('Math.max(L, 1) with L=0', () => {
        expect(evaluateExpression('Math.max(L, 1)', { L: 0 })).toBe(1);
      });
    });

    describe('Math.pow', () => {
      it('Math.pow(2, 3)', () => {
        expect(evaluateExpression('Math.pow(2, 3)')).toBe(8);
      });

      it('Math.pow(L, 2) with L=4', () => {
        expect(evaluateExpression('Math.pow(L, 2)', { L: 4 })).toBe(16);
      });
    });

    describe('Math.sqrt', () => {
      it('Math.sqrt(9)', () => {
        expect(evaluateExpression('Math.sqrt(9)')).toBe(3);
      });
    });

    describe('Math.maxFloor', () => {
      // Math.maxFloor(X, N) = Math.max(Math.floor(X), N) — floor then ensure minimum
      it('Math.maxFloor(7.9, 5) → max(floor(7.9), 5) = max(7, 5) = 7', () => {
        expect(evaluateExpression('Math.maxFloor(7.9, 5)')).toBe(7);
      });

      it('Math.maxFloor(3.9, 5) → max(floor(3.9), 5) = max(3, 5) = 5', () => {
        expect(evaluateExpression('Math.maxFloor(3.9, 5)')).toBe(5);
      });

      it('Math.maxFloor(L/2, 2) with L=3 → max(floor(1.5), 2) = max(1, 2) = 2', () => {
        expect(evaluateExpression('Math.maxFloor(L/2, 2)', { L: 3 })).toBe(2);
      });

      it('Math.maxFloor(L/2, 2) with L=7 → max(floor(3.5), 2) = max(3, 2) = 3', () => {
        expect(evaluateExpression('Math.maxFloor(L/2, 2)', { L: 7 })).toBe(3);
      });
    });

    describe('Math.maxCeil', () => {
      // Math.maxCeil(X, N) = Math.max(Math.ceil(X), N) — ceil then ensure minimum
      it('Math.maxCeil(3.1, 5) → max(ceil(3.1), 5) = max(4, 5) = 5', () => {
        expect(evaluateExpression('Math.maxCeil(3.1, 5)')).toBe(5);
      });

      it('Math.maxCeil(7.1, 5) → max(ceil(7.1), 5) = max(8, 5) = 8', () => {
        expect(evaluateExpression('Math.maxCeil(7.1, 5)')).toBe(8);
      });

      it('Math.maxCeil(L/2, 2) with L=3 → max(ceil(1.5), 2) = max(2, 2) = 2', () => {
        expect(evaluateExpression('Math.maxCeil(L/2, 2)', { L: 3 })).toBe(2);
      });

      it('Math.maxCeil(L/2, 2) with L=7 → max(ceil(3.5), 2) = max(4, 2) = 4', () => {
        expect(evaluateExpression('Math.maxCeil(L/2, 2)', { L: 7 })).toBe(4);
      });
    });

    describe('Math.minFloor', () => {
      // Math.minFloor(X, N) = Math.min(Math.floor(X), N) — floor then cap
      it('Math.minFloor(7.9, 5) → min(floor(7.9), 5) = min(7, 5) = 5', () => {
        expect(evaluateExpression('Math.minFloor(7.9, 5)')).toBe(5);
      });

      it('Math.minFloor(3.9, 5) → min(floor(3.9), 5) = min(3, 5) = 3', () => {
        expect(evaluateExpression('Math.minFloor(3.9, 5)')).toBe(3);
      });

      it('Math.minFloor(L/2, 3) with L=9 → min(floor(4.5), 3) = min(4, 3) = 3', () => {
        expect(evaluateExpression('Math.minFloor(L/2, 3)', { L: 9 })).toBe(3);
      });

      it('Math.minFloor(L/2, 3) with L=5 → min(floor(2.5), 3) = min(2, 3) = 2', () => {
        expect(evaluateExpression('Math.minFloor(L/2, 3)', { L: 5 })).toBe(2);
      });
    });

    describe('Math.minCeil', () => {
      // Math.minCeil(X, N) = Math.min(Math.ceil(X), N) — ceil then cap
      it('Math.minCeil(7.1, 5) → min(ceil(7.1), 5) = min(8, 5) = 5', () => {
        expect(evaluateExpression('Math.minCeil(7.1, 5)')).toBe(5);
      });

      it('Math.minCeil(3.1, 5) → min(ceil(3.1), 5) = min(4, 5) = 4', () => {
        expect(evaluateExpression('Math.minCeil(3.1, 5)')).toBe(4);
      });

      it('Math.minCeil(L/2, 3) with L=5 → min(ceil(2.5), 3) = min(3, 3) = 3', () => {
        expect(evaluateExpression('Math.minCeil(L/2, 3)', { L: 5 })).toBe(3);
      });

      it('Math.minCeil(L/2, 3) with L=9 → min(ceil(4.5), 3) = min(5, 3) = 3', () => {
        expect(evaluateExpression('Math.minCeil(L/2, 3)', { L: 9 })).toBe(3);
      });
    });

    describe('nested and combined', () => {
      it('Math.floor inside expression: 1 + Math.floor(7/2)', () => {
        expect(evaluateExpression('1 + Math.floor(7/2)')).toBe(4);
      });

      it('nested: Math.floor(Math.ceil(3.2))', () => {
        expect(evaluateExpression('Math.floor(Math.ceil(3.2))')).toBe(4);
      });

      it('unknown function throws', () => {
        expect(() => evaluateExpression('Math.log(2)')).toThrow();
      });
    });

    // ---- Real use case ----
    describe('real use case: 2 + Math.floor((L+1)/2) + Math.floor((L+1)/7)', () => {
      const expr = '2 + Math.floor((L+1)/2) + Math.floor((L+1)/7)';

      // L=0: 2 + floor(1/2) + floor(1/7) = 2 + 0 + 0 = 2
      it('L=0 → 2', () => {
        expect(evaluateExpression(expr, { L: 0 })).toBe(2);
      });

      // L=1: 2 + floor(2/2) + floor(2/7) = 2 + 1 + 0 = 3
      it('L=1 → 3', () => {
        expect(evaluateExpression(expr, { L: 1 })).toBe(3);
      });

      // L=2: 2 + floor(3/2) + floor(3/7) = 2 + 1 + 0 = 3
      it('L=2 → 3', () => {
        expect(evaluateExpression(expr, { L: 2 })).toBe(3);
      });

      // L=3: 2 + floor(4/2) + floor(4/7) = 2 + 2 + 0 = 4
      it('L=3 → 4', () => {
        expect(evaluateExpression(expr, { L: 3 })).toBe(4);
      });

      // L=4: 2 + floor(5/2) + floor(5/7) = 2 + 2 + 0 = 4
      it('L=4 → 4', () => {
        expect(evaluateExpression(expr, { L: 4 })).toBe(4);
      });

      // L=5: 2 + floor(6/2) + floor(6/7) = 2 + 3 + 0 = 5
      it('L=5 → 5', () => {
        expect(evaluateExpression(expr, { L: 5 })).toBe(5);
      });

      // L=6: 2 + floor(7/2) + floor(7/7) = 2 + 3 + 1 = 6
      it('L=6 → 6', () => {
        expect(evaluateExpression(expr, { L: 6 })).toBe(6);
      });

      // L=7: 2 + floor(8/2) + floor(8/7) = 2 + 4 + 1 = 7
      it('L=7 → 7', () => {
        expect(evaluateExpression(expr, { L: 7 })).toBe(7);
      });
    });

    describe('real use case: Math.min(2 + Math.floor((L+1)/2) + Math.floor((L+1)/7),6)', () => {
      const expr = 'Math.min(2 + Math.floor((L+1)/2) + Math.floor((L+1)/7),6)';

      // L=0: min(2 + floor(1/2) + floor(1/7),6) = 2 + 0 + 0 = 2
      it('L=0 → 2', () => {
        expect(evaluateExpression(expr, { L: 0 })).toBe(2);
      });

      // L=1: min(2 + floor(2/2) + floor(2/7),6) = 2 + 1 + 0 = 3
      it('L=1 → 3', () => {
        expect(evaluateExpression(expr, { L: 1 })).toBe(3);
      });

      // L=2: min(2 + floor(3/2) + floor(3/7),6) = 2 + 1 + 0 = 3
      it('L=2 → 3', () => {
        expect(evaluateExpression(expr, { L: 2 })).toBe(3);
      });

      // L=3: min(2 + floor(4/2) + floor(4/7),6) = 2 + 2 + 0 = 4
      it('L=3 → 4', () => {
        expect(evaluateExpression(expr, { L: 3 })).toBe(4);
      });

      // L=4: min(2 + floor(5/2) + floor(5/7),6) = 2 + 2 + 0 = 4
      it('L=4 → 4', () => {
        expect(evaluateExpression(expr, { L: 4 })).toBe(4);
      });

      // L=5: min(2 + floor(6/2) + floor(6/7),6) = 2 + 3 + 0 = 5
      it('L=5 → 5', () => {
        expect(evaluateExpression(expr, { L: 5 })).toBe(5);
      });

      // L=6: min(2 + floor(7/2) + floor(7/7),6) = 2 + 3 + 1 = 6
      it('L=6 → 6', () => {
        expect(evaluateExpression(expr, { L: 6 })).toBe(6);
      });

      // L=7: min(2 + floor(8/2) + floor(8/7),6) = 6
      it('L=7 → 6', () => {
        expect(evaluateExpression(expr, { L: 7 })).toBe(6);
      });
    });
  });
});
