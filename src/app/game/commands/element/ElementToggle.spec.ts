import { CommandMissingParameterError } from 'src/app/game/commands/Command';
import { resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { ElementToggleCommand } from 'src/app/game/commands/element/ElementToggle';

describe('ElementToggleCommand', () => {
  beforeEach(() => {
    resetTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkParameters', () => {
    it('throws CommandMissingParameterError when element number is missing', () => {
      expect(() => new ElementToggleCommand().checkParameters()).toThrow(CommandMissingParameterError);
    });

    it('throws false when element number is below 1', () => {
      const command = new ElementToggleCommand(0);
      expect(command.validParameters(0)).toBe(false);
    });

    it('throws false when element number is greater 6', () => {
      const command = new ElementToggleCommand(7);
      expect(command.validParameters(7)).toBe(false);
    });
  });

  describe('validParameters', () => {
    it('accepts with a valid element number', () => {
      const command = new ElementToggleCommand(1);
      expect(command.validParameters(1)).toBe(true);
    });
  });
});
