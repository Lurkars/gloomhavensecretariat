import { CharacterInitiativeCommand } from 'src/app/game/commands/character/CharacterInitiative';
import { CommandExecutionError, CommandMissingParameterError } from 'src/app/game/commands/Command';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';

describe('CharacterInitiativeCommand', () => {
  beforeEach(() => {
    resetTestGame();
  });

  describe('checkParameters', () => {
    it('throws CommandMissingParameterError when number or initiative is missing', () => {
      expect(() => new CharacterInitiativeCommand().checkParameters()).toThrow(CommandMissingParameterError);
      expect(() => new CharacterInitiativeCommand(1).checkParameters()).toThrow(CommandMissingParameterError);
    });

    it('does not require the longRest parameter', () => {
      const character = createTestCharacter(1);
      expect(() => new CharacterInitiativeCommand(character.number, 30).checkParameters()).not.toThrow();
    });
  });

  describe('validParameters', () => {
    it('rejects an initiative below 0', () => {
      const character = createTestCharacter(1);
      const command = new CharacterInitiativeCommand(character.number, -1, false);
      expect(command.validParameters(character.number, -1, false)).toBe(false);
    });

    it('rejects an initiative above 99', () => {
      const character = createTestCharacter(1);
      const command = new CharacterInitiativeCommand(character.number, 100, false);
      expect(command.validParameters(character.number, 100, false)).toBe(false);
    });

    it('rejects longRest=true with an initiative other than 99', () => {
      const character = createTestCharacter(1);
      const command = new CharacterInitiativeCommand(character.number, 50, true);
      expect(command.validParameters(character.number, 50, true)).toBe(false);
    });

    it('accepts longRest=true together with initiative 99', () => {
      const character = createTestCharacter(1);
      const command = new CharacterInitiativeCommand(character.number, 99, true);
      expect(command.validParameters(character.number, 99, true)).toBe(true);
    });

    it('rejects when no character with the given number exists', () => {
      const command = new CharacterInitiativeCommand(999, 30, false);
      expect(command.validParameters(999, 30, false)).toBe(false);
    });

    it('accepts a plain initiative value with no long rest', () => {
      const character = createTestCharacter(1);
      const command = new CharacterInitiativeCommand(character.number, 30, false);
      expect(command.validParameters(character.number, 30, false)).toBe(true);
    });
  });

  describe('executeWithParameters', () => {
    it('sets initiative and longRest on the character', () => {
      const character = createTestCharacter(1);
      new CharacterInitiativeCommand(character.number, 42, false).execute();
      expect(character.initiative).toBe(42);
      expect(character.longRest).toBe(false);
    });

    it('sets longRest true along with initiative 99', () => {
      const character = createTestCharacter(1);
      new CharacterInitiativeCommand(character.number, 99, true).execute();
      expect(character.initiative).toBe(99);
      expect(character.longRest).toBe(true);
    });

    it('throws CommandExecutionError when longRest is true but initiative is not 99 (bypassing the gate)', () => {
      const character = createTestCharacter(1);
      const command = new CharacterInitiativeCommand(character.number, 99, true);
      expect(() => command.executeWithParameters(character.number, 50, true)).toThrow(CommandExecutionError);
    });

    it('hides initiative when the command runs as a server command', () => {
      const character = createTestCharacter(1);
      character.initiativeVisible = true;
      const command = new CharacterInitiativeCommand(character.number, 42, false);
      command.server = true;
      command.execute();
      expect(character.initiativeVisible).toBe(false);
    });

    it('leaves initiativeVisible untouched when not a server command', () => {
      const character = createTestCharacter(1);
      character.initiativeVisible = true;
      const command = new CharacterInitiativeCommand(character.number, 42, false);
      command.execute();
      expect(character.initiativeVisible).toBe(true);
    });
  });

  describe('before', () => {
    it('returns the default command label with only the character name (no other parameters)', () => {
      const character = createTestCharacter(1);
      const command = new CharacterInitiativeCommand(character.number, 42, false);
      const before = command.before();
      expect(before).toEqual(['command.character.initiative', expect.any(String)]);
    });

    it('returns an "invalid" label when the character cannot be resolved', () => {
      const command = new CharacterInitiativeCommand(999, 42, false);
      expect(command.before()).toEqual(['command.invalid.character.initiative', 999, 42, false]);
    });
  });
});
