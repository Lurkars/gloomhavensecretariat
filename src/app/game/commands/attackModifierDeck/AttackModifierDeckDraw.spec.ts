import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { AttackModifierDeckDrawCommand } from 'src/app/game/commands/attackModifierDeck/AttackModifierDeckDraw';
import { CommandExecutionError, CommandMissingParameterError } from 'src/app/game/commands/Command';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { GameState } from 'src/app/game/model/Game';

describe('AttackModifierDeckDrawCommand', () => {
  beforeEach(() => {
    resetTestGame();
    gameManager.game.state = GameState.next;
  });

  describe('checkParameters', () => {
    it('throws CommandMissingParameterError when id is missing', () => {
      const command = new AttackModifierDeckDrawCommand();
      expect(() => command.checkParameters()).toThrow(CommandMissingParameterError);
    });

    it('does not require the state parameter', () => {
      const command = new AttackModifierDeckDrawCommand('m', 1);
      expect(() => command.checkParameters()).not.toThrow();
    });
  });

  describe('validParameters', () => {
    it('accepts "m" (monster deck)', () => {
      const command = new AttackModifierDeckDrawCommand('m', 1);
      expect(command.validParameters('m', 1, undefined as unknown as string)).toBe(true);
    });

    it('accepts "a" (ally deck)', () => {
      const command = new AttackModifierDeckDrawCommand('a', 1);
      expect(command.validParameters('a', 1, undefined as unknown as string)).toBe(true);
    });

    it('accepts an existing character number', () => {
      const character = createTestCharacter(1);
      const command = new AttackModifierDeckDrawCommand(character.number, 1);
      expect(command.validParameters(character.number, 1, undefined as unknown as string)).toBe(true);
    });

    it('rejects an id that is neither m, a, nor an existing character number', () => {
      const command = new AttackModifierDeckDrawCommand(42, 1);
      expect(command.validParameters(42, 1, undefined as unknown as string)).toBe(false);
    });

    it('accepts "advantage" as state', () => {
      const command = new AttackModifierDeckDrawCommand('m', 1, 'advantage');
      expect(command.validParameters('m', 1, 'advantage')).toBe(true);
    });

    it('accepts "disadvantage" as state', () => {
      const command = new AttackModifierDeckDrawCommand('m', 1, 'disadvantage');
      expect(command.validParameters('m', 1, 'disadvantage')).toBe(true);
    });

    it('rejects an invalid state value', () => {
      const command = new AttackModifierDeckDrawCommand('m', 1, 'sideways');
      expect(command.validParameters('m', 1, 'sideways')).toBe(false);
    });
  });

  describe('executeWithParameters', () => {
    it('throws CommandExecutionError when the game state is not "next"', () => {
      gameManager.game.state = GameState.draw;
      const command = new AttackModifierDeckDrawCommand('m', 1);
      expect(() => command.execute()).toThrow(CommandExecutionError);
    });

    it('draws from the monster attack modifier deck', () => {
      const command = new AttackModifierDeckDrawCommand('m', 1);
      expect(gameManager.game.monsterAttackModifierDeck.current).toBe(-1);
      command.execute();
      expect(gameManager.game.monsterAttackModifierDeck.current).toBe(0);
    });

    it('draws from the ally attack modifier deck', () => {
      const command = new AttackModifierDeckDrawCommand('a', 1);
      command.execute();
      expect(gameManager.game.allyAttackModifierDeck.current).toBe(0);
    });

    it('draws from a character attack modifier deck identified by number', () => {
      const character = createTestCharacter(3);
      const command = new AttackModifierDeckDrawCommand(character.number, 1);
      command.execute();
      expect(character.attackModifierDeck.current).toBe(0);
    });

    it('draws with advantage, marking the deck state', () => {
      const command = new AttackModifierDeckDrawCommand('m', 1, 'advantage');
      command.execute();
      expect(gameManager.game.monsterAttackModifierDeck.state).toBe('advantage');
    });

    it('draws with disadvantage, marking the deck state', () => {
      const command = new AttackModifierDeckDrawCommand('m', 1, 'disadvantage');
      command.execute();
      expect(gameManager.game.monsterAttackModifierDeck.state).toBe('disadvantage');
    });

    it('a plain draw leaves the deck state undefined', () => {
      const command = new AttackModifierDeckDrawCommand('m', 1);
      command.execute();
      expect(gameManager.game.monsterAttackModifierDeck.state).toBeUndefined();
    });
  });

  describe('before', () => {
    it('returns the default command label with parameters', () => {
      const command = new AttackModifierDeckDrawCommand('m', 1, 'advantage');
      expect(command.before()).toEqual(['command.attackModifierDeck.draw', 'm', 1, 'advantage']);
    });
  });
});
