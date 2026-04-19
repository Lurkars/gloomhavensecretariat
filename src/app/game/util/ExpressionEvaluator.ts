/**
 * A lightweight expression evaluator because using eval() is not
 * safe and and other libraries are outdated or overpowed
 *
 * supports:
 * - Arithmetic: +, -, * (also as x), /, % and unary +/-
 * - Comparison: ==, !=, >, <, >=, <=
 * - Logical:    && and ||
 * - Ternary:    condition ? valueIfTrue : valueIfFalse
 * - Grouping:   parentheses
 * - Literals:   numbers, true, false
 * - Variables:  named values passed as a record
 *
 * Operator precedence (low → high):
 *   ternary → or → and → comparison → add/sub → mul/div/mod → unary → primary
 *
 * Usage:
 *   evaluateExpression("R > 3 && R % 3 === 1", { R: 7 })  → 1 (truthy)
 *   evaluateExpression("2 * L + 1", { L: 3 })             → 7
 */

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

enum TokenType {
  Number,
  Identifier,
  Operator,
  LeftParen,
  RightParen,
  QuestionMark,
  Colon,
  End
}

interface Token {
  type: TokenType;
  value: string;
}

const TWO_CHAR_OPS = new Set(['==', '!=', '>=', '<=', '&&', '||']);
const SINGLE_CHAR_OPS = new Set(['+', '-', '*', '/', '%', '>', '<']);

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expression.length) {
    const ch = expression[i];

    // whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }

    // number literal (integer or decimal)
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      const start = i;
      while (i < expression.length && ((expression[i] >= '0' && expression[i] <= '9') || expression[i] === '.')) {
        i++;
      }
      tokens.push({ type: TokenType.Number, value: expression.slice(start, i) });
      continue;
    }

    // 'x' as multiplication shorthand (e.g. "2x3" means "2*3", "Cx2" means "C*2")
    if (
      ch === 'x' &&
      (i + 1 >= expression.length ||
        !(
          (expression[i + 1] >= 'a' && expression[i + 1] <= 'z') ||
          (expression[i + 1] >= 'A' && expression[i + 1] <= 'Z') ||
          expression[i + 1] === '_'
        ))
    ) {
      tokens.push({ type: TokenType.Operator, value: '*' });
      i++;
      continue;
    }

    // identifier (variable name or keyword)
    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
      const start = i;
      while (
        i < expression.length &&
        ((expression[i] >= 'a' && expression[i] <= 'z') ||
          (expression[i] >= 'A' && expression[i] <= 'Z') ||
          (expression[i] >= '0' && expression[i] <= '9') ||
          expression[i] === '_')
      ) {
        // break before 'x' followed by a digit so it gets parsed as multiplication (e.g. "Cx2" → C * 2)
        if (expression[i] === 'x' && i > start && i + 1 < expression.length && expression[i + 1] >= '0' && expression[i + 1] <= '9') {
          break;
        }
        i++;
      }
      tokens.push({ type: TokenType.Identifier, value: expression.slice(start, i) });
      continue;
    }

    // two-character operators
    if (i + 1 < expression.length && TWO_CHAR_OPS.has(expression.slice(i, i + 2))) {
      tokens.push({ type: TokenType.Operator, value: expression.slice(i, i + 2) });
      i += 2;
      continue;
    }

    // single-character operators
    if (SINGLE_CHAR_OPS.has(ch)) {
      tokens.push({ type: TokenType.Operator, value: ch });
      i++;
      continue;
    }

    // parentheses and ternary punctuation
    if (ch === '(') {
      tokens.push({ type: TokenType.LeftParen, value: ch });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: TokenType.RightParen, value: ch });
      i++;
      continue;
    }
    if (ch === '?') {
      tokens.push({ type: TokenType.QuestionMark, value: ch });
      i++;
      continue;
    }
    if (ch === ':') {
      tokens.push({ type: TokenType.Colon, value: ch });
      i++;
      continue;
    }

    throw new Error(`Unexpected character '${ch}' at position ${i} in: ${expression}`);
  }

  tokens.push({ type: TokenType.End, value: '' });
  return tokens;
}

// ---------------------------------------------------------------------------
// Recursive-descent parser + evaluator
// ---------------------------------------------------------------------------

class ExpressionParser {
  private tokens: Token[];
  private pos: number;
  private variables: Record<string, number>;

