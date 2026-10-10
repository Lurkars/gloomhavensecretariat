import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandManager } from 'src/app/game/commands/CommandManager';
import { resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { RoundStateCommand } from 'src/app/game/commands/round/RoundState';
import { GameState } from 'src/app/game/model/Game';

describe('CommandManager', () => {
  let commandManager: CommandManager;

  beforeEach(() => {
    resetTestGame();
    commandManager = new CommandManager();
    vi.spyOn(gameManager.stateManager, 'before').mockImplementation(() => {});
    vi.spyOn(gameManager.stateManager, 'after').mockImplementation(async () => {});
    vi.spyOn(gameManager.stateManager, 'revertLastUndo').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('unknown command', () => {
    it('logs an error and does not throw', () => {
      expect(() => commandManager.execute('nope.unknown', false)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith('Unkown Command', 'nope.unknown', '');
    });

    it('does not call stateManager.before/after for an unknown command', () => {
      commandManager.execute('nope.unknown', false);
      expect(gameManager.stateManager.before).not.toHaveBeenCalled();
      expect(gameManager.stateManager.after).not.toHaveBeenCalled();
    });

    it('does not call revertLastUndo for an unknown command', () => {
      commandManager.execute('nope.unknown', false);
      expect(gameManager.stateManager.revertLastUndo).not.toHaveBeenCalled();
    });
  });

  describe('known command, valid execution', () => {
    it('wraps execution in stateManager.before/after and does not revert', () => {
      gameManager.game.state = GameState.next;
      commandManager.execute('round.state', false, 1);
      expect(gameManager.stateManager.before).toHaveBeenCalledTimes(1);
      expect(gameManager.stateManager.after).toHaveBeenCalledTimes(1);
      expect(gameManager.stateManager.revertLastUndo).not.toHaveBeenCalled();
    });

    it('actually invokes the resolved command (round.state flips next -> draw)', () => {
      gameManager.game.state = GameState.next;
      commandManager.execute('round.state', false, 1);
      expect(gameManager.game.state).toBe(GameState.draw);
    });
  });

  describe('known command, CommandMissingParameterError', () => {
    it('is caught, logged, and reverts the last undo instead of throwing', () => {
      // character.hp requires 2 parameters; give none
      expect(() => commandManager.execute('character.hp', false)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith('Missing Parameter', 'character.hp', 0);
      expect(gameManager.stateManager.revertLastUndo).toHaveBeenCalledTimes(1);
      expect(gameManager.stateManager.after).not.toHaveBeenCalled();
    });
  });

  describe('known command, CommandInvalidParametersError', () => {
    it('is caught, logged, and reverts the last undo instead of throwing', () => {
      // character.hp: no figure with number 999 exists
      expect(() => commandManager.execute('character.hp', false, 999, 5)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith('Invalid Parameters', 'character.hp', [999, 5]);
      expect(gameManager.stateManager.revertLastUndo).toHaveBeenCalledTimes(1);
      expect(gameManager.stateManager.after).not.toHaveBeenCalled();
    });
  });

  describe('known command, CommandExecutionError', () => {
    it('is caught, logged, and reverts the last undo instead of throwing', () => {
      gameManager.game.state = GameState.draw;
      expect(() => commandManager.execute('figure.next', false, 1)).not.toThrow();
      expect(console.error).toHaveBeenCalled();
      const errorCall = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(errorCall[0]).toBeInstanceOf(Error);
      expect(gameManager.stateManager.revertLastUndo).toHaveBeenCalledTimes(1);
      expect(gameManager.stateManager.after).not.toHaveBeenCalled();
    });
  });

  describe('unexpected error types', () => {
    it('rethrows an error that is not one of the documented command error types', () => {
      vi.spyOn(RoundStateCommand.prototype, 'checkParameters').mockImplementation(() => {
        throw new TypeError('boom');
      });
      expect(() => commandManager.execute('round.state', false)).toThrow(TypeError);
    });

    it('still reverts the last undo before rethrowing', () => {
      vi.spyOn(RoundStateCommand.prototype, 'checkParameters').mockImplementation(() => {
        throw new TypeError('boom');
      });
      expect(() => commandManager.execute('round.state', false)).toThrow();
      expect(gameManager.stateManager.revertLastUndo).toHaveBeenCalledTimes(1);
    });
  });

  describe('registry', () => {
    it('registers every command under its own id', () => {
      const ids = commandManager.ids();
      expect(ids.length).toBeGreaterThan(0);
      ids.forEach((id) => {
        expect(commandManager.command(id)?.id).toBe(id);
      });
    });

    it('registers every command class with a unique id', () => {
      const commands = (commandManager as unknown as { commands: unknown[] }).commands;
      expect(commandManager.ids().length).toBe(commands.length);
    });

    it('returns undefined for unknown command ids', () => {
      expect(commandManager.command('nope.unknown')).toBeUndefined();
    });

    it('builds an undo info for every command without parameters', () => {
      commandManager.ids().forEach((id) => {
        const before = commandManager.command(id)?.before() || [];
        expect(before.length).toBeGreaterThan(0);
        expect(typeof before[0]).toBe('string');
      });
    });

    it('uses the command id and the raw parameters as undo info for commands without a custom label', () => {
      const customLabels = [
        'character.condition',
        'character.hp',
        'character.identity',
        'character.initiative',
        'character.loot',
        'character.loot.draw',
        'character.xp',
        'element.toggle',
        'round.state'
      ];
      commandManager
        .ids()
        .filter((id) => !customLabels.includes(id))
        .forEach((id) => {
          expect(commandManager.command(id, 1, 'x')?.before()).toEqual(['command.' + id, 1, 'x']);
        });
    });

    it('rejects every command requiring parameters without parameters, without throwing', () => {
      commandManager
        .ids()
        .filter((id) => (commandManager.command(id) as unknown as { requiredParameters: number }).requiredParameters > 0)
        .forEach((id) => {
          expect(() => commandManager.execute(id, false)).not.toThrow();
          expect(console.error).toHaveBeenLastCalledWith('Missing Parameter', id, 0);
        });
      expect(gameManager.stateManager.after).not.toHaveBeenCalled();
    });
  });
});
