import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { BuildingModel } from 'src/app/game/model/Building';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { AdditionalIdentifier, CountIdentifier, Identifier } from 'src/app/game/model/data/Identifier';
import { ItemData, ItemFlags, ItemSlot } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';
import { PersonalQuest, PersonalQuestAutotrackType, PersonalQuestRequirement } from 'src/app/game/model/data/PersonalQuest';

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
    gameManager.editionManager.editionData = [];
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
      itemManager.grantItem(item, character);
      expect(character.progress.items).toEqual([{ name: '5', edition: 'gh' } as any]);
    });

    it('adds a specialFh item to party.specialItems instead of the character', () => {
      const character = buildCharacter();
      const item = buildItem({ id: 9, specialFh: ['x'] });
      itemManager.grantItem(item, character);
      expect(character.progress.items).toEqual([]);
      expect(gameManager.game.party.specialItems.length).toEqual(1);
    });

    it('removeItem drops the item and any equipped-item reference', () => {
      const character = buildCharacter();
      const item = buildItem({ id: 5 });
      itemManager.grantItem(item, character);
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
      itemManager.grantItem(item, character);
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

  describe('item action checks', () => {
    beforeEach(() => {
      gameManager.game.state = GameState.draw;
      gameManager.game.round = 0;
    });

    it('adds items only within the available count unless forced, never twice', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      const item = buildItem({ id: 5, count: 0 });
      expect(itemManager.addItem(item, character)).toBe(false);
      expect(itemManager.addItem(item, character, true)).toBe(true);
      expect(itemManager.addItem(item, character, true)).toBe(false);
      expect(itemManager.addItem(buildItem({ id: 6 }), buildCharacter('spellweaver'), true)).toBe(false);
    });

    it('buys and crafts only when allowed', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      character.progress.gold = 0;
      expect(itemManager.buyItem(buildItem({ id: 5, cost: 10, count: 1 }), character)).toBe(false);
      expect(itemManager.craftItem(buildItem({ id: 6, resources: { [LootType.lumber]: 1 }, count: 1 }), character)).toBe(false);
      expect(character.progress.items).toEqual([]);
    });

    it('distills only owned items into one of their resources', () => {
      const character = buildCharacter();
      const item = buildItem({ id: 5, resources: { [LootType.axenut]: 1 } });
      itemManager.grantItem(item, character);
      gameManager.buildingsManager.distillAvailable = true;
      expect(itemManager.distillItem(item, character, LootType.lumber)).toBe(false);
      expect(itemManager.distillItem(item, character, LootType.axenut)).toBe(true);
      expect(character.progress.loot[LootType.axenut]).toBe(1);
      expect(itemManager.owned(item, character)).toBe(false);
      expect(itemManager.distillItem(item, character, LootType.axenut)).toBe(false);
      gameManager.buildingsManager.distillAvailable = false;
    });

    it('shares items only with the house rule and to characters without the item', () => {
      const character = buildCharacter('brute');
      const target = buildCharacter('spellweaver');
      gameManager.game.figures = [character, target];
      const item = buildItem({ id: 5 });
      itemManager.grantItem(item, character);
      settingsManager.settings.characterItemsShareHouseRule = false;
      expect(itemManager.shareItem(item, character, target)).toBe(false);
      settingsManager.settings.characterItemsShareHouseRule = true;
      expect(itemManager.canShareItem(item, character, character)).toBe(false);
      expect(itemManager.shareItem(item, character, target)).toBe(true);
      expect(itemManager.owned(item, target)).toBe(true);
      expect(itemManager.shareItem(item, character, target)).toBe(false);
      settingsManager.settings.characterItemsShareHouseRule = false;
    });

    it('sells and removes only owned items', () => {
      const character = buildCharacter();
      const item = buildItem({ id: 5 });
      expect(itemManager.removeItem(item, character)).toBe(false);
      itemManager.grantItem(item, character);
      expect(itemManager.canSellItem(item, character)).toBe(false);
      expect(itemManager.removeItem(item, character)).toBe(true);
    });

    it('equips only during setup unless forced', () => {
      const character = buildCharacter();
      const item = buildItem({ id: 5 });
      expect(itemManager.canToggleEquippedItem(item, character)).toBe(false);
      itemManager.grantItem(item, character);
      gameManager.game.state = GameState.next;
      expect(itemManager.toggleEquippedItem(item, character)).toBe(false);
      expect(itemManager.toggleEquippedItem(item, character, true)).toBe(true);
      gameManager.game.state = GameState.draw;
      expect(itemManager.toggleEquippedItem(item, character)).toBe(true);
    });
  });

  describe('brewingBlocked', () => {
    afterEach(() => {
      gameManager.game.state = GameState.draw;
      gameManager.game.round = 0;
    });

    it('follows brewingDisabled outside a scenario and blocks while a scenario is running', () => {
      gameManager.game.state = GameState.draw;
      gameManager.game.round = 0;
      expect(itemManager.brewingBlocked()).toBe(itemManager.brewingDisabled());
      gameManager.game.state = GameState.next;
      expect(itemManager.brewingBlocked()).toBe(true);
    });
  });

  describe('owned / isEquipped', () => {
    it('owned is true once addItem has been called for that item', () => {
      const character = buildCharacter();
      const item = buildItem({ id: 7 });
      expect(itemManager.owned(item, character)).toBe(false);
      itemManager.grantItem(item, character);
      expect(itemManager.owned(item, character)).toBe(true);
    });
  });

  describe('assigned', () => {
    it('counts items across all character figures and party.specialItems', () => {
      const item = buildItem({ id: 5 });
      const characterA = buildCharacter('brute');
      const characterB = buildCharacter('spellweaver');
      itemManager.grantItem(item, characterA);
      itemManager.grantItem(item, characterB);
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
      gameManager.editionManager.editionData = [new EditionData('fh', [], [], [], [], [], [])];
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

  describe('drawRandomItemsBatch', () => {
    const shopItem = buildItem({ id: 3 });
    const randomItem = buildItem({ id: 95, random: true });

    beforeEach(() => {
      gameManager.game.party.unlockedItems = [];
      vi.spyOn(itemManager, 'getItems').mockReturnValue([shopItem, randomItem]);
      vi.spyOn(gameManager.editionManager, 'isEditionRelevant').mockReturnValue(true);
    });

    afterEach(() => vi.restoreAllMocks());

    it('draws only random items without a range', () => {
      expect(itemManager.drawRandomItemsBatch('gh', 5)).toEqual([randomItem]);
    });

    it('draws every item of an explicit range', () => {
      expect(itemManager.drawRandomItemsBatch('gh', 5, false, 1, 10)).toEqual([shopItem]);
      expect(itemManager.drawRandomItemsBatch('gh', 5, false, 94, 100)).toEqual([randomItem]);
    });
  });

  describe('brewing potions', () => {
    const mixed = buildItem({ id: 1, requiredBuilding: 'alchemist', requiredBuildingLevel: 1, resources: undefined });
    const healing = buildItem({
      id: 2,
      requiredBuilding: 'alchemist',
      requiredBuildingLevel: 1,
      resources: { [LootType.arrowvine]: 1, [LootType.axenut]: 1 }
    });
    const strong = buildItem({
      id: 3,
      requiredBuilding: 'alchemist',
      requiredBuildingLevel: 3,
      resources: { [LootType.arrowvine]: 1, [LootType.axenut]: 1, [LootType.corpsecap]: 1 }
    });

    beforeEach(() => {
      vi.spyOn(itemManager, 'getItems').mockReturnValue([mixed, healing, strong]);
    });

    afterEach(() => vi.restoreAllMocks());

    it('finds the potion of a recipe', () => {
      expect(itemManager.brewedItem([LootType.arrowvine])).toBeUndefined();
      expect(itemManager.brewedItem([LootType.axenut, LootType.arrowvine])).toBe(healing);
      expect(itemManager.brewedItem([LootType.axenut, LootType.axenut])).toBe(mixed);
      expect(itemManager.brewedItem([LootType.corpsecap, LootType.axenut, LootType.arrowvine])).toBe(strong);
    });

    it('pays herbs from the brewer first and brews for the target', () => {
      const brewer = buildCharacter('brute');
      const target = buildCharacter('tinkerer');
      brewer.progress.loot = { [LootType.axenut]: 1 };
      gameManager.game.party.loot = { [LootType.axenut]: 2, [LootType.arrowvine]: 1 };
      const payment = itemManager.brewPayment(brewer, [LootType.axenut, LootType.axenut]);
      expect(payment).toEqual({ characterSpent: { [LootType.axenut]: 1 }, partySpent: { [LootType.axenut]: 1 } });

      gameManager.game.figures = [brewer, target];
      const recipe = [LootType.axenut, LootType.axenut];
      expect(itemManager.canBrewPotion(recipe, target, brewer, { [LootType.axenut]: 2 }, {})).toBe(false);
      expect(itemManager.canBrewPotion(recipe, target, brewer, payment.characterSpent, {})).toBe(false);
      const grantItem = vi.spyOn(itemManager, 'grantItem').mockImplementation(() => {});
      expect(itemManager.brewPotion(recipe, target, brewer, payment.characterSpent, payment.partySpent)).toBe(mixed);
      expect(brewer.progress.loot[LootType.axenut]).toBe(0);
      expect(gameManager.game.party.loot[LootType.axenut]).toBe(1);
      expect(itemManager.unlockedItem(mixed)).toBeDefined();
      expect(grantItem).toHaveBeenCalledWith(mixed, target);
    });

    it('brews without payment only with force and never for an owner of the potion', () => {
      const target = buildCharacter('tinkerer');
      gameManager.game.figures = [target];
      gameManager.game.party.loot = {};
      const recipe = [LootType.axenut, LootType.arrowvine];
      expect(itemManager.brewPotion(recipe, target)).toBeUndefined();
      expect(itemManager.brewPotion(recipe, target, undefined, {}, {}, true)).toBe(healing);
      expect(itemManager.canBrewPotion(recipe, target, undefined, {}, {}, true)).toBe(false);
      expect(itemManager.canBrewPotion([LootType.arrowvine], target, undefined, {}, {}, true)).toBe(false);
    });
  });

  describe('brewingHerbs', () => {
    function enableFh() {
      gameManager.editionManager.editionData = [new EditionData('fh', [], [], [], [], [], [])];
      settingsManager.settings.editions = ['fh'];
      gameManager.game.edition = 'fh';
      gameManager.game.party.campaignMode = true;
    }

    it('is 0 without fh campaign rules or an alchemist', () => {
      expect(itemManager.brewingHerbs()).toEqual(0);
      enableFh();
      expect(itemManager.brewingHerbs()).toEqual(0);
      gameManager.game.party.buildings = [new BuildingModel('alchemist', 0, 'normal')];
      expect(itemManager.brewingHerbs()).toEqual(0);
    });

    it('is 2 herbs for alchemist level 1-2 and 3 herbs from level 3', () => {
      enableFh();
      gameManager.game.party.buildings = [new BuildingModel('alchemist', 2, 'normal')];
      expect(itemManager.brewingHerbs()).toEqual(2);
      gameManager.game.party.buildings = [new BuildingModel('alchemist', 3, 'normal')];
      expect(itemManager.brewingHerbs()).toEqual(3);
    });
  });

  describe('canAdd / canBuy / canCraft', () => {
    beforeEach(() => {
      gameManager.game.party.loot = {};
      vi.spyOn(itemManager, 'isItemAvailable').mockReturnValue(true);
    });

    afterEach(() => vi.restoreAllMocks());

    it('canAdd is true for an available item the character does not own yet', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      expect(itemManager.canAdd(buildItem({ id: 1, count: 1 }), character)).toBe(true);
    });

    it('canAdd is false once the item is fully assigned or owned', () => {
      const characterA = buildCharacter();
      const characterB = buildCharacter();
      const item = buildItem({ id: 1, count: 1 });
      characterA.progress.items = [new Identifier(1, 'gh')];
      gameManager.game.figures = [characterA, characterB];
      expect(itemManager.canAdd(item, characterA)).toBe(false);
      expect(itemManager.canAdd(item, characterB)).toBe(false);
    });

    it('canBuy depends on gold and availability', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      const item = buildItem({ id: 1, count: 1, cost: 10 });
      character.progress.gold = 20;
      expect(itemManager.canBuy(item, character)).toBe(true);
      character.progress.gold = 5;
      expect(itemManager.canBuy(item, character)).toBe(false);
    });

    it('canCraft uses party resources only for herbs unless fhShareResources is set', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      gameManager.game.party.loot = { [LootType.rockroot]: 3, [LootType.lumber]: 3 };
      settingsManager.settings.fhShareResources = false;
      expect(itemManager.canCraft(buildItem({ id: 1, count: 1, resources: { [LootType.rockroot]: 3 } }), character)).toBe(true);
      expect(itemManager.canCraft(buildItem({ id: 2, count: 1, resources: { [LootType.lumber]: 3 } }), character)).toBe(false);
      settingsManager.settings.fhShareResources = true;
      expect(itemManager.canCraft(buildItem({ id: 2, count: 1, resources: { [LootType.lumber]: 3 } }), character)).toBe(true);
      settingsManager.settings.fhShareResources = false;
    });
  });

  describe('crafting with a required item to buy', () => {
    afterEach(() => vi.restoreAllMocks());

    it('allows buying a missing required item and pays its cost', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      character.progress.gold = 10;
      const required = buildItem({ id: 10, cost: 8, count: 1 });
      const item = buildItem({ id: 15, requiredItems: [10], count: 1 });
      vi.spyOn(itemManager, 'getItem').mockImplementation((id) => (+id === 10 ? required : undefined));
      vi.spyOn(itemManager, 'pricerModifier').mockReturnValue(0);
      vi.spyOn(itemManager, 'countAvailable').mockReturnValue(1);
      expect(itemManager.canCraft(item, character)).toBe(true);
      expect(itemManager.craftItem(item, character)).toBe(true);
      expect(character.progress.gold).toBe(2);
      expect(itemManager.owned(item, character)).toBe(true);
    });
  });

  describe('craftItem / craftItemResources', () => {
    afterEach(() => {
      settingsManager.settings.fhShareResources = false;
    });

    it('spends character resources and adds the item', () => {
      const character = buildCharacter();
      character.progress.loot = { [LootType.lumber]: 5 };
      const item = buildItem({ id: 1, resources: { [LootType.lumber]: 3 } });
      itemManager.craftItem(item, character);
      expect(character.progress.loot[LootType.lumber]).toEqual(2);
      expect(itemManager.owned(item, character)).toBe(true);
    });

    it('takes material resources from the party when fhShareResources is set and the character lacks them', () => {
      settingsManager.settings.fhShareResources = true;
      const character = buildCharacter();
      character.progress.loot = { [LootType.lumber]: 1 };
      gameManager.game.party.loot = { [LootType.lumber]: 5 };
      itemManager.craftItemResources(buildItem({ id: 1, resources: { [LootType.lumber]: 3 } }), character);
      expect(character.progress.loot[LootType.lumber]).toEqual(1);
      expect(gameManager.game.party.loot[LootType.lumber]).toEqual(2);
    });

    it('spends "any herb" resources from the herb with the most available', () => {
      const character = buildCharacter();
      character.progress.loot = { [LootType.axenut]: 1 };
      gameManager.game.party.loot = { [LootType.axenut]: 2, [LootType.rockroot]: 1 };
      itemManager.craftItemResources(buildItem({ id: 1, resourcesAny: [{ herb_resources: 2 }] as any }), character);
      expect(character.progress.loot[LootType.axenut]).toEqual(0);
      expect(gameManager.game.party.loot[LootType.axenut]).toEqual(1);
    });
  });

  describe('craftItem ("craftableItems" tracking)', () => {
    function assignPersonalQuest(character: Character, autotrack: string) {
      character.progress.personalQuest = 'PQ1';
      character.progress.personalQuestAutotrack = true;
      gameManager.editionManager.editionData = [
        Object.assign(new EditionData('gh', [], [], [], [], [], []), {
          personalQuests: [
            Object.assign(new PersonalQuest(), {
              cardId: 'PQ1',
              edition: 'gh',
              requirements: [Object.assign(new PersonalQuestRequirement(), { counter: 5, autotrack })]
            })
          ]
        })
      ];
      settingsManager.settings.editions = ['gh'];
    }

    it('bumps "craftableItems" whenever a character crafts an item', () => {
      const character = buildCharacter();
      character.progress.loot = { [LootType.lumber]: 5 };
      assignPersonalQuest(character, PersonalQuestAutotrackType.craftableItems);
      const item = buildItem({ resources: { [LootType.lumber]: 3 } });

      itemManager.craftItem(item, character);

      expect(character.progress.personalQuestProgress[0]).toEqual(1);
    });

    it('tracks "gold" with the sell value when selling an item', () => {
      const character = buildCharacter();
      assignPersonalQuest(character, PersonalQuestAutotrackType.gold);
      const item = buildItem({ id: 5, cost: 10 });
      itemManager.grantItem(item, character);

      itemManager.sellItem(item, character);

      expect(character.progress.personalQuestProgress[0]).toEqual(5);
    });
  });
});

