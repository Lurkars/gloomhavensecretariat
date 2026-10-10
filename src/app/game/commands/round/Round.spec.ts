import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { RoundEndAllTurnsCommand, RoundNextCommand, RoundResetCommand } from 'src/app/game/commands/round/Round';
import { GameState } from 'src/app/game/model/Game';

describe('Round commands', () => {
  beforeEach(() => {
    resetTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('RoundNextCommand', () => {
    it('finishes all remaining turns before advancing without turn confirmation', () => {
      const turnConfirmation = settingsManager.settings.turnConfirmation;
      settingsManager.settings.turnConfirmation = false;
      const character = createTestCharacter(1);
      gameManager.game.state = GameState.next;
      const toggleFigure = vi.spyOn(gameManager.roundManager, 'toggleFigure').mockImplementation((figure) => {
        figure.off = true;
      });
      const nextGameState = vi.spyOn(gameManager.roundManager, 'nextGameState').mockImplementation(() => {});

      new RoundNextCommand(1).execute();

      expect(toggleFigure).toHaveBeenCalledWith(character, true);
      expect(nextGameState).toHaveBeenCalled();
      settingsManager.settings.turnConfirmation = turnConfirmation;
    });

    it('draws when drawing is available', () => {
      vi.spyOn(gameManager.roundManager, 'drawAvailable').mockReturnValue(false);
      expect(new RoundNextCommand(1).validParameters(1)).toBe(false);
    });
  });

  describe('RoundEndAllTurnsCommand', () => {
    it('ends the turn of all figures during a round', () => {
      const character = createTestCharacter(1);
      expect(new RoundEndAllTurnsCommand(1).validParameters(1)).toBe(false);
      gameManager.game.state = GameState.next;
      const afterTurn = vi.spyOn(gameManager.roundManager, 'afterTurn').mockImplementation(() => {});
      new RoundEndAllTurnsCommand(1).execute();
      expect(afterTurn).toHaveBeenCalledWith(character);
    });
  });

  describe('RoundResetCommand', () => {
    it('sets, changes and removes the hidden round reset', () => {
      new RoundResetCommand(3).execute();
      expect(gameManager.game.roundResetsHidden).toEqual([3]);
      new RoundResetCommand(5).execute();
      expect(gameManager.game.roundResetsHidden).toEqual([5]);
      new RoundResetCommand(0).execute();
      expect(gameManager.game.roundResetsHidden).toEqual([]);
    });
  });
});