  constructor(tokens: Token[], variables: Record<string, number>) {
    this.tokens = tokens;
    this.pos = 0;
    this.variables = variables;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: TokenType): Token {
    const token = this.consume();
    if (token.type !== type) {
      throw new Error(`Expected ${TokenType[type]} but got ${TokenType[token.type]} ('${token.value}')`);
    }
    return token;
  }

  // entry point
  parse(): number {
    const result = this.parseTernary();
    if (this.peek().type !== TokenType.End) {
      throw new Error(`Unexpected token '${this.peek().value}' after end of expression`);
    }
    return result;
  }

  // ternary: or ('?' ternary ':' ternary)?
  private parseTernary(): number {
    const condition = this.parseOr();
    if (this.peek().type === TokenType.QuestionMark) {
      this.consume(); // '?'
      const ifTrue = this.parseTernary();
      this.expect(TokenType.Colon);
      const ifFalse = this.parseTernary();
      return condition ? ifTrue : ifFalse;
    }
    return condition;
  }

  // or: and ('||' and)*
  private parseOr(): number {
    let left = this.parseAnd();
    while (this.peek().type === TokenType.Operator && this.peek().value === '||') {
      this.consume();
      const right = this.parseAnd();
      left = left || right ? 1 : 0;
    }
    return left;
  }

  // and: comparison ('&&' comparison)*
  private parseAnd(): number {
    let left = this.parseComparison();
    while (this.peek().type === TokenType.Operator && this.peek().value === '&&') {
      this.consume();
      const right = this.parseComparison();
      left = left && right ? 1 : 0;
    }
    return left;
  }

  // comparison: addition (('==' | '!=' | '>' | '<' | '>=' | '<=') addition)?
  private parseComparison(): number {
    const left = this.parseAddition();
    const op = this.peek();
    if (op.type === TokenType.Operator) {
      switch (op.value) {
        case '==':
          this.consume();
          return left === this.parseAddition() ? 1 : 0;
        case '!=':
          this.consume();
          return left !== this.parseAddition() ? 1 : 0;
        case '>':
          this.consume();
          return left > this.parseAddition() ? 1 : 0;
        case '<':
          this.consume();
          return left < this.parseAddition() ? 1 : 0;
        case '>=':
          this.consume();
          return left >= this.parseAddition() ? 1 : 0;
        case '<=':
          this.consume();
          return left <= this.parseAddition() ? 1 : 0;
      }
    }
    return left;
  }

  // addition: multiplication (('+' | '-') multiplication)*
  private parseAddition(): number {
    let left = this.parseMultiplication();
    while (this.peek().type === TokenType.Operator && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.consume().value;
      const right = this.parseMultiplication();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  // multiplication: unary (('*' | '/' | '%') unary)*
  private parseMultiplication(): number {
    let left = this.parseUnary();
    while (
      this.peek().type === TokenType.Operator &&
      (this.peek().value === '*' || this.peek().value === '/' || this.peek().value === '%')
    ) {
      const op = this.consume().value;
      const right = this.parseUnary();
      if (op === '*') left = left * right;
      else if (op === '/') left = left / right;
      else left = left % right;
    }
    return left;
  }

  // unary: ('-' | '+') unary | primary
  private parseUnary(): number {
    if (this.peek().type === TokenType.Operator && this.peek().value === '-') {
      this.consume();
      return -this.parseUnary();
    }
    if (this.peek().type === TokenType.Operator && this.peek().value === '+') {
      this.consume();
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  // primary: number | identifier | '(' expression ')'
  private parsePrimary(): number {
    const token = this.peek();

    if (token.type === TokenType.Number) {
      this.consume();
      return parseFloat(token.value);
    }

    if (token.type === TokenType.Identifier) {
      this.consume();
      if (token.value === 'true') return 1;
      if (token.value === 'false') return 0;
      if (token.value in this.variables) return this.variables[token.value];
      throw new Error(`Unknown variable '${token.value}'`);
    }

    if (token.type === TokenType.LeftParen) {
      this.consume();
      const result = this.parseTernary();
      this.expect(TokenType.RightParen);
      return result;
    }

    throw new Error(`Unexpected token '${token.value}' (${TokenType[token.type]})`);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function evaluateExpression(expression: string, variables: Record<string, number> = {}): number {
  const tokens = tokenize(expression);
  return new ExpressionParser(tokens, variables).parse();
}
