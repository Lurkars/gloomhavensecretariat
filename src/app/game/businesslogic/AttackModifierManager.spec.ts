import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import {
  AttackModifier,
  AttackModifierDeck,
  AttackModifierType,
  AttackModifierValueType,
  defaultAttackModifier
} from 'src/app/game/model/data/AttackModifier';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { Perk, PerkCard, PerkType } from 'src/app/game/model/data/Perks';

// This spec covers the small, clearly-scoped pure/near-pure helpers, plus calculateAttackResult/
// buildCharacterAttackModifierDeck/applyCharacterPerks below. Note: applyCharacterPerks's fh
// trial-348 branch reassigns its local `attackModifierDeck` parameter to a brand-new deck and
// filters *that*, never writing back into the deck object the caller (and buildCharacterAttack-
// ModifierDeck) actually holds a reference to — its filtering has no observable effect on the
// returned deck. That looks like a pre-existing bug rather than intended behavior, so it is
// deliberately not asserted on here.

function buildCharacter(name: string = 'test-char', overrides: Partial<CharacterData> = {}): Character {
  const data = Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)], ...overrides });
  return new Character(data, 1);
}

describe('AttackModifierManager', () => {
  const attackModifierManager = gameManager.attackModifierManager;

  describe('applyAttackModifier', () => {
    it('adds for plus, subtracts for minus, multiplies for multiply', () => {
      expect(
        attackModifierManager.applyAttackModifier(2, new AttackModifier(AttackModifierType.plus1, 1, AttackModifierValueType.plus))
      ).toEqual(3);
      expect(
        attackModifierManager.applyAttackModifier(2, new AttackModifier(AttackModifierType.minus1, 1, AttackModifierValueType.minus))
      ).toEqual(1);
      expect(
        attackModifierManager.applyAttackModifier(2, new AttackModifier(AttackModifierType.double, 2, AttackModifierValueType.multiply))
      ).toEqual(4);
    });

    it('passes the value through unchanged for the default type', () => {
      expect(
        attackModifierManager.applyAttackModifier(2, new AttackModifier(AttackModifierType.plus0, 0, AttackModifierValueType.default))
      ).toEqual(2);
    });
  });

  describe('stringifyAttackModifierValue', () => {
    it('renders +/-/x prefixes for plus/minus/multiply', () => {
      expect(
        attackModifierManager.stringifyAttackModifierValue(new AttackModifier(AttackModifierType.plus1, 1, AttackModifierValueType.plus))
      ).toEqual('+1');
      expect(
        attackModifierManager.stringifyAttackModifierValue(new AttackModifier(AttackModifierType.minus1, 1, AttackModifierValueType.minus))
      ).toEqual('-1');
      expect(
        attackModifierManager.stringifyAttackModifierValue(
          new AttackModifier(AttackModifierType.double, 2, AttackModifierValueType.multiply)
        )
      ).toEqual('x2');
    });
  });

  describe('addModifier', () => {
    it('inserts the card at the given index without shuffling', () => {
      const deck = new AttackModifierDeck([
        new AttackModifier(AttackModifierType.plus1),
        new AttackModifier(AttackModifierType.plus0),
        new AttackModifier(AttackModifierType.minus1)
      ]);
      attackModifierManager.addModifier(deck, new AttackModifier(AttackModifierType.bless), 1, false);
      expect(deck.cards.map((am) => am.type)).toEqual([
        AttackModifierType.plus1,
        AttackModifierType.bless,
        AttackModifierType.plus0,
        AttackModifierType.minus1
      ]);
    });

    it('appends at the end when index is -1', () => {
      const deck = new AttackModifierDeck([new AttackModifier(AttackModifierType.plus1)]);
      attackModifierManager.addModifier(deck, new AttackModifier(AttackModifierType.bless), -1, false);
      expect(deck.cards.map((am) => am.type)).toEqual([AttackModifierType.plus1, AttackModifierType.bless]);
    });
  });

  describe('addModifierByType / removeModifierByType', () => {
    it('adds a card of the given type to the deck (addModifierByType shuffles, so position is not deterministic)', () => {
      const deck = new AttackModifierDeck([new AttackModifier(AttackModifierType.plus1)]);
      attackModifierManager.addModifierByType(deck, AttackModifierType.curse);
      expect(deck.cards.map((am) => am.type).sort()).toEqual([AttackModifierType.curse, AttackModifierType.plus1].sort());
    });

    it('removes the first card of the given type', () => {
      const deck = new AttackModifierDeck([
        new AttackModifier(AttackModifierType.plus1),
        new AttackModifier(AttackModifierType.curse),
        new AttackModifier(AttackModifierType.curse)
      ]);
      attackModifierManager.removeModifierByType(deck, AttackModifierType.curse);
      expect(deck.cards.map((am) => am.type)).toEqual([AttackModifierType.plus1, AttackModifierType.curse]);
    });

    it('does nothing when no card of that type exists', () => {
      const deck = new AttackModifierDeck([new AttackModifier(AttackModifierType.plus1)]);
      attackModifierManager.removeModifierByType(deck, AttackModifierType.curse);
      expect(deck.cards.map((am) => am.type)).toEqual([AttackModifierType.plus1]);
    });
  });

  describe('drawNormal', () => {
    it('advances current by one and clears the deck state', () => {
      const deck = new AttackModifierDeck([new AttackModifier(AttackModifierType.plus1), new AttackModifier(AttackModifierType.plus0)]);
      deck.current = -1;
      deck.state = 'advantage';
      attackModifierManager.drawNormal(deck);
      expect(deck.current).toEqual(0);
      expect(deck.state).toBeUndefined();
    });
  });

  describe('removeDrawnDiscards', () => {
    it('removes bless/curse/empower/enfeeble cards at or before current, adjusting current', () => {
      const deck = new AttackModifierDeck([
        new AttackModifier(AttackModifierType.plus1),
        new AttackModifier(AttackModifierType.bless),
        new AttackModifier(AttackModifierType.plus0)
      ]);
      deck.current = 1;
      attackModifierManager.removeDrawnDiscards(deck);
      expect(deck.cards.map((am) => am.type)).toEqual([AttackModifierType.plus1, AttackModifierType.plus0]);
      expect(deck.current).toEqual(0);
    });

    it('keeps bless/curse cards that are still upcoming (after current)', () => {
      const deck = new AttackModifierDeck([new AttackModifier(AttackModifierType.plus1), new AttackModifier(AttackModifierType.bless)]);
      deck.current = 0;
      attackModifierManager.removeDrawnDiscards(deck);
      expect(deck.cards.map((am) => am.type)).toEqual([AttackModifierType.plus1, AttackModifierType.bless]);
      expect(deck.current).toEqual(0);
    });
  });

  describe('checkShuffle', () => {
    it('reshuffles once a "shuffle" card has been passed (index <= current)', () => {
      const deck = new AttackModifierDeck([
        Object.assign(new AttackModifier(AttackModifierType.plus1), { shuffle: true }),
        new AttackModifier(AttackModifierType.plus0)
      ]);
      deck.current = 0;
      attackModifierManager.checkShuffle(deck);
      expect(deck.current).toEqual(-1);
    });

    it('does nothing for a bb deck', () => {
      const deck = new AttackModifierDeck([Object.assign(new AttackModifier(AttackModifierType.plus1), { shuffle: true })], true);
      deck.current = 0;
      attackModifierManager.checkShuffle(deck);
      expect(deck.current).toEqual(0);
    });

    it('does nothing when no passed card has the shuffle flag', () => {
      const deck = new AttackModifierDeck([new AttackModifier(AttackModifierType.plus1), new AttackModifier(AttackModifierType.plus0)]);
      deck.current = 0;
      attackModifierManager.checkShuffle(deck);
      expect(deck.current).toEqual(0);
    });
  });

  describe('cardById', () => {
    it('resolves a default attack modifier by id', () => {
      const id = defaultAttackModifier[0].id;
      const am = attackModifierManager.cardById(new AttackModifierDeck(), id);
      expect(am).toBeDefined();
      expect(am?.id).toEqual(id);
    });

    it('is undefined for an unknown id', () => {
      expect(attackModifierManager.cardById(new AttackModifierDeck(), 'not-a-real-id')).toBeUndefined();
    });
  });

  describe('replaceCount', () => {
    it('is 0 for a non-replace perk', () => {
      const perk = Object.assign(new Perk(), { type: PerkType.add, cards: [] });
      expect(attackModifierManager.replaceCount(perk)).toEqual(0);
    });

    it('uses the explicit replaceCount when set', () => {
      const perk = Object.assign(new Perk(), { type: PerkType.replace, replaceCount: 2, cards: [] });
      expect(attackModifierManager.replaceCount(perk)).toEqual(2);
    });
  });

  describe('findByAttackModifier', () => {
    it('finds a structurally-equal modifier, ignoring id', () => {
      const list = [Object.assign(new AttackModifier(AttackModifierType.plus1), { id: 'a' })];
      const target = Object.assign(new AttackModifier(AttackModifierType.plus1), { id: 'b' });
      expect(attackModifierManager.findByAttackModifier(list, target)).toBe(list[0]);
    });

    it('is undefined when no modifier matches', () => {
      const list = [new AttackModifier(AttackModifierType.plus1)];
      const target = new AttackModifier(AttackModifierType.minus1);
      expect(attackModifierManager.findByAttackModifier(list, target)).toBeUndefined();
    });
  });

  describe('calculateAttackResult', () => {
    beforeEach(() => {
      vi.spyOn(gameManager, 'fhRules').mockReturnValue(false);
      settingsManager.settings.alwaysFhAdvantage = false;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns undefined when no card has been drawn yet (current < 0)', () => {
      const deck = new AttackModifierDeck([new AttackModifier(AttackModifierType.plus1)]);
      deck.current = -1;
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(attackModifierManager.calculateAttackResult(deck, 2)).toBeUndefined();
    });

    it('applies the current card to the base value with no state and no rolling', () => {
      const deck = new AttackModifierDeck([new AttackModifier(AttackModifierType.plus1, 1, AttackModifierValueType.plus)]);
      deck.current = 0;

      const result = attackModifierManager.calculateAttackResult(deck, 2);

      expect(result?.result).toBe(3);
      expect(result?.stringified).toBe('2+1');
    });

    it('stacks a rolling card ahead of the current one before applying the base card', () => {
      const rollingCard = new AttackModifier(AttackModifierType.plus1, 1, AttackModifierValueType.plus, undefined, [], true);
      const baseCard = new AttackModifier(AttackModifierType.plus2, 2, AttackModifierValueType.plus);
      const deck = new AttackModifierDeck([rollingCard, baseCard]);
      deck.current = 1;
      deck.lastVisible = 0;

      const result = attackModifierManager.calculateAttackResult(deck, 2);

      // 2 (base) + 1 (rolling) + 2 (base card) = 5
      expect(result?.result).toBe(5);
    });

    it('advantage (non-fh): picks whichever of the two top cards yields the higher result', () => {
      const secondCard = new AttackModifier(AttackModifierType.plus3, 3, AttackModifierValueType.plus); // index 0
      const firstCard = new AttackModifier(AttackModifierType.plus1, 1, AttackModifierValueType.plus); // index 1 (current)
      const deck = new AttackModifierDeck([secondCard, firstCard]);
      deck.current = 1;
      deck.state = 'advantage';

      const result = attackModifierManager.calculateAttackResult(deck, 2);

      // plus3 (5) beats plus1 (3) -> chosen, chooseOffset = 1
      expect(result?.result).toBe(5);
      expect(result?.chooseOffset).toBe(1);
    });

    it('disadvantage (non-fh): picks whichever of the two top cards yields the lower result', () => {
      const secondCard = new AttackModifier(AttackModifierType.plus1, 1, AttackModifierValueType.plus); // index 0
      const firstCard = new AttackModifier(AttackModifierType.plus3, 3, AttackModifierValueType.plus); // index 1 (current)
      const deck = new AttackModifierDeck([secondCard, firstCard]);
      deck.current = 1;
      deck.state = 'disadvantage';

      const result = attackModifierManager.calculateAttackResult(deck, 2);

      // plus1 (3) is lower than plus3 (5) -> chosen, chooseOffset = 1
      expect(result?.result).toBe(3);
      expect(result?.chooseOffset).toBe(1);
    });

    it('forceIndex overrides the advantage/disadvantage choice with an explicit card', () => {
      const secondCard = new AttackModifier(AttackModifierType.plus3, 3, AttackModifierValueType.plus); // index 0
      const firstCard = new AttackModifier(AttackModifierType.plus1, 1, AttackModifierValueType.plus); // index 1 (current)
      const deck = new AttackModifierDeck([secondCard, firstCard]);
      deck.current = 1;
      deck.state = 'advantage';

      const result = attackModifierManager.calculateAttackResult(deck, 2, 0);

      // forced to index 0 (plus3) regardless of the advantage comparison
      expect(result?.result).toBe(5);
      expect(result?.chooseOffset).toBe(1);
    });

    it('wraps a multiply (x-type) base card result in parentheses with the multiplier suffixed', () => {
      const deck = new AttackModifierDeck([new AttackModifier(AttackModifierType.double, 2, AttackModifierValueType.multiply)]);
      deck.current = 0;

      const result = attackModifierManager.calculateAttackResult(deck, 3);

      expect(result?.stringified).toBe('(3)x2');
      expect(result?.result).toBe(6);
    });
  });

  describe('buildCharacterAttackModifierDeck', () => {
    it('builds a deck from amTables for a bb character, marking each card as character-owned', () => {
      const character = buildCharacter('test-char', { bb: true });
      character.level = 1;
      character.amTables = [[AttackModifierType.plus1, AttackModifierType.minus1]];

      const deck = attackModifierManager.buildCharacterAttackModifierDeck(character);

      expect(deck.cards.every((am) => am.character)).toBe(true);
      expect(deck.cards.map((am) => am.type)).toEqual([AttackModifierType.plus1, AttackModifierType.minus1]);
    });

    it('builds the default deck and applies perks for a non-bb character', () => {
      const character = buildCharacter('test-char', { bb: false });
      const perk = Object.assign(new Perk(), {
        type: PerkType.add,
        cards: [Object.assign(new PerkCard(), { count: 1, attackModifier: new AttackModifier(AttackModifierType.curse) })]
      });
      character.perks = [perk];

      const deck = attackModifierManager.buildCharacterAttackModifierDeck(character);

      expect(deck.attackModifiers.some((am) => am.type === AttackModifierType.curse)).toBe(true);
    });
  });

  describe('applyCharacterPerks', () => {
    beforeEach(() => {
      gameManager.trialsManager.apply = false;
      gameManager.trialsManager.trialsEnabled = false;
    });

    it('unconditionally registers "add"/"replace" perk cards into the deck\'s attackModifiers pool', () => {
      // empower is not part of the default 10-card attackModifiers pool, so this exercises a
      // genuinely new pool entry rather than colliding with (and being skipped in favor of) a
      // structurally-equal stock card such as curse/bless/minus1extra.
      const character = buildCharacter();
      const perk = Object.assign(new Perk(), {
        type: PerkType.add,
        cards: [Object.assign(new PerkCard(), { count: 1, attackModifier: new AttackModifier(AttackModifierType.empower) })]
      });
      character.perks = [perk];
      const deck = new AttackModifierDeck();

      attackModifierManager.applyCharacterPerks(character, deck);

      const added = deck.attackModifiers.find((am) => am.type === AttackModifierType.empower);
      expect(added).toBeDefined();
      expect(added?.character).toBe(true);
    });

    it('adds one card copy per checked non-combined perk into the active deck', () => {
      const character = buildCharacter();
      const perk = Object.assign(new Perk(), {
        type: PerkType.add,
        combined: false,
        cards: [Object.assign(new PerkCard(), { count: 1, attackModifier: new AttackModifier(AttackModifierType.curse) })]
      });
      character.perks = [perk];
      character.progress.perks = [2]; // checked twice
      const deck = new AttackModifierDeck();
      const before = deck.cards.filter((am) => am.type === AttackModifierType.curse).length;

      attackModifierManager.applyCharacterPerks(character, deck);

      const after = deck.cards.filter((am) => am.type === AttackModifierType.curse).length;
      expect(after - before).toBe(2);
    });

    it('adds a combined perk only once its checked count matches perk.count exactly', () => {
      const character = buildCharacter();
      const perk = Object.assign(new Perk(), {
        type: PerkType.add,
        combined: true,
        count: 3,
        cards: [Object.assign(new PerkCard(), { count: 1, attackModifier: new AttackModifier(AttackModifierType.curse) })]
      });
      character.perks = [perk];
      character.progress.perks = [2]; // not yet at count=3
      const deck = new AttackModifierDeck();

      attackModifierManager.applyCharacterPerks(character, deck);
      expect(deck.cards.filter((am) => am.type === AttackModifierType.curse).length).toBe(0);

      character.progress.perks = [3];
      attackModifierManager.applyCharacterPerks(character, deck);
      expect(deck.cards.filter((am) => am.type === AttackModifierType.curse).length).toBe(1);
    });

    it('replace perk: removes the first `replaceCount` cards and adds the remainder', () => {
      const character = buildCharacter();
      const perk = Object.assign(new Perk(), {
        type: PerkType.replace,
        combined: false,
        replaceCount: 1,
        cards: [
          Object.assign(new PerkCard(), { count: 1, attackModifier: new AttackModifier(AttackModifierType.minus1) }), // removed
          Object.assign(new PerkCard(), { count: 1, attackModifier: new AttackModifier(AttackModifierType.curse) }) // added
        ]
      });
      character.perks = [perk];
      character.progress.perks = [1];
      const deck = new AttackModifierDeck();
      const minus1Before = deck.cards.filter((am) => am.type === AttackModifierType.minus1).length;

      attackModifierManager.applyCharacterPerks(character, deck);

      expect(deck.cards.filter((am) => am.type === AttackModifierType.minus1).length).toBe(minus1Before - 1);
      expect(deck.cards.some((am) => am.type === AttackModifierType.curse)).toBe(true);
    });

    it('gh item 101 removes up to two minus1 cards from the deck', () => {
      const character = buildCharacter('test-char', { edition: 'gh' });
      character.progress.equippedItems = [{ name: '101', edition: 'gh' } as any];
      const deck = new AttackModifierDeck();
      const minus1Before = deck.cards.filter((am) => am.id === AttackModifierType.minus1).length;
      expect(minus1Before).toBeGreaterThanOrEqual(2);

      attackModifierManager.applyCharacterPerks(character, deck);

      expect(deck.cards.filter((am) => am.id === AttackModifierType.minus1).length).toBe(minus1Before - 2);
    });

    it('skips all equipped-item effects when building a monster deck', () => {
      const character = buildCharacter('test-char', { edition: 'gh' });
      character.progress.equippedItems = [{ name: '101', edition: 'gh' } as any];
      const deck = new AttackModifierDeck();
      const minus1Before = deck.cards.filter((am) => am.id === AttackModifierType.minus1).length;

      attackModifierManager.applyCharacterPerks(character, deck, true);

      expect(deck.cards.filter((am) => am.id === AttackModifierType.minus1).length).toBe(minus1Before);
    });
  });
});
