import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { ChallengeCard, ChallengeDeck } from 'src/app/game/model/data/Challenges';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';

// ChallengesManager also covers update()/applyCard*() (FH-specific card effects pulling in
// many other managers). This spec sticks to the small, clearly-scoped deck-bookkeeping helpers
// (drawCard, clearDrawn, toggleKeep, shuffleDeck) and the activeCards()/isActive() lookups.

function buildDeck(cardIds: number[], edition: string = 'fh'): ChallengeDeck {
  const deck = new ChallengeDeck();
  deck.cards = cardIds.map((id) => new ChallengeCard(id, edition, 'fully'));
  return deck;
}

describe('ChallengesManager', () => {
  const challengesManager = gameManager.challengesManager;

  beforeEach(() => {
    challengesManager.available = false;
    gameManager.game.state = GameState.draw;
    gameManager.roundManager.firstRound = false;
    gameManager.editionData = [new EditionData('fh', [], [], [], [], [], [])];
    settingsManager.settings.editions = ['fh'];
  });

  describe('moveCard', () => {
    it('moves cards between upcoming, discarded and finished', () => {
      const deck = buildDeck([1, 2, 3, 4, 5]);
      deck.finished = 0;
      deck.current = 2;
      challengesManager.moveCard(deck, 'upcoming', 0, 'finished', 0);
      expect(deck.cards.map((card) => card.cardId)).toEqual([1, 4, 2, 3, 5]);
      expect(deck.finished).toBe(1);
      expect(deck.current).toBe(3);
      challengesManager.moveCard(deck, 'finished', 0, 'upcoming', 0);
      expect(deck.cards.map((card) => card.cardId)).toEqual([1, 2, 3, 4, 5]);
      expect(deck.finished).toBe(0);
      expect(deck.current).toBe(2);
    });
  });

  describe('restoreCard', () => {
    it('inserts the card at a seeded position among the upcoming cards', () => {
      const restore = (seed: number) => {
        const deck = buildDeck([1, 2, 3, 4, 5]);
        deck.current = 1;
        gameManager.game.seed = seed;
        challengesManager.restoreCard(deck, new ChallengeCard(9, 'fh', 'fully'));
        return deck.cards.map((card) => card.cardId);
      };
      for (let seed = 0; seed < 20; seed++) {
        const cards = restore(seed);
        expect(cards.slice(0, 2)).toEqual([1, 2]);
        expect(cards.indexOf(9)).toBeGreaterThanOrEqual(2);
        expect(cards.length).toBe(6);
        expect(restore(seed)).toEqual(cards);
      }
    });
  });

  describe('drawCard', () => {
    it('advances current by one', () => {
      const deck = buildDeck([1, 2, 3]);
      deck.current = 0;
      challengesManager.drawCard(deck);
      expect(deck.current).toEqual(1);
    });

    it('clamps current to the last card index', () => {
      const deck = buildDeck([1, 2, 3]);
      deck.current = 2;
      challengesManager.drawCard(deck);
      expect(deck.current).toEqual(2);
    });
  });

  describe('clearDrawn', () => {
    it('moves drawn cards (above finished) to the back of the deck', () => {
      const deck = buildDeck([1, 2, 3, 4]);
      deck.current = 2;
      deck.finished = -1;
      challengesManager.clearDrawn(deck);
      expect(deck.cards.map((c) => c.cardId)).toEqual([4, 3, 2, 1]);
      expect(deck.current).toEqual(-1);
      expect(deck.keep).toEqual([]);
    });

    it('preserves kept cards in place when keep is true', () => {
      const deck = buildDeck([1, 2, 3]);
      deck.current = 2;
      deck.finished = -1;
      deck.keep = [1]; // keep card '2'
      challengesManager.clearDrawn(deck, true);
      expect(deck.cards.map((c) => c.cardId)).toEqual([2, 3, 1]);
    });

    it('does nothing when no card has been drawn (current < 0)', () => {
      const deck = buildDeck([1, 2, 3]);
      deck.current = -1;
      challengesManager.clearDrawn(deck);
      expect(deck.cards.map((c) => c.cardId)).toEqual([1, 2, 3]);
    });
  });

  describe('toggleKeep', () => {
    it('adds an index to keep when not already present', () => {
      const deck = buildDeck([1, 2, 3]);
      challengesManager.toggleKeep(deck, 1, 2);
      expect(deck.keep).toEqual([1]);
    });

    it('removes an index from keep when already present', () => {
      const deck = buildDeck([1, 2, 3]);
      deck.keep = [0, 1];
      challengesManager.toggleKeep(deck, 1, 2);
      expect(deck.keep).toEqual([0]);
    });

    it('drops the oldest kept index once keepAvailable is reached', () => {
      const deck = buildDeck([1, 2, 3]);
      deck.keep = [0, 1];
      challengesManager.toggleKeep(deck, 2, 2);
      expect(deck.keep).toEqual([1, 2]);
    });
  });

  describe('shuffleDeck', () => {
    it('resets current/finished/keep and keeps the same set of cards', () => {
      const deck = buildDeck([1, 2, 3, 4, 5]);
      deck.current = 2;
      deck.finished = 1;
      deck.keep = [0];
      challengesManager.shuffleDeck(deck);
      expect(deck.current).toEqual(-1);
      expect(deck.finished).toEqual(-1);
      expect(deck.keep).toEqual([]);
      expect(deck.cards.map((c) => c.cardId).sort()).toEqual([1, 2, 3, 4, 5]);
    });

    it('restores already-drawn cards to the front and current/finished when onlyUpcoming is true', () => {
      const deck = buildDeck([1, 2, 3, 4, 5]);
      deck.current = 1;
      deck.finished = 0;
      challengesManager.shuffleDeck(deck, true);
      expect(deck.current).toEqual(1);
      expect(deck.finished).toEqual(0);
      expect(deck.cards.slice(0, 2).map((c) => c.cardId)).toEqual([1, 2]);
      expect(deck.cards.map((c) => c.cardId).sort()).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('activeCards / activeCardIds / isActive', () => {
    it('returns [] when challenges are not available and game.state is not "next"', () => {
      challengesManager.available = false;
      gameManager.game.challengeDeck = buildDeck([1, 2, 3]);
      gameManager.game.challengeDeck.current = 1;
      expect(challengesManager.activeCards()).toEqual([]);
    });

    it('returns cards between finished+1 and current when available and not the first round', () => {
      challengesManager.available = true;
      gameManager.roundManager.firstRound = false;
      const deck = buildDeck([1, 2, 3, 4], 'fh');
      deck.current = 2;
      deck.finished = 0;
      gameManager.game.challengeDeck = deck;
      expect(challengesManager.activeCardIds()).toEqual([2, 3]);
    });

    it('hides active cards during the first round unless start is passed', () => {
      challengesManager.available = true;
      gameManager.roundManager.firstRound = true;
      const deck = buildDeck([1, 2, 3], 'fh');
      deck.current = 1;
      deck.finished = -1;
      gameManager.game.challengeDeck = deck;
      expect(challengesManager.activeCardIds()).toEqual([]);
      expect(challengesManager.activeCardIds(undefined)).toEqual([]);
      expect(challengesManager.activeCards(undefined, true).map((c) => c.cardId)).toEqual([1, 2]);
    });

    it('always returns active cards when game.state is "next", regardless of availability', () => {
      challengesManager.available = false;
      gameManager.game.state = GameState.next;
      const deck = buildDeck([1, 2, 3], 'fh');
      deck.current = 1;
      deck.finished = -1;
      gameManager.game.challengeDeck = deck;
      expect(challengesManager.activeCardIds()).toEqual([1, 2]);
    });

    it('isActive checks membership in the active card ids', () => {
      challengesManager.available = true;
      gameManager.roundManager.firstRound = false;
      const deck = buildDeck([10, 20, 30], 'fh');
      deck.current = 1;
      deck.finished = -1;
      gameManager.game.challengeDeck = deck;
      expect(challengesManager.isActive(10)).toBe(true);
      expect(challengesManager.isActive(30)).toBe(false);
    });
  });
});

describe('ChallengesManager stat effects', () => {
  const challengesManager = gameManager.challengesManager;

  function buildEntity(): { monster: Monster; entity: MonsterEntity } {
    const monster = new Monster(
      Object.assign(new MonsterData(), { name: 'test-monster', edition: 'fh', stats: [new MonsterStat(MonsterType.normal, 1, 10)] }),
      1
    );
    const entity = new MonsterEntity(1, MonsterType.normal, monster);
    entity.maxHealth = 10;
    entity.health = 10;
    monster.entities = [entity];
    return { monster, entity };
  }

  beforeEach(() => {
    gameManager.game.level = 3;
    gameManager.game.figures = [];
  });

  afterEach(() => vi.restoreAllMocks());

  it('removing the #1492 tag keeps the other tags, so #1493 is not applied twice', () => {
    const { monster, entity } = buildEntity();
    const card1492 = new ChallengeCard(1492, 'fh', 'fully');
    const card1493 = new ChallengeCard(1493, 'fh', 'fully');
    challengesManager.applyCardStatEffect(monster, card1492);
    challengesManager.applyCardStatEffect(monster, card1493);
    expect(entity.maxHealth).toEqual(12);

    entity.health -= 5;
    challengesManager.applyCardStatEffect(monster, card1492);
    challengesManager.applyCardStatEffect(monster, card1493);

    expect(entity.maxHealth).toEqual(12);
    expect(entity.health).toEqual(7);
    expect(entity.tags).toEqual(['challenge-fh-1493']);
  });

  it('stat effects for enemies are not applied to allied monsters', () => {
    const { monster, entity } = buildEntity();
    monster.isAlly = true;
    gameManager.game.figures = [monster];
    vi.spyOn(challengesManager, 'activeCards').mockReturnValue([new ChallengeCard(1493, 'fh', 'fully')]);

    challengesManager.applyCardsAlways();

    expect(entity.maxHealth).toEqual(10);
  });
});
