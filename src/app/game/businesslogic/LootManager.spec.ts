import { LOOT_RANDOM_ITEM_MARKER } from 'src/app/game/businesslogic/LootManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { Character } from 'src/app/game/model/Character';
import { BuildingCosts, SelectResourceResult } from 'src/app/game/model/data/BuildingData';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { Loot, LootDeck, LootType } from 'src/app/game/model/data/Loot';
import { ScenarioData, ScenarioRewards } from 'src/app/game/model/data/ScenarioData';

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

  describe('moveCard', () => {
    it('moves a loot card and remaps drawn character loot cards, dropping upcoming ones', () => {
      const deck = new LootDeck();
      deck.cards = [0, 1, 2, 3].map((value) => new Loot(LootType.money, value, 1, 1, 1));
      deck.current = 1;
      const character = buildCharacter();
      character.lootCards = [0, 1];
      gameManager.game.figures = [character];

      lootManager.moveCard(deck, 'discarded', 1, 'upcoming', 1);
      expect(deck.current).toBe(0);
      expect(deck.cards.map((loot) => loot.cardId)).toEqual([1, 2, 0, 3]);
      expect(character.lootCards).toEqual([0]);
    });
  });

  describe('lootScenarioTreasure / removeScenarioTreasure', () => {
    afterEach(() => vi.restoreAllMocks());

    it('records goal and numbered treasures for character and party, with reward results', () => {
      settingsManager.settings.treasuresLoot = true;
      vi.spyOn(lootManager, 'lootTreasure').mockReturnValue([['gold']]);
      const character = buildCharacter();
      gameManager.game.party.treasures = [];

      expect(lootManager.lootScenarioTreasure(character, 'G', 2, 'gh')).toEqual([]);
      expect(lootManager.lootScenarioTreasure(character, 7, 0, 'gh')).toEqual([['gold']]);
      expect(lootManager.lootTreasure).toHaveBeenCalledWith(character, 6, 'gh');
      expect(character.treasures).toEqual(['G-2', '7:gold']);
      expect(gameManager.game.party.treasures).toEqual([new Identifier(7, 'gh')]);

      lootManager.removeScenarioTreasure(character, '7:gold', 'gh');
      lootManager.removeScenarioTreasure(character, 'G-2', 'gh');
      expect(character.treasures).toEqual([]);
      expect(gameManager.game.party.treasures).toEqual([]);
      settingsManager.settings.treasuresLoot = false;
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

  describe('applySelectResources', () => {
    const costs = (values: Partial<BuildingCosts> = {}): BuildingCosts => ({
      prosperity: 0,
      lumber: 0,
      metal: 0,
      hide: 0,
      gold: 0,
      manual: 0,
      ...values
    });

    it('subtracts spent and adds received resources', () => {
      const brute = buildCharacter('brute');
      brute.progress.gold = 10;
      gameManager.game.party.loot = { [LootType.hide]: 3 };
      lootManager.applySelectResources(
        new SelectResourceResult([brute], [costs({ gold: 4 })], costs({ hide: 1 }), 0, [costs({ metal: 2, gold: 5 })])
      );
      expect(brute.progress.gold).toEqual(11);
      expect(brute.progress.loot[LootType.metal]).toEqual(2);
      expect(gameManager.game.party.loot[LootType.hide]).toEqual(2);
    });

    it('adds resources received by the Frosthaven supply', () => {
      gameManager.game.party.loot = { [LootType.metal]: 1 };
      lootManager.applySelectResources(new SelectResourceResult([], [], costs(), 0, [], costs({ metal: 2 })));
      expect(gameManager.game.party.loot[LootType.metal]).toEqual(3);
    });
  });
});

describe('LootManager drawCard on an exhausted deck', () => {
  it('does not apply the last card again', () => {
    const deck = new LootDeck();
    deck.cards = [new Loot(LootType.money, 1, 1), new Loot(LootType.money, 2, 2)];
    deck.current = 1;
    const character = new Character(
      Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] }),
      1
    );
    character.loot = 0;

    gameManager.lootManager.drawCard(deck, character);

    expect(deck.current).toEqual(1);
    expect(character.loot).toEqual(0);
    expect(character.lootCards).toEqual([]);
  });
});

