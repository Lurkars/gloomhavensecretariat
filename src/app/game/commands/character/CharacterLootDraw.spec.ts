import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CharacterLootDrawCommand } from 'src/app/game/commands/character/CharacterLootDraw';
import { CommandMissingParameterError } from 'src/app/game/commands/Command';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { Loot, LootType } from 'src/app/game/model/data/Loot';

describe('CharacterLootDrawCommand', () => {
  beforeEach(() => {
    resetTestGame();
    settingsManager.settings.lootDeck = true;
  });

  describe('checkParameters', () => {
    it('throws CommandMissingParameterError when number is missing', () => {
      expect(() => new CharacterLootDrawCommand().checkParameters()).toThrow(CommandMissingParameterError);
    });
  });

  describe('validParameters', () => {
    it('rejects when the lootDeck setting is disabled', () => {
      const character = createTestCharacter(1);
      character.active = true;
      gameManager.game.lootDeck.cards = [new Loot(LootType.money, 1, 10, 8, 5)];
      settingsManager.settings.lootDeck = false;
      const command = new CharacterLootDrawCommand(character.number);
      expect(command.validParameters(character.number)).toBe(false);
    });

    it('rejects when the loot deck has no cards', () => {
      const character = createTestCharacter(1);
      character.active = true;
      gameManager.game.lootDeck.cards = [];
      const command = new CharacterLootDrawCommand(character.number);
      expect(command.validParameters(character.number)).toBe(false);
    });

    it('rejects when the character is not active', () => {
      const character = createTestCharacter(1);
      character.active = false;
      gameManager.game.lootDeck.cards = [new Loot(LootType.money, 1, 10, 8, 5)];
      const command = new CharacterLootDrawCommand(character.number);
      expect(command.validParameters(character.number)).toBe(false);
    });

    it('rejects when no character with the given number exists', () => {
      gameManager.game.lootDeck.cards = [new Loot(LootType.money, 1, 10, 8, 5)];
      const command = new CharacterLootDrawCommand(999);
      expect(command.validParameters(999)).toBe(false);
    });

    it('accepts an active character when the loot deck has cards and lootDeck setting is on', () => {
      const character = createTestCharacter(1);
      character.active = true;
      gameManager.game.lootDeck.cards = [new Loot(LootType.money, 1, 10, 8, 5)];
      const command = new CharacterLootDrawCommand(character.number);
      expect(command.validParameters(character.number)).toBe(true);
    });
  });

  describe('executeWithParameters', () => {
    it('draws the next card from the loot deck and applies its value to the character', () => {
      const character = createTestCharacter(1);
      character.active = true;
      gameManager.game.lootDeck.cards = [new Loot(LootType.money, 1, 10, 8, 5)];
      gameManager.game.lootDeck.current = -1;

      new CharacterLootDrawCommand(character.number).execute();

      expect(gameManager.game.lootDeck.current).toBe(0);
      // single-character party -> 2P value column (5) is used
      expect(character.loot).toBe(5);
      expect(character.lootCards).toContain(0);
    });
  });

  describe('before', () => {
    it('returns the default command label including the character name', () => {
      const character = createTestCharacter(1);
      const command = new CharacterLootDrawCommand(character.number);
      const before = command.before();
      expect(before[0]).toBe('command.character.loot.draw');
    });

    it('returns an "invalid" label when the character cannot be resolved', () => {
      const command = new CharacterLootDrawCommand(999);
      expect(command.before()).toEqual(['command.invalid.character.loot.draw', 999]);
    });
  });
});
