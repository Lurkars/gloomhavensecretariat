import { CharacterHpCommand } from 'src/app/game/commands/character/CharacterHp';
import { CommandMissingParameterError } from 'src/app/game/commands/Command';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';

describe('CharacterHpCommand', () => {
  beforeEach(() => {
    resetTestGame();
  });

  describe('checkParameters', () => {
    it('throws CommandMissingParameterError when number or hp is missing', () => {
      expect(() => new CharacterHpCommand().checkParameters()).toThrow(CommandMissingParameterError);
      expect(() => new CharacterHpCommand(1).checkParameters()).toThrow(CommandMissingParameterError);
    });
  });

  describe('validParameters', () => {
    it('rejects hp === 0 (a no-op change)', () => {
      const character = createTestCharacter(1);
      const command = new CharacterHpCommand(character.number, 0);
      expect(command.validParameters(character.number, 0)).toBe(false);
    });

    it('rejects when no character with the given number exists', () => {
      const command = new CharacterHpCommand(999, 1);
      expect(command.validParameters(999, 1)).toBe(false);
    });

    it('accepts a positive hp delta for an existing character', () => {
      const character = createTestCharacter(1);
      const command = new CharacterHpCommand(character.number, 3);
      expect(command.validParameters(character.number, 3)).toBe(true);
    });

    it('accepts a negative hp delta for an existing character', () => {
      const character = createTestCharacter(1);
      const command = new CharacterHpCommand(character.number, -3);
      expect(command.validParameters(character.number, -3)).toBe(true);
    });
  });

  describe('executeWithParameters', () => {
    it('increases health by the given positive amount', () => {
      const character = createTestCharacter(1, 1, 10);
      character.health = 5;
      new CharacterHpCommand(character.number, 3).execute();
      expect(character.health).toBe(8);
    });

    it('decreases health by the given negative amount', () => {
      const character = createTestCharacter(1, 1, 10);
      character.health = 5;
      new CharacterHpCommand(character.number, -3).execute();
      expect(character.health).toBe(2);
    });

    it('clamps health to maxHealth via checkHealth (overheal)', () => {
      const character = createTestCharacter(1, 1, 10);
      character.health = 9;
      new CharacterHpCommand(character.number, 5).execute();
      expect(character.health).toBe(10);
    });

    it('marks the character exhausted/off when health drops to 0 or below', () => {
      const character = createTestCharacter(1, 1, 10);
      character.health = 3;
      new CharacterHpCommand(character.number, -10).execute();
      expect(character.health).toBe(-7);
      expect(character.exhausted).toBe(true);
      expect(character.off).toBe(true);
    });

    it('clears exhausted/off once health rises back above 0', () => {
      const character = createTestCharacter(1, 1, 10);
      character.health = 1;
      new CharacterHpCommand(character.number, -5).execute();
      expect(character.exhausted).toBe(true);

      new CharacterHpCommand(character.number, 10).execute();
      expect(character.exhausted).toBe(false);
      expect(character.off).toBe(false);
    });
  });

  describe('before', () => {
    it('returns the default command label including the character name and hp delta', () => {
      const character = createTestCharacter(1);
      const command = new CharacterHpCommand(character.number, 3);
      const before = command.before();
      expect(before[0]).toBe('command.character.hp');
      expect(before[2]).toBe(3);
    });

    it('returns an "invalid" label when the character cannot be resolved', () => {
      const command = new CharacterHpCommand(999, 3);
      expect(command.before()).toEqual(['command.invalid.character.hp', 999, 3]);
    });
  });
});