describe('ItemManager toggleEquippedItem', () => {
  afterEach(() => vi.restoreAllMocks());

  it('keeps tags and markers of the other equipped items', () => {
    const potion = Object.assign(new ItemData(), { id: 9001, edition: 'gh', slot: ItemSlot.small, consumed: true });
    const lootItem = Object.assign(new ItemData(), { id: 9002, edition: 'gh', slot: ItemSlot.legs });
    const helmet = Object.assign(new ItemData(), { id: 9003, edition: 'gh', slot: ItemSlot.head });
    vi.spyOn(gameManager.editionManager, 'itemData').mockReturnValue([potion, lootItem, helmet]);
    const character = new Character(
      Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] }),
      1
    );
    character.progress.equippedItems = [
      new AdditionalIdentifier(9001, 'gh', undefined, undefined, [ItemFlags.consumed]),
      new AdditionalIdentifier(9002, 'gh', undefined, 'loot-random-item')
    ];

    character.progress.items = [new Identifier(9003, 'gh')];
    gameManager.game.state = GameState.draw;
    gameManager.game.round = 0;
    gameManager.itemManager.toggleEquippedItem(helmet, character);

    const equipped = character.progress.equippedItems;
    expect(equipped.map((identifier) => identifier.name)).toEqual(['9001', '9002', '9003']);
    expect(equipped[0].tags).toEqual([ItemFlags.consumed]);
    expect(equipped[1].marker).toEqual('loot-random-item');
  });
});

