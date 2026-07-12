import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { Loot, LootDeck, LootType } from 'src/app/game/model/data/Loot';

// LootManager also covers drawCard()/applyLoot()/applyTreasureReward() (deep stateful flows
// pulling in itemManager/entityManager/scenarioManager) and apply()/fullLootDeck() (deck
// construction off the static fullLootDeck data). This spec sticks to the small, clearly-scoped
// pure helpers: shuffleDeck, getTotal, getValue, addCharacterLoot, hasTreasure, valueLabel.

function buildCharacter(name: string = 'brute'): Character {
  const data = Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

describe('LootManager', () => {
  const lootManager = gameManager.lootManager;

  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.playerCount = -1;
  });

  describe('shuffleDeck', () => {
    it('resets current to -1 and keeps the same set of cards', () => {
      const deck = new LootDeck();
      deck.cards = [new Loot(LootType.money, 1, 1), new Loot(LootType.money, 2, 2), new Loot(LootType.money, 3, 3)];
      deck.current = 1;
      lootManager.shuffleDeck(deck);
      expect(deck.current).toEqual(-1);
      expect(deck.cards.map((c) => c.cardId).sort()).toEqual([1, 2, 3]);
    });

    it('restores already-drawn cards to the front when onlyUpcoming is true', () => {
      const deck = new LootDeck();
      deck.cards = [new Loot(LootType.money, 1, 1), new Loot(LootType.money, 2, 2), new Loot(LootType.money, 3, 3)];
      deck.current = 1;
      lootManager.shuffleDeck(deck, true);
      expect(deck.current).toEqual(1);
      expect(deck.cards.slice(0, 2).map((c) => c.cardId)).toEqual([1, 2]);
    });
  });

  describe('getTotal', () => {
    it('is 0 when the deck has no cards of that type', () => {
      const deck = new LootDeck();
      deck.cards = [new Loot(LootType.hide, 1, 1)];
      expect(lootManager.getTotal(deck, LootType.money)).toEqual(0);
    });

    it('sums getValue() over all cards of the given type', () => {
      const deck = new LootDeck();
      deck.cards = [new Loot(LootType.money, 1, 4, 3, 2), new Loot(LootType.money, 2, 4, 3, 2), new Loot(LootType.hide, 3, 4, 3, 2)];
      gameManager.game.figures = [buildCharacter('brute'), buildCharacter('spellweaver')];
      expect(lootManager.getTotal(deck, LootType.money)).toEqual(4);
    });
  });

  describe('getValue', () => {
    it('uses the 2P value for 1-2 characters', () => {
      gameManager.game.figures = [buildCharacter('brute')];
      const loot = new Loot(LootType.money, 1, 4, 3, 2);
      expect(lootManager.getValue(loot, false)).toEqual(2);
    });

    it('uses the 3P value for exactly 3 characters', () => {
      gameManager.game.figures = [buildCharacter('brute'), buildCharacter('spellweaver'), buildCharacter('cragheart')];
      const loot = new Loot(LootType.money, 1, 4, 3, 2);
      expect(lootManager.getValue(loot, false)).toEqual(3);
    });

    it('uses the 4P value for 4+ characters', () => {
      gameManager.game.figures = [buildCharacter('a'), buildCharacter('b'), buildCharacter('c'), buildCharacter('d')];
      const loot = new Loot(LootType.money, 1, 4, 3, 2);
      expect(lootManager.getValue(loot, false)).toEqual(4);
    });

    it('adds enhancements by default, and omits them when enhancements=false', () => {
      gameManager.game.figures = [buildCharacter('brute')];
      const loot = Object.assign(new Loot(LootType.money, 1, 4, 3, 2), { enhancements: 5 });
      expect(lootManager.getValue(loot)).toEqual(7);
      expect(lootManager.getValue(loot, false)).toEqual(2);
    });
  });

  describe('addCharacterLoot', () => {
    it('adds money loot straight to character.loot', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      lootManager.addCharacterLoot(character, new Loot(LootType.money, 1, 4, 3, 2));
      expect(character.loot).toEqual(2);
    });

    it('accumulates appliable resource loot in character.progress.loot', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      lootManager.addCharacterLoot(character, new Loot(LootType.hide, 1, 2, 2, 2));
      lootManager.addCharacterLoot(character, new Loot(LootType.hide, 2, 3, 3, 3));
      expect(character.progress.loot[LootType.hide]).toEqual(5);
    });

    it('does not let accumulated resource loot go negative', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      character.progress.loot[LootType.hide] = 1;
      lootManager.addCharacterLoot(character, new Loot(LootType.hide, 1, -5, -5, -5));
      expect(character.progress.loot[LootType.hide]).toEqual(1);
    });
  });

  describe('hasTreasure', () => {
    it('matches an exact string/number entry', () => {
      const character = buildCharacter();
      character.treasures = ['A1', 5];
      expect(lootManager.hasTreasure(character, 'A1', 0)).toBe(true);
      expect(lootManager.hasTreasure(character, 5, 0)).toBe(true);
      expect(lootManager.hasTreasure(character, 'A2', 0)).toBe(false);
    });

    it('matches a prefixed "value:" entry', () => {
      const character = buildCharacter();
      character.treasures = ['A1:used'];
      expect(lootManager.hasTreasure(character, 'A1', 0)).toBe(true);
    });

    it('matches gold treasures via the "G-<index>" convention', () => {
      const character = buildCharacter();
      character.treasures = ['G-3'];
      expect(lootManager.hasTreasure(character, 'G', 3)).toBe(true);
      expect(lootManager.hasTreasure(character, 'G', 4)).toBe(false);
    });
  });

  describe('valueLabel', () => {
    it('renders a single number when all player-count values match', () => {
      const loot = new Loot(LootType.money, 1, 5, 5, 5);
      expect(lootManager.valueLabel(loot)).toEqual('5');
    });

    it('renders an empty string when the shared value is 0', () => {
      const loot = new Loot(LootType.money, 1, 0, 0, 0);
      expect(lootManager.valueLabel(loot)).toEqual('');
    });

    it('splits 3-4P vs 2P when 3P and 4P match but 2P differs', () => {
      const loot = new Loot(LootType.money, 1, 5, 5, 2);
      expect(lootManager.valueLabel(loot)).toEqual('%game.loot.player.3-4% +5/%game.loot.player.2% +2');
    });

    it('splits 4P vs 2-3P when 2P and 3P match but 4P differs', () => {
      const loot = new Loot(LootType.money, 1, 7, 2, 2);
      expect(lootManager.valueLabel(loot)).toEqual('%game.loot.player.4% +7/%game.loot.player.2-3% +2');
    });

    it('renders all three values when they all differ', () => {
      const loot = new Loot(LootType.money, 1, 4, 3, 2);
      expect(lootManager.valueLabel(loot)).toEqual('%game.loot.player.4% +4/%game.loot.player.3% +3/%game.loot.player.2% +2');
    });
  });
});
