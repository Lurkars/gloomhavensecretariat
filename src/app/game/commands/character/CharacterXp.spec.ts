import { CharacterXpCommand } from 'src/app/game/commands/character/CharacterXp';
import { CommandMissingParameterError } from 'src/app/game/commands/Command';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';

describe('CharacterXpCommand', () => {
  beforeEach(() => {
    resetTestGame();
  });

  describe('checkParameters', () => {
    it('throws CommandMissingParameterError when number or xp is missing', () => {
      expect(() => new CharacterXpCommand().checkParameters()).toThrow(CommandMissingParameterError);
      expect(() => new CharacterXpCommand(1).checkParameters()).toThrow(CommandMissingParameterError);
    });
  });

  describe('validParameters', () => {
    it('rejects xp === 0 (a no-op change)', () => {
      const character = createTestCharacter(1);
      const command = new CharacterXpCommand(character.number, 0);
      expect(command.validParameters(character.number, 0)).toBe(false);
    });

    it('rejects when no character with the given number exists', () => {
      const command = new CharacterXpCommand(999, 1);
      expect(command.validParameters(999, 1)).toBe(false);
    });

    it('accepts a positive xp delta for an existing character', () => {
      const character = createTestCharacter(1);
      const command = new CharacterXpCommand(character.number, 5);
      expect(command.validParameters(character.number, 5)).toBe(true);
    });
  });

  describe('executeWithParameters', () => {
    it('increases experience by the given positive amount', () => {
      const character = createTestCharacter(1);
      character.experience = 10;
      new CharacterXpCommand(character.number, 5).execute();
      expect(character.experience).toBe(15);
    });

    it('decreases experience by the given negative amount', () => {
      const character = createTestCharacter(1);
      character.experience = 10;
      new CharacterXpCommand(character.number, -4).execute();
      expect(character.experience).toBe(6);
    });

    it('clamps experience at 0 (never goes negative)', () => {
      const character = createTestCharacter(1);
      character.experience = 2;
      new CharacterXpCommand(character.number, -10).execute();
      expect(character.experience).toBe(0);
    });
  });

  describe('before', () => {
    it('returns the default command label including the character name and xp delta', () => {
      const character = createTestCharacter(1);
      const command = new CharacterXpCommand(character.number, 5);
      const before = command.before();
      expect(before[0]).toBe('command.character.xp');
      expect(before[2]).toBe(5);
    });

    it('returns an "invalid" label when the character cannot be resolved', () => {
      const command = new CharacterXpCommand(999, 5);
      expect(command.before()).toEqual(['command.invalid.character.xp', 999, 5]);
    });
  });
});
