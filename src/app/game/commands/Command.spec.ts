import {
  BASE_TYPE,
  CommandExecutionError,
  CommandImpl,
  CommandInvalidParametersError,
  CommandMissingParameterError
} from 'src/app/game/commands/Command';

class TestCommand extends CommandImpl {
  id: string = 'test.command';
  requiredParameters: number = 2;
  executedWith: BASE_TYPE[] | undefined;

  validParameters(a: BASE_TYPE): boolean {
    return a === 'valid';
  }

  executeWithParameters(...parameters: BASE_TYPE[]): void {
    this.executedWith = parameters;
  }
}

class NoParamsCommand extends CommandImpl {
  id: string = 'test.noParams';
  requiredParameters: number = 0;
  executed: boolean = false;

  validParameters(): boolean {
    return true;
  }

  executeWithParameters(): void {
    this.executed = true;
  }
}

describe('CommandImpl', () => {
  describe('constructor', () => {
    it('stores given parameters', () => {
      const command = new TestCommand('valid', 2);
      expect(command.parameters).toEqual(['valid', 2]);
    });

    it('defaults server to false', () => {
      const command = new TestCommand('valid', 2);
      expect(command.server).toBe(false);
    });
  });

  describe('checkParameters', () => {
    it('throws CommandMissingParameterError when a required parameter is missing', () => {
      const command = new TestCommand('valid');
      expect(() => command.checkParameters()).toThrow(CommandMissingParameterError);
    });

    it('reports the index of the first missing parameter', () => {
      const command = new TestCommand();
      try {
        command.checkParameters();
        expect.fail('expected checkParameters to throw');
      } catch (e) {
        expect(e).toBeInstanceOf(CommandMissingParameterError);
        expect((e as CommandMissingParameterError).parameter).toBe(0);
      }
    });

    it('reports the index of a later missing parameter when earlier ones are present', () => {
      const command = new TestCommand('valid');
      try {
        command.checkParameters();
        expect.fail('expected checkParameters to throw');
      } catch (e) {
        expect((e as CommandMissingParameterError).parameter).toBe(1);
      }
    });

    it('does not throw when requiredParameters is 0, even with no parameters given', () => {
      const command = new NoParamsCommand();
      expect(() => command.checkParameters()).not.toThrow();
    });

    it('throws CommandInvalidParametersError when validParameters returns false', () => {
      const command = new TestCommand('invalid', 2);
      expect(() => command.checkParameters()).toThrow(CommandInvalidParametersError);
    });

    it('attaches the parameters to CommandInvalidParametersError', () => {
      const command = new TestCommand('invalid', 2);
      try {
        command.checkParameters();
        expect.fail('expected checkParameters to throw');
      } catch (e) {
        expect(e).toBeInstanceOf(CommandInvalidParametersError);
        expect((e as CommandInvalidParametersError).parameters).toEqual(['invalid', 2]);
      }
    });

    it('does not throw when parameters are present and valid', () => {
      const command = new TestCommand('valid', 2);
      expect(() => command.checkParameters()).not.toThrow();
    });
  });

  describe('execute', () => {
    it('calls executeWithParameters with the stored parameters when valid', () => {
      const command = new TestCommand('valid', 42);
      command.execute();
      expect(command.executedWith).toEqual(['valid', 42]);
    });

    it('throws before calling executeWithParameters when parameters are missing', () => {
      const command = new TestCommand('valid');
      expect(() => command.execute()).toThrow(CommandMissingParameterError);
      expect(command.executedWith).toBeUndefined();
    });

    it('throws before calling executeWithParameters when parameters are invalid', () => {
      const command = new TestCommand('invalid', 2);
      expect(() => command.execute()).toThrow(CommandInvalidParametersError);
      expect(command.executedWith).toBeUndefined();
    });
  });

  describe('executionError', () => {
    it('throws a CommandExecutionError carrying id, parameters and message', () => {
      const command = new TestCommand('valid', 2);
      try {
        command.executionError('boom');
        expect.fail('expected executionError to throw');
      } catch (e) {
        expect(e).toBeInstanceOf(CommandExecutionError);
        expect((e as CommandExecutionError).id).toBe('test.command');
        expect((e as CommandExecutionError).parameters).toEqual(['valid', 2]);
        expect((e as CommandExecutionError).message).toBe('boom');
      }
    });

    it('works without a message', () => {
      const command = new TestCommand('valid', 2);
      try {
        command.executionError();
        expect.fail('expected executionError to throw');
      } catch (e) {
        expect(e).toBeInstanceOf(CommandExecutionError);
      }
    });
  });

  describe('before', () => {
    it('returns the command id prefixed with "command." followed by the parameters', () => {
      const command = new TestCommand('valid', 42);
      expect(command.before()).toEqual(['command.test.command', 'valid', 42]);
    });

    it('reflects an empty parameter list', () => {
      const command = new NoParamsCommand();
      expect(command.before()).toEqual(['command.test.noParams']);
    });
  });

  describe('toString / fromString', () => {
    it('serializes id and parameters as a JSON array', () => {
      const command = new TestCommand('valid', 42);
      expect(command.toString()).toBe(JSON.stringify(['test.command', 'valid', 42]));
    });

    it('round-trips through fromString', () => {
      const command = new TestCommand('valid', 42);
      const serialized = command.toString();
      const restored = new TestCommand();
      restored.fromString(serialized);
      expect(restored.id).toBe('test.command');
      expect(restored.parameters).toEqual(['valid', 42]);
    });
  });
});