describe('LootManager loot card assignment', () => {
  const lootManager = gameManager.lootManager;
  const item = Object.assign(new ItemData(), { id: 7, edition: 'test', name: 'item7' });
  let first: Character;
  let second: Character;

  beforeEach(() => {
    resetTestGame();
    first = createTestCharacter(1);
    second = createTestCharacter(2);
    gameManager.game.lootDeck.cards = [new Loot(LootType.money, 1, 2), new Loot(LootType.random_item, 2, 1)];
    gameManager.game.lootDeck.current = 1;
    vi.spyOn(gameManager.itemManager, 'getItem').mockReturnValue(item);
    vi.spyOn(gameManager.itemManager, 'addItemCount').mockImplementation(() => {});
    settingsManager.settings.characterItems = true;
    settingsManager.settings.applyLootRandomItem = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('moves the random item of a loot card to the new holder without drawing again', () => {
    lootManager.applyRandomItem(first, 1, item);
    const draw = vi.spyOn(gameManager.itemManager, 'drawRandomItem');

    expect(lootManager.assignLootCard(1, second)).toBe(item);
    expect(draw).not.toHaveBeenCalled();
    expect(first.lootCards).toEqual([]);
    expect(first.progress.items).toEqual([]);
    expect(first.progress.equippedItems).toEqual([]);
    expect(second.lootCards).toEqual([1]);
    expect(second.progress.items).toEqual([]);

    lootManager.applyRandomItem(second, 1, item);
    expect(lootManager.lootRandomItem(second)).toBe(item);
    expect(second.progress.equippedItems[0].marker).toBe(LOOT_RANDOM_ITEM_MARKER);
  });

  it('applies the random item directly when requested', () => {
    lootManager.applyRandomItem(first, 1, item);
    lootManager.assignLootCard(1, second, true);
    expect(second.progress.items.map((identifier) => identifier.name)).toEqual(['7']);
  });

  it('auto sells an already owned random item', () => {
    second.progress.items.push(new Identifier(7, 'test'));
    vi.spyOn(gameManager.itemManager, 'itemSellValue').mockReturnValue(5);
    lootManager.applyRandomItem(second, 1, item);
    expect(second.progress.gold).toBe(5);
    expect(second.progress.items.length).toBe(1);
  });

  it('removes money loot from the holder', () => {
    lootManager.assignLootCard(0, first);
    expect(first.loot).toBeGreaterThan(0);
    expect(lootManager.assignLootCard(0, undefined)).toBeUndefined();
    expect(first.lootCards).toEqual([]);
    expect(first.loot).toBe(0);
  });

  it('applies loot deck section rewards', () => {
    vi.spyOn(gameManager, 'currentEdition').mockReturnValue('test');
    const conclusion = Object.assign(new ScenarioData(), {
      index: '1.1',
      edition: 'test',
      conclusion: true,
      rewards: Object.assign(new ScenarioRewards(), { lootingGold: 5, items: ['3'], removeLootDeckCards: [1418] })
    });
    vi.spyOn(gameManager, 'sectionData').mockReturnValue([conclusion]);
    gameManager.game.lootDeckFixed = [LootType.special1];

    lootManager.addLootDeckSection('1.1', first);
    expect(gameManager.game.lootDeckSections).toEqual(['1.1']);
    expect(lootManager.lootDeckSectionApplied('1.1')).toBe(true);
    expect(first.progress.gold).toBe(5);
    expect(first.progress.items.map((identifier) => identifier.name)).toEqual(['3']);
    expect(gameManager.game.lootDeckFixed).toEqual([]);

    lootManager.removeLootDeckSection('1.1');
    expect(lootManager.lootDeckSectionApplied('1.1')).toBe(false);
  });
});
