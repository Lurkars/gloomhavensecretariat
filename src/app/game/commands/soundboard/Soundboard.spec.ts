import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { soundboardManager } from 'src/app/game/businesslogic/SoundboardManager';
import { CommandMissingParameterError } from 'src/app/game/commands/Command';
import { CommandManager } from 'src/app/game/commands/CommandManager';
import { resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { SoundboardCommand } from 'src/app/game/commands/soundboard/Soundboard';

describe('SoundboardCommand', () => {
  beforeEach(() => {
    resetTestGame();
    vi.spyOn(soundboardManager, 'play').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is stateless', () => {
    expect(new SoundboardCommand(0).stateless).toBe(true);
  });

  describe('checkParameters', () => {
    it('throws CommandMissingParameterError when index is missing', () => {
      expect(() => new SoundboardCommand().checkParameters()).toThrow(CommandMissingParameterError);
    });
  });

  describe('validParameters', () => {
    it('accepts every sound index', () => {
      soundboardManager.sounds.forEach((_, index) => expect(new SoundboardCommand(index).validParameters(index)).toBe(true));
    });

    it('rejects out of range, non-integer and non-number indices', () => {
      const command = new SoundboardCommand();
      expect(command.validParameters(-1)).toBe(false);
      expect(command.validParameters(soundboardManager.sounds.length)).toBe(false);
      expect(command.validParameters(1.5)).toBe(false);
      expect(command.validParameters('gold' as unknown as number)).toBe(false);
    });
  });

  describe('execute', () => {
    it('plays the sound with the given index', () => {
      new SoundboardCommand(2).execute();
      expect(soundboardManager.play).toHaveBeenCalledWith(2);
    });
  });

  describe('via CommandManager', () => {
    let commandManager: CommandManager;

    beforeEach(() => {
      commandManager = new CommandManager();
      vi.spyOn(gameManager.stateManager, 'before').mockImplementation(() => {});
      vi.spyOn(gameManager.stateManager, 'after').mockImplementation(async () => {});
      vi.spyOn(gameManager.stateManager, 'revertLastUndo').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('plays without touching undo/redo state', () => {
      commandManager.execute('soundboard.play', true, 1);
      expect(soundboardManager.play).toHaveBeenCalledWith(1);
      expect(gameManager.stateManager.before).not.toHaveBeenCalled();
      expect(gameManager.stateManager.after).not.toHaveBeenCalled();
      expect(gameManager.stateManager.revertLastUndo).not.toHaveBeenCalled();
    });

    it('logs invalid parameters without reverting undo', () => {
      expect(() => commandManager.execute('soundboard.play', true, 99)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith('Invalid Parameters', 'soundboard.play', [99]);
      expect(soundboardManager.play).not.toHaveBeenCalled();
      expect(gameManager.stateManager.revertLastUndo).not.toHaveBeenCalled();
    });
  });
});
