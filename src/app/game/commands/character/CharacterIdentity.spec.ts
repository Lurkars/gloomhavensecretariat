import { CharacterIdentityCommand } from 'src/app/game/commands/character/CharacterIdentity';
import { CommandExecutionError, CommandMissingParameterError } from 'src/app/game/commands/Command';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';

describe('CharacterIdentityCommand', () => {
  beforeEach(() => {
    resetTestGame();
  });

  describe('checkParameters', () => {
    it('throws CommandMissingParameterError when number or identity is missing', () => {
      expect(() => new CharacterIdentityCommand().checkParameters()).toThrow(CommandMissingParameterError);
      expect(() => new CharacterIdentityCommand(1).checkParameters()).toThrow(CommandMissingParameterError);
    });
  });

  describe('validParameters', () => {
    it('rejects when no character with the given number exists', () => {
      const command = new CharacterIdentityCommand(999, 0);
      expect(command.validParameters(999, 0)).toBe(false);
    });

    it('rejects a character with no identities', () => {
      const character = createTestCharacter(1);
      character.identities = [];
      const command = new CharacterIdentityCommand(character.number, 0);
      expect(command.validParameters(character.number, 0)).toBe(false);
    });

    it('rejects an identity index out of range', () => {
      const character = createTestCharacter(1);
      character.identities = ['a', 'b'];
      const command = new CharacterIdentityCommand(character.number, 2);
      expect(command.validParameters(character.number, 2)).toBe(false);
    });

    it('rejects a negative identity index', () => {
      const character = createTestCharacter(1);
      character.identities = ['a', 'b'];
      const command = new CharacterIdentityCommand(character.number, -1);
      expect(command.validParameters(character.number, -1)).toBe(false);
    });

    it('accepts a valid identity index', () => {
      const character = createTestCharacter(1);
      character.identities = ['a', 'b'];
      const command = new CharacterIdentityCommand(character.number, 1);
      expect(command.validParameters(character.number, 1)).toBe(true);
    });
  });

  describe('executeWithParameters', () => {
    it('sets the character identity to the given index', () => {
      const character = createTestCharacter(1);
      character.identities = ['a', 'b'];
      character.identity = 0;
      new CharacterIdentityCommand(character.number, 1).execute();
      expect(character.identity).toBe(1);
    });

    it('throws CommandExecutionError when identity index is out of range (bypassing validParameters gate)', () => {
      const character = createTestCharacter(1);
      character.identities = ['a', 'b'];
      const command = new CharacterIdentityCommand(character.number, 1);
      // simulate an internal call to executeWithParameters directly, past checkParameters
      expect(() => command.executeWithParameters(character.number, 5)).toThrow(CommandExecutionError);
    });
  });

  describe('before', () => {
    it('returns a descriptive label including the character name and identity data key', () => {
      const character = createTestCharacter(1);
      character.identities = ['veteran', 'rookie'];
      const command = new CharacterIdentityCommand(character.number, 1);
      const before = command.before();
      expect(before[0]).toBe('command.character.identity');
      expect(before[2]).toBe('data.character.' + character.edition + '.' + character.name + '.rookie');
    });

    it('returns an "invalid" label when the character cannot be resolved', () => {
      const command = new CharacterIdentityCommand(999, 0);
      expect(command.before()).toEqual(['command.invalid.character.identity', 999, 0]);
    });
  });
});