describe('ItemManager regressions', () => {
  afterEach(() => {
    gameManager.game.figures = [];
  });

  it('assigned does not throw without characters', () => {
    gameManager.game.figures = [];
    expect(gameManager.itemManager.assigned(buildItem())).toBe(0);
  });
});

describe('ItemManager item flags', () => {
  const itemManager = gameManager.itemManager;

  function equippedCharacter(item: ItemData, tags: string[] = []): Character {
    const character = buildCharacter();
    character.progress.items = [new Identifier(item.id, item.edition)];
    character.progress.equippedItems = [new AdditionalIdentifier(item.id, item.edition, undefined, undefined, tags)];
    return character;
  }

  afterEach(() => {
    gameManager.challengesManager.apply = false;
    settingsManager.settings.characterItemsApply = false;
    vi.restoreAllMocks();
  });

  it('sets and clears a flag, clearing slots together with spent', () => {
    const item = buildItem({ id: 1, slot: ItemSlot.body });
    const character = equippedCharacter(item, [ItemFlags.slot]);
    itemManager.setItemFlag(item, character, ItemFlags.spent, true);
    expect(itemManager.equippedItem(item, character)?.tags).toEqual([ItemFlags.slot, ItemFlags.spent]);
    itemManager.setItemFlag(item, character, ItemFlags.spent, false);
    expect(itemManager.equippedItem(item, character)?.tags).toEqual([]);
  });

  it('consumes instead of spending an item while challenge 1507 is active', () => {
    gameManager.challengesManager.apply = true;
    vi.spyOn(gameManager.challengesManager, 'isActive').mockImplementation((cardId) => cardId === 1507);
    const item = buildItem({ id: 1, slot: ItemSlot.body });
    const character = equippedCharacter(item);
    itemManager.setItemFlag(item, character, ItemFlags.spent, true);
    expect(itemManager.equippedItem(item, character)?.tags).toEqual([ItemFlags.consumed]);
  });

  it('blocks flags of small items while challenge 1502 is active unless forced', () => {
    gameManager.challengesManager.apply = true;
    vi.spyOn(gameManager.challengesManager, 'isActive').mockImplementation((cardId) => cardId === 1502);
    const item = buildItem({ id: 1, slot: ItemSlot.small });
    const character = equippedCharacter(item);
    itemManager.setItemFlag(item, character, ItemFlags.consumed, true);
    expect(itemManager.equippedItem(item, character)?.tags).toEqual([]);
    itemManager.setItemFlag(item, character, ItemFlags.consumed, true, true);
    expect(itemManager.equippedItem(item, character)?.tags).toEqual([ItemFlags.consumed]);
  });

  it('marks slots up to an index and spends the item once all slots are marked', () => {
    const item = buildItem({ id: 1, slot: ItemSlot.body, slots: 2, spent: true });
    const character = equippedCharacter(item);
    itemManager.setItemFlagCount(item, character, ItemFlags.slot, 0);
    expect(itemManager.itemFlagCount(item, character, ItemFlags.slot)).toBe(1);
    itemManager.setItemFlagCount(item, character, ItemFlags.slot, 1);
    expect(itemManager.equippedItem(item, character)?.tags).toEqual([ItemFlags.slot, ItemFlags.slot, ItemFlags.spent]);
    itemManager.setItemFlagCount(item, character, ItemFlags.slot, 0);
    expect(itemManager.itemFlagCount(item, character, ItemFlags.slot)).toBe(0);
  });

  it('adds and removes ownership when (un)equipping under bb rules', () => {
    vi.spyOn(gameManager, 'bbRules').mockReturnValue(true);
    const item = buildItem({ id: 1, slot: ItemSlot.body });
    vi.spyOn(gameManager.editionManager, 'itemData').mockReturnValue([item]);
    const character = buildCharacter();
    itemManager.toggleEquippedItemWithOwnership(item, character, true);
    expect(itemManager.owned(item, character)).toBe(true);
    expect(itemManager.isEquipped(item, character)).toBe(true);
    itemManager.toggleEquippedItemWithOwnership(item, character, true);
    expect(itemManager.owned(item, character)).toBe(false);
  });
});

