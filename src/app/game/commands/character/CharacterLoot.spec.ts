import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CharacterLootCommand } from 'src/app/game/commands/character/CharacterLoot';
import { CommandMissingParameterError } from 'src/app/game/commands/Command';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';

describe('CharacterLootCommand', () => {
  beforeEach(() => {
    resetTestGame();
    // fhRules() looks at gameManager.game.edition via editionRules('fh'); with no matching editionData
    // registered this is already false, but keep it explicit/robust against fixture changes elsewhere.
    gameManager.game.edition = undefined;
  });

  describe('checkParameters', () => {
    it('throws CommandMissingParameterError when number or loot is missing', () => {
      expect(() => new CharacterLootCommand().checkParameters()).toThrow(CommandMissingParameterError);
      expect(() => new CharacterLootCommand(1).checkParameters()).toThrow(CommandMissingParameterError);
    });
  });

  describe('validParameters', () => {
    it('rejects loot === 0 (a no-op change)', () => {
      const character = createTestCharacter(1);
      const command = new CharacterLootCommand(character.number, 0);
      expect(command.validParameters(character.number, 0)).toBe(false);
    });

    it('rejects when no character with the given number exists', () => {
      const command = new CharacterLootCommand(999, 1);
      expect(command.validParameters(999, 1)).toBe(false);
    });

    it('accepts a positive loot delta for an existing character under non-FH rules', () => {
      const character = createTestCharacter(1);
      const command = new CharacterLootCommand(character.number, 2);
      expect(command.validParameters(character.number, 2)).toBe(true);
    });

    it('rejects any loot change under FH rules', () => {
      const character = createTestCharacter(1);
      vi.spyOn(gameManager, 'fhRules').mockReturnValue(true);
      const command = new CharacterLootCommand(character.number, 2);
      expect(command.validParameters(character.number, 2)).toBe(false);
      vi.restoreAllMocks();
    });
  });

  describe('executeWithParameters', () => {
    it('increases loot by the given positive amount', () => {
      const character = createTestCharacter(1);
      character.loot = 2;
      new CharacterLootCommand(character.number, 3).execute();
      expect(character.loot).toBe(5);
    });

    it('decreases loot by the given negative amount', () => {
      const character = createTestCharacter(1);
      character.loot = 5;
      new CharacterLootCommand(character.number, -2).execute();
      expect(character.loot).toBe(3);
    });

    it('clamps loot at 0 (never goes negative)', () => {
      const character = createTestCharacter(1);
      character.loot = 1;
      new CharacterLootCommand(character.number, -5).execute();
      expect(character.loot).toBe(0);
    });
  });

  describe('before', () => {
    it('returns the default command label including the character name and loot delta', () => {
      const character = createTestCharacter(1);
      const command = new CharacterLootCommand(character.number, 3);
      const before = command.before();
      expect(before[0]).toBe('command.character.loot');
      expect(before[2]).toBe(3);
    });

    it('returns an "invalid" label when the character cannot be resolved', () => {
      const command = new CharacterLootCommand(999, 3);
      expect(command.before()).toEqual(['command.invalid.character.loot', 999, 3]);
    });
  });
});
