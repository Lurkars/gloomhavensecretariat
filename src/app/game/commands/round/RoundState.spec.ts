import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { RoundStateCommand } from 'src/app/game/commands/round/RoundState';
import { GameState } from 'src/app/game/model/Game';

describe('RoundStateCommand', () => {
  beforeEach(() => {
    resetTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkParameters', () => {
    it('never throws (no required parameters, always valid)', () => {
      expect(() => new RoundStateCommand().checkParameters()).not.toThrow();
    });
  });

  describe('executeWithParameters', () => {
    it('delegates to roundManager.nextGameState', () => {
      const spy = vi.spyOn(gameManager.roundManager, 'nextGameState').mockImplementation(() => {});
      new RoundStateCommand().execute();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('actually advances the game state from "next" to "draw"', () => {
      gameManager.game.state = GameState.next;
      new RoundStateCommand().execute();
      expect(gameManager.game.state).toBe(GameState.draw);
    });

    it('increments the round counter when moving from "draw" to "next" (draw available)', () => {
      // drawAvailable() requires at least one figure with positive initiative (or exhausted/absent).
      const character = createTestCharacter(1);
      character.initiative = 50;
      gameManager.game.state = GameState.draw;
      gameManager.game.round = 2;

      new RoundStateCommand().execute();

      expect(gameManager.game.state).toBe(GameState.next);
      expect(gameManager.game.round).toBe(3);
    });
  });

  describe('before', () => {
    it('returns the ".next" label when the current state is "next"', () => {
      gameManager.game.state = GameState.next;
      expect(new RoundStateCommand().before()).toEqual(['command.round.state.next']);
    });

    it('returns the ".draw" label when the current state is "draw"', () => {
      gameManager.game.state = GameState.draw;
      expect(new RoundStateCommand().before()).toEqual(['command.round.state.draw']);
    });
  });
});