describe('ItemManager unlocked and filtered items', () => {
  const itemManager = gameManager.itemManager;

  beforeEach(() => {
    gameManager.game.party.unlockedItems = [];
    gameManager.game.party.filteredItems = [];
  });

  it('unlocks an item once and locks it again', () => {
    const item = buildItem({ id: 3 });
    itemManager.setItemUnlocked(item, true);
    itemManager.setItemUnlocked(item, true);
    expect(gameManager.game.party.unlockedItems.length).toBe(1);
    expect(itemManager.unlockedItem(item)).toBeDefined();
    itemManager.setItemUnlocked(item, false);
    expect(itemManager.unlockedItem(item)).toBeUndefined();
  });

  it('locks all duplicate unlock entries of an item', () => {
    const item = buildItem({ id: 3 });
    gameManager.game.party.unlockedItems = [new CountIdentifier('3', item.edition), new CountIdentifier('3', item.edition)];
    itemManager.setItemUnlocked(item, false);
    expect(gameManager.game.party.unlockedItems).toEqual([]);
  });

  it('filters an item once and removes the filter again', () => {
    const item = buildItem({ id: 3 });
    itemManager.setItemFiltered(item, true);
    itemManager.setItemFiltered(item, true);
    expect(gameManager.game.party.filteredItems.length).toBe(1);
    expect(itemManager.itemFiltered(item)).toBe(true);
    itemManager.setItemFiltered(item, false);
    expect(itemManager.itemFiltered(item)).toBe(false);
  });
});
