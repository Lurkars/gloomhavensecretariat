import {
  deckFind,
  deckMove,
  deckMoveCard,
  deckTargetValid,
  figureIdentifier,
  findCharacter,
  findEntities,
  findEntity,
  findFigure,
  findMonster,
  findObjectiveContainer,
  isFigureLevel,
  validSeed
} from 'src/app/game/commands/CommandHelper';
import {
  createTestCharacter,
  createTestMonster,
  createTestMonsterEntity,
  createTestObjective,
  createTestSummon,
  resetTestGame
} from 'src/app/game/commands/commandsTestHelpers';
import { MonsterType } from 'src/app/game/model/data/MonsterType';

describe('CommandHelper', () => {
  beforeEach(() => {
    resetTestGame();
  });

  describe('figures', () => {
    it('builds the figure identifier like the game model', () => {
      const character = createTestCharacter(1);
      const monster = createTestMonster();
      const objective = createTestObjective();
      expect(figureIdentifier(character)).toBe('test-testchar1');
      expect(figureIdentifier(monster)).toBe('test-testmonster');
      expect(figureIdentifier(objective)).toBe('objective-' + objective.uuid);
    });

    it('finds characters by number and figures by identifier', () => {
      const character = createTestCharacter(2);
      const monster = createTestMonster();
      const objective = createTestObjective(true);
      expect(findCharacter(2)).toBe(character);
      expect(findFigure(2)).toBe(character);
      expect(findFigure('test-testchar2')).toBe(character);
      expect(findFigure('test-testmonster')).toBe(monster);
      expect(findMonster('test-testmonster')).toBe(monster);
      expect(findMonster('test-testchar2')).toBeUndefined();
      expect(findObjectiveContainer('escort-' + objective.uuid)).toBe(objective);
      expect(findFigure('unknown')).toBeUndefined();
      expect(findFigure('')).toBeUndefined();
      expect(findFigure(true)).toBeUndefined();
    });
  });

  describe('entities', () => {
    it('treats empty or missing entity ids as figure level', () => {
      expect(isFigureLevel(undefined)).toBe(true);
      expect(isFigureLevel('')).toBe(true);
      expect(isFigureLevel(false)).toBe(true);
      expect(isFigureLevel(0)).toBe(false);
      expect(isFigureLevel('uuid')).toBe(false);
    });

    it('resolves the character itself and summons by uuid', () => {
      const character = createTestCharacter(1);
      const summon = createTestSummon(character);
      expect(findEntity(character, '')).toBe(character);
      expect(findEntity(character, summon.uuid)).toBe(summon);
      expect(findEntity(character, 'unknown')).toBeUndefined();
    });

    it('resolves monster standees by number and all living standees on figure level', () => {
      const monster = createTestMonster();
      const first = createTestMonsterEntity(monster, 1);
      const second = createTestMonsterEntity(monster, 2, MonsterType.elite);
      expect(findEntity(monster, 2)).toBe(second);
      expect(findEntity(monster, '')).toBeUndefined();
      expect(findEntities(monster, '')).toEqual([first, second]);
      first.dead = true;
      expect(findEntities(monster, '')).toEqual([second]);
    });

    it('resolves objective entities by number or uuid', () => {
      const objective = createTestObjective(false, 2);
      const entity = objective.entities[1];
      expect(findEntity(objective, entity.number)).toBe(entity);
      expect(findEntity(objective, entity.uuid)).toBe(entity);
      expect(findEntities(objective, '').length).toBe(2);
    });
  });

  describe('deck moves', () => {
    it('finds cards by list', () => {
      const cards = ['a', 'b', 'a', 'c', 'a'];
      expect(deckFind(cards, 2, 'discarded', (card) => card === 'a')).toBe(2);
      expect(deckFind(cards, 2, 'upcoming', (card) => card === 'a')).toBe(4);
      expect(deckFind(cards, 2, 'upcoming', (card) => card === 'b')).toBe(-1);
      expect(deckFind(cards, -1, 'discarded', (card) => card === 'a')).toBe(-1);
      expect(deckFind(cards, 2, 'unknown', (card) => card === 'a')).toBe(-1);
    });

    it('validates move targets', () => {
      expect(deckTargetValid('upcoming', 0)).toBe(true);
      expect(deckTargetValid('discarded', 3)).toBe(true);
      expect(deckTargetValid('unknown', 0)).toBe(false);
      expect(deckTargetValid('upcoming', -1)).toBe(false);
      expect(deckTargetValid('upcoming', '0')).toBe(false);
    });

    it('moves a card by raw index', () => {
      const cards = ['a', 'b', 'c', 'd', 'e'];
      expect(deckMoveCard(1, 3, 'discarded', 0, cards).current).toBe(2);
      expect(cards).toEqual(['a', 'b', 'd', 'c', 'e']);
      expect(deckMoveCard(2, 0, 'upcoming', 0, cards).current).toBe(1);
      expect(cards).toEqual(['b', 'd', 'a', 'c', 'e']);
    });

    it('moves within the upcoming cards', () => {
      const cards = ['a', 'b', 'c', 'd', 'e'];
      const result = deckMove(1, 'upcoming', 0, 'upcoming', 2, cards);
      expect(cards).toEqual(['a', 'b', 'd', 'e', 'c']);
      expect(result.current).toBe(1);
    });

    it('moves an upcoming card to the discard pile', () => {
      const cards = ['a', 'b', 'c', 'd', 'e'];
      const result = deckMove(1, 'upcoming', 1, 'discarded', 0, cards);
      expect(cards).toEqual(['a', 'b', 'd', 'c', 'e']);
      expect(result.current).toBe(2);
    });

    it('moves a discarded card back to the upcoming cards', () => {
      const cards = ['a', 'b', 'c', 'd', 'e'];
      const result = deckMove(1, 'discarded', 1, 'upcoming', 0, cards);
      expect(cards).toEqual(['b', 'a', 'c', 'd', 'e']);
      expect(result.current).toBe(0);
    });

    it('moves parallel arrays the same way', () => {
      const cards = ['a', 'b', 'c'];
      const revealed = [true, false, false];
      deckMove(-1, 'upcoming', 0, 'upcoming', 2, cards, revealed);
      expect(cards).toEqual(['b', 'c', 'a']);
      expect(revealed).toEqual([false, false, true]);
    });
  });

  describe('seeds', () => {
    it('validates integer seeds', () => {
      expect(validSeed(-5)).toBe(true);
      expect(validSeed(undefined)).toBe(false);
      expect(validSeed(1.5)).toBe(false);
      expect(validSeed('1')).toBe(false);
    });
  });
});
