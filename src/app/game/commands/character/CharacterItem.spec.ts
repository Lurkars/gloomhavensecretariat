import { gameManager } from 'src/app/game/businesslogic/GameManager';
import {
  CharacterItemAddCommand,
  CharacterItemBuyCommand,
  CharacterItemDistillCommand,
  CharacterItemEquipCommand,
  CharacterItemRemoveCommand,
  CharacterItemSellCommand,
  CharacterItemShareCommand
} from 'src/app/game/commands/character/CharacterItem';
import { CharacterItemBrewCommand } from 'src/app/game/commands/character/CharacterItemBrew';
import { CharacterItemFlagCommand, CharacterItemFlagCountCommand } from 'src/app/game/commands/character/CharacterItemFlag';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { AdditionalIdentifier, Identifier } from 'src/app/game/model/data/Identifier';
import { ItemData, ItemFlags, ItemSlot } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';

function item(id: number, overrides: Partial<ItemData> = {}): ItemData {
  return Object.assign(new ItemData(), { id: id, name: 'item' + id, edition: 'test', cost: 10, count: 2 }, overrides);
}

describe('Character item commands', () => {
  let items: ItemData[];

  beforeEach(() => {
    resetTestGame();
    items = [item(1), item(2, { slot: ItemSlot.small, slots: 2, spent: true }), item(3, { resources: { [LootType.lumber]: 1 } })];
    vi.spyOn(gameManager.itemManager, 'getItem').mockImplementation((id: number | string, edition: string) =>
      items.find((itemData) => '' + itemData.id === '' + id && itemData.edition === edition)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds and removes an item', () => {
    const character = createTestCharacter(1);
    new CharacterItemAddCommand(1, 'test', 1).execute();
    expect(character.progress.items).toEqual([new Identifier(1, 'test')]);
    expect(new CharacterItemAddCommand(1, 'test', 1).validParameters()).toBe(false);

    new CharacterItemRemoveCommand(1, 'test', 1).execute();
    expect(character.progress.items).toEqual([]);
    expect(new CharacterItemRemoveCommand(1, 'test', 1).validParameters()).toBe(false);
  });

  it('buys an item when affordable', () => {
    const character = createTestCharacter(1);
    vi.spyOn(gameManager.itemManager, 'canBuy').mockImplementation((itemData, buyer) => buyer.progress.gold >= itemData.cost);
    vi.spyOn(gameManager.itemManager, 'pricerModifier').mockReturnValue(0);
    expect(new CharacterItemBuyCommand(1, 'test', 1).validParameters()).toBe(false);
    character.progress.gold = 15;
    new CharacterItemBuyCommand(1, 'test', 1).execute();
    expect(character.progress.gold).toBe(5);
    expect(character.progress.items.length).toBe(1);
  });

  it('sells an owned item', () => {
    const character = createTestCharacter(1);
    character.progress.items.push(new Identifier(1, 'test'));
    vi.spyOn(gameManager.itemManager, 'itemSellValue').mockReturnValue(5);
    new CharacterItemSellCommand(1, 'test', 1).execute();
    expect(character.progress.gold).toBe(5);
    expect(character.progress.items).toEqual([]);
  });

  it('equips an item', () => {
    const character = createTestCharacter(1);
    character.progress.items.push(new Identifier(1, 'test'));
    const toggle = vi.spyOn(gameManager.itemManager, 'toggleEquippedItem').mockImplementation(() => {});
    new CharacterItemEquipCommand(1, 'test', 1, false).execute();
    expect(toggle).not.toHaveBeenCalled();
    new CharacterItemEquipCommand(1, 'test', 1, true).execute();
    expect(toggle).toHaveBeenCalledWith(items[0], character, false);
    expect(new CharacterItemEquipCommand(1, 'test', 2, true).validParameters(1, 'test', 2, true)).toBe(false);
  });

  it('sets and clears a flag of an equipped item', () => {
    const character = createTestCharacter(1);
    const equipped = new AdditionalIdentifier(1, 'test');
    character.progress.equippedItems.push(equipped);
    new CharacterItemFlagCommand(1, 'test', 1, ItemFlags.spent, true).execute();
    new CharacterItemFlagCommand(1, 'test', 1, ItemFlags.spent, true).execute();
    expect(equipped.tags).toEqual([ItemFlags.spent]);
    new CharacterItemFlagCommand(1, 'test', 1, ItemFlags.spent, false).execute();
    expect(equipped.tags).toEqual([]);
    expect(new CharacterItemFlagCommand(1, 'test', 1, ItemFlags.slot, true).validParameters(1, 'test', 1, ItemFlags.slot, true)).toBe(
      false
    );
  });

  it('marks used slots and spends the item when all slots are used', () => {
    const character = createTestCharacter(1);
    const equipped = new AdditionalIdentifier(2, 'test');
    character.progress.equippedItems.push(equipped);
    new CharacterItemFlagCountCommand(1, 'test', 2, ItemFlags.slot, 1).execute();
    expect(equipped.tags).toEqual([ItemFlags.slot, ItemFlags.slot, ItemFlags.spent]);
    new CharacterItemFlagCountCommand(1, 'test', 2, ItemFlags.slot, 0).execute();
    expect(equipped.tags).toEqual([ItemFlags.spent]);
  });

  it('distills an item into a resource', () => {
    const character = createTestCharacter(1);
    character.progress.items.push(new Identifier(3, 'test'));
    vi.spyOn(gameManager.itemManager, 'canDistill').mockReturnValue(true);
    expect(new CharacterItemDistillCommand(1, 'test', 3, LootType.metal).validParameters(1, 'test', 3, LootType.metal)).toBe(false);
    new CharacterItemDistillCommand(1, 'test', 3, LootType.lumber).execute();
    expect(character.progress.items).toEqual([]);
    expect(character.progress.loot[LootType.lumber]).toBe(1);
  });

  it('shares an item with another character', () => {
    const character = createTestCharacter(1);
    const other = createTestCharacter(2);
    character.progress.items.push(new Identifier(1, 'test'));
    new CharacterItemShareCommand(1, 'test', 1, 2).execute();
    expect(character.progress.items).toEqual([]);
    expect(other.progress.items).toEqual([new Identifier(1, 'test')]);
    expect(new CharacterItemShareCommand(2, 'test', 1, 2).validParameters(2, 'test', 1, 2)).toBe(false);
  });

  describe('CharacterItemBrewCommand', () => {
    it('brews a potion from herbs of the brewer and the party supply', () => {
      const brewer = createTestCharacter(1);
      const target = createTestCharacter(2);
      const potion = item(10, {
        requiredBuilding: 'alchemist',
        requiredBuildingLevel: 1,
        resources: { [LootType.arrowvine]: 1, [LootType.axenut]: 1 }
      });
      vi.spyOn(gameManager.itemManager, 'getItems').mockReturnValue([potion]);
      brewer.progress.loot[LootType.arrowvine] = 1;
      gameManager.game.party.loot[LootType.axenut] = 1;

      new CharacterItemBrewCommand(1, 2, LootType.arrowvine, LootType.axenut).execute();

      expect(brewer.progress.loot[LootType.arrowvine]).toBe(0);
      expect(gameManager.game.party.loot[LootType.axenut]).toBe(0);
      expect(target.progress.items).toEqual([new Identifier(10, 'test')]);
      expect(gameManager.game.party.unlockedItems.length).toBe(1);
    });

    it('rejects recipes without enough herbs', () => {
      createTestCharacter(1);
      const potion = item(10, { requiredBuilding: 'alchemist', requiredBuildingLevel: 1, resources: { [LootType.arrowvine]: 2 } });
      vi.spyOn(gameManager.itemManager, 'getItems').mockReturnValue([potion]);
      expect(
        new CharacterItemBrewCommand(1, 1, LootType.arrowvine, LootType.arrowvine).validParameters(
          1,
          1,
          LootType.arrowvine,
          LootType.arrowvine
        )
      ).toBe(false);
    });
  });
});
