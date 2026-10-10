import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandInvalidParametersError } from 'src/app/game/commands/Command';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { LootDeckAssignCommand, LootDeckRandomItemCommand, LootDeckSectionCommand } from 'src/app/game/commands/lootDeck/LootDeckAssign';
import {
  LootDeckActiveCommand,
  LootDeckConfigCommand,
  LootDeckFixedCommand,
  LootDeckMoveCommand,
  LootDeckRemoveCardCommand,
  LootDeckShuffleCommand
} from 'src/app/game/commands/lootDeck/LootDeckEdit';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { Loot, LootType } from 'src/app/game/model/data/Loot';

function loot(cardId: number, type: LootType, value: number = 1): Loot {
  return new Loot(type, cardId, value);
}

describe('Loot deck commands', () => {
  beforeEach(() => {
    resetTestGame();
    gameManager.game.lootDeck.cards = [
      loot(1, LootType.money, 2),
      loot(2, LootType.lumber),
      loot(3, LootType.money, 1),
      loot(4, LootType.metal)
    ];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shuffles the deck and drops loot cards of upcoming cards', () => {
    const character = createTestCharacter(1);
    gameManager.game.lootDeck.current = 1;
    character.lootCards = [0, 1];
    new LootDeckShuffleCommand(1).execute();
    expect(gameManager.game.lootDeck.current).toBe(-1);
    expect(character.lootCards).toEqual([]);
  });

  it('shuffles the deck with the same result for the same seed', () => {
    const original = [...gameManager.game.lootDeck.cards];
    new LootDeckShuffleCommand(7).execute();
    const shuffled = gameManager.game.lootDeck.cards.map((loot) => loot.cardId);
    gameManager.game.lootDeck.cards = [...original];
    new LootDeckShuffleCommand(7).execute();
    expect(gameManager.game.lootDeck.cards.map((loot) => loot.cardId)).toEqual(shuffled);
  });

  it('moves a card and remaps character loot cards', () => {
    const character = createTestCharacter(1);
    gameManager.game.lootDeck.current = 1;
    character.lootCards = [1];
    new LootDeckMoveCommand(2, 'discarded', 1).execute();
    expect(gameManager.game.lootDeck.cards[0].cardId).toBe(2);
    expect(character.lootCards).toEqual([0]);
  });

  it('removes a card and remaps character loot cards', () => {
    const character = createTestCharacter(1);
    gameManager.game.lootDeck.current = 2;
    character.lootCards = [0, 2];
    expect(new LootDeckRemoveCardCommand(9).validParameters(9)).toBe(false);
    new LootDeckRemoveCardCommand(1).execute();
    expect(gameManager.game.lootDeck.cards.length).toBe(3);
    expect(gameManager.game.lootDeck.current).toBe(1);
    expect(character.lootCards).toEqual([1]);
  });

  it('sets fixed loot types and the deck visibility', () => {
    new LootDeckFixedCommand(LootType.special1, true).execute();
    new LootDeckFixedCommand(LootType.special1, true).execute();
    expect(gameManager.game.lootDeckFixed).toEqual([LootType.special1]);
    new LootDeckFixedCommand(LootType.special1, false).execute();
    expect(gameManager.game.lootDeckFixed).toEqual([]);
    new LootDeckActiveCommand(true).execute();
    expect(gameManager.game.lootDeck.active).toBe(true);
    new LootDeckActiveCommand(false).execute();
    expect(gameManager.game.lootDeck.active).toBe(false);
  });

  it('applies a loot deck configuration', () => {
    const apply = vi.spyOn(gameManager.lootManager, 'apply').mockImplementation(() => {});
    new LootDeckConfigCommand(42, LootType.money, 12, LootType.lumber, 2).execute();
    expect(apply).toHaveBeenCalledWith(gameManager.game.lootDeck, { money: 12, lumber: 2 });
    expect(gameManager.game.seed).toBe(42);
    expect(new LootDeckConfigCommand(1, LootType.money).validParameters(1)).toBe(false);
    expect(new LootDeckConfigCommand(1, 'gems', 2).validParameters(1)).toBe(false);
    expect(() => new LootDeckConfigCommand('x', LootType.money, 3).checkParameters()).toThrow(CommandInvalidParametersError);
  });

  describe('LootDeckAssignCommand', () => {
    it('assigns a drawn card to a character and moves it to another one', () => {
      const first = createTestCharacter(1);
      const second = createTestCharacter(2);
      gameManager.game.lootDeck.current = 1;
      new LootDeckAssignCommand(1, 1, 1).execute();
      expect(first.lootCards).toEqual([0]);
      expect(first.loot).toBeGreaterThan(0);

      new LootDeckAssignCommand(1, 2, 1).execute();
      expect(first.lootCards).toEqual([]);
      expect(first.loot).toBe(0);
      expect(second.lootCards).toEqual([0]);

      new LootDeckAssignCommand(1, -1, 1).execute();
      expect(second.lootCards).toEqual([]);
    });

    it('rejects upcoming cards', () => {
      createTestCharacter(1);
      expect(new LootDeckAssignCommand(3, 1, 1).validParameters(3, 1, 1)).toBe(false);
    });
  });

  it('applies a random item to a character', () => {
    const character = createTestCharacter(1);
    gameManager.game.lootDeck.cards.push(loot(5, LootType.random_item));
    const item = Object.assign(new ItemData(), { id: 7, edition: 'test', name: 'item7' });
    vi.spyOn(gameManager.itemManager, 'getItem').mockReturnValue(item);
    vi.spyOn(gameManager.itemManager, 'addItemCount').mockImplementation(() => {});
    new LootDeckRandomItemCommand(5, 1, 'test', 7).execute();
    expect(character.lootCards).toEqual([4]);
    expect(character.progress.items.map((identifier) => identifier.name)).toEqual(['7']);
    expect(character.progress.equippedItems[0].marker).toBe('loot-random-item');
  });

  it('sets a loot card section as conclusion', () => {
    vi.spyOn(gameManager, 'currentEdition').mockReturnValue('test');
    new LootDeckSectionCommand('1.1', true).execute();
    expect(gameManager.game.lootDeckSections).toEqual(['1.1']);
    expect(gameManager.game.party.conclusions.map((model) => model.index)).toEqual(['1.1']);
    expect(new LootDeckSectionCommand('1.1', true).validParameters('1.1', true)).toBe(false);
    new LootDeckSectionCommand('1.1', false).execute();
    expect(gameManager.game.party.conclusions).toEqual([]);
  });
});
