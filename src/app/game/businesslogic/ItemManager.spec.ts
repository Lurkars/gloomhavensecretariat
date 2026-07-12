import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { BuildingModel } from 'src/app/game/model/Building';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { ItemData } from 'src/app/game/model/data/ItemData';

// ItemManager also covers isItemAvailable()/applyItemEffect(s)()/toggleEquippedItem() (deep
// stateful flows pulling in campaign progression, attack modifiers and entity conditions). This
// spec sticks to the small, clearly-scoped pure/near-pure helpers: pricerModifier, itemSellValue,
// sortItems, addItem/removeItem/sellItem, owned, isEquipped, assigned and the buying/crafting/
// brewing "disabled" gates.

function buildItem(overrides: Partial<ItemData> = {}): ItemData {
  return Object.assign(new ItemData(), { edition: 'gh' }, overrides);
}

function buildCharacter(name: string = 'brute', edition: string = 'gh'): Character {
  const data = Object.assign(new CharacterData(), { name, edition, stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

describe('ItemManager', () => {
  const itemManager = gameManager.itemManager;

  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.party.reputation = 0;
    gameManager.game.party.specialItems = [];
    gameManager.game.party.buildings = [];
    gameManager.game.party.campaignMode = false;
    gameManager.game.edition = undefined;
    gameManager.editionData = [];
    settingsManager.settings.editions = [];
  });

  describe('pricerModifier', () => {
    it('is 0 around reputation 0-2', () => {
      gameManager.game.party.reputation = 0;
      expect(itemManager.pricerModifier()).toBeCloseTo(0);
      gameManager.game.party.reputation = 2;
      expect(itemManager.pricerModifier()).toBeCloseTo(0);
    });

    it('is negative (price drop) for positive reputation above 2', () => {
      gameManager.game.party.reputation = 6;
      expect(itemManager.pricerModifier()).toEqual(-1);
    });

    it('is positive (price increase) for negative reputation', () => {
      gameManager.game.party.reputation = -6;
      expect(itemManager.pricerModifier()).toEqual(1);
    });
  });

  describe('itemSellValue', () => {
    it('is half the cost, rounded down, when the item has a cost', () => {
      expect(itemManager.itemSellValue(buildItem({ cost: 5 }))).toEqual(2);
    });

    it('is derived from resourcesAny/resources/requiredItems when there is no cost', () => {
      expect(itemManager.itemSellValue(buildItem({ resourcesAny: [{} as any] }))).toEqual(1);
      expect(itemManager.itemSellValue(buildItem({ resources: { hide: 2 } as any }))).toEqual(4);
      expect(itemManager.itemSellValue(buildItem({ requiredItems: [1, 2] }))).toEqual(4);
    });

    it('is 0 for a costless item with no resources/requirements', () => {
      expect(itemManager.itemSellValue(buildItem())).toEqual(0);
    });
  });

  describe('sortItems', () => {
    it('sorts numeric ids ascending', () => {
      expect(itemManager.sortItems(buildItem({ id: 5 }), buildItem({ id: 2 }))).toBeGreaterThan(0);
    });

    it('sorts numeric ids before string ids', () => {
      expect(itemManager.sortItems(buildItem({ id: 5 }), buildItem({ id: 'x' }))).toEqual(-1);
      expect(itemManager.sortItems(buildItem({ id: 'x' }), buildItem({ id: 5 }))).toEqual(1);
    });

    it('sorts string ids alphabetically', () => {
      expect(itemManager.sortItems(buildItem({ id: 'a' }), buildItem({ id: 'b' }))).toEqual(-1);
      expect(itemManager.sortItems(buildItem({ id: 'b' }), buildItem({ id: 'a' }))).toEqual(1);
    });
  });

  describe('addItem / removeItem / sellItem', () => {
    it('adds a normal item to the character progress', () => {
      const character = buildCharacter();
      const item = buildItem({ id: 5 });
      itemManager.addItem(item, character);
      expect(character.progress.items).toEqual([{ name: '5', edition: 'gh' } as any]);
    });

    it('adds a specialFh item to party.specialItems instead of the character', () => {
      const character = buildCharacter();
      const item = buildItem({ id: 9, specialFh: ['x'] });
      itemManager.addItem(item, character);
      expect(character.progress.items).toEqual([]);
      expect(gameManager.game.party.specialItems.length).toEqual(1);
    });

    it('removeItem drops the item and any equipped-item reference', () => {
      const character = buildCharacter();
      const item = buildItem({ id: 5 });
      itemManager.addItem(item, character);
      itemManager.toggleEquippedItem(item, character, true);
      expect(itemManager.isEquipped(item, character)).toBe(true);

      itemManager.removeItem(item, character);
      expect(itemManager.owned(item, character)).toBe(false);
      expect(itemManager.isEquipped(item, character)).toBe(false);
    });

    it('sellItem refunds gold and removes the item', () => {
      const character = buildCharacter();
      character.progress.gold = 0;
      const item = buildItem({ id: 5, cost: 10 });
      itemManager.addItem(item, character);
      itemManager.sellItem(item, character);
      expect(character.progress.gold).toEqual(5);
      expect(itemManager.owned(item, character)).toBe(false);
    });

    it('sellItem does nothing for an unowned item', () => {
      const character = buildCharacter();
      character.progress.gold = 0;
      const item = buildItem({ id: 5, cost: 10 });
      itemManager.sellItem(item, character);
      expect(character.progress.gold).toEqual(0);
    });
  });

  describe('owned / isEquipped', () => {
    it('owned is true once addItem has been called for that item', () => {
      const character = buildCharacter();
      const item = buildItem({ id: 7 });
      expect(itemManager.owned(item, character)).toBe(false);
      itemManager.addItem(item, character);
      expect(itemManager.owned(item, character)).toBe(true);
    });
  });

  describe('assigned', () => {
    it('counts items across all character figures and party.specialItems', () => {
      const item = buildItem({ id: 5 });
      const characterA = buildCharacter('brute');
      const characterB = buildCharacter('spellweaver');
      itemManager.addItem(item, characterA);
      itemManager.addItem(item, characterB);
      gameManager.game.figures = [characterA, characterB];
      gameManager.game.party.specialItems = [{ name: '5', edition: 'gh' } as any];

      expect(itemManager.assigned(item)).toEqual(3);
    });

    it('is 0 when no figure or special item references it', () => {
      const item = buildItem({ id: 5 });
      gameManager.game.figures = [buildCharacter('brute')];
      expect(itemManager.assigned(item)).toEqual(0);
    });
  });

  describe('buying/crafting/brewing gates', () => {
    function enableFh() {
      gameManager.editionData = [new EditionData('fh', [], [], [], [], [], [])];
      settingsManager.settings.editions = ['fh'];
      gameManager.game.edition = 'fh';
      gameManager.game.party.campaignMode = true;
    }

    it('buyingDisabled is false outside fh rules regardless of buildings', () => {
      gameManager.game.party.campaignMode = true;
      expect(itemManager.buyingDisabled()).toBe(false);
    });

    it('buyingDisabled (warning mode) is true under fh campaign mode without a leveled trading post', () => {
      enableFh();
      expect(itemManager.buyingDisabled()).toBe(true);
    });

    it('buyingDisabled (warning mode) is false once a non-wrecked trading post is built', () => {
      enableFh();
      gameManager.game.party.buildings = [new BuildingModel('trading-post', 1, 'normal')];
      expect(itemManager.buyingDisabled()).toBe(false);
    });

    it('buyingDisabled (non-warning mode) only reports a specifically wrecked trading post, not a missing one', () => {
      enableFh();
      // no trading post at all: warning mode reports disabled, non-warning mode does not
      expect(itemManager.buyingDisabled(true)).toBe(true);
      expect(itemManager.buyingDisabled(false)).toBe(false);

      // wrecked trading post: both modes report disabled
      gameManager.game.party.buildings = [new BuildingModel('trading-post', 1, 'wrecked')];
      expect(itemManager.buyingDisabled(true)).toBe(true);
      expect(itemManager.buyingDisabled(false)).toBe(true);
    });

    it('craftingDisabled is true only when the craftsman building is wrecked under fh campaign mode', () => {
      enableFh();
      expect(itemManager.craftingDisabled()).toBe(false);
      gameManager.game.party.buildings = [new BuildingModel('craftsman', 1, 'wrecked')];
      expect(itemManager.craftingDisabled()).toBe(true);
    });

    it('brewingDisabled is true only when the alchemist building is wrecked under fh campaign mode', () => {
      enableFh();
      expect(itemManager.brewingDisabled()).toBe(false);
      gameManager.game.party.buildings = [new BuildingModel('alchemist', 1, 'wrecked')];
      expect(itemManager.brewingDisabled()).toBe(true);
    });
  });
});
