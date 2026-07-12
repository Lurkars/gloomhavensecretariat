import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CommandExecutionError } from 'src/app/game/commands/Command';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { FigureNextCommand } from 'src/app/game/commands/figure/FigureNext';
import { GameState } from 'src/app/game/model/Game';
import { Summon, SummonColor, SummonState } from 'src/app/game/model/Summon';

// FigureNextCommand's own responsibility is picking *which* figure/summon becomes the next active one;
// the actual toggling mechanics (turn order bookkeeping, undo state, etc.) belong to RoundManager, which
// is covered elsewhere. So `toggleFigure` is spied on (no-op) here to observe what the command decides
// to hand off, without re-exercising RoundManager's own internals.
describe('FigureNextCommand', () => {
  beforeEach(() => {
    resetTestGame();
    gameManager.game.state = GameState.next;
    settingsManager.settings.activeSummons = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function spyToggleFigure() {
    return vi.spyOn(gameManager.roundManager, 'toggleFigure').mockImplementation(() => {});
  }

  function addSummon(character: ReturnType<typeof createTestCharacter>, active: boolean, afterTurn: boolean = false): Summon {
    const summon = new Summon('uuid-' + character.summons.length, 'testsummon', 'card' + character.summons.length, 1, 1, SummonColor.blue);
    summon.state = SummonState.true;
    summon.active = active;
    summon.afterTurn = afterTurn;
    character.summons.push(summon);
    return summon;
  }

  describe('checkParameters / validParameters', () => {
    it('never throws (no required parameters, always valid)', () => {
      expect(() => new FigureNextCommand().checkParameters()).not.toThrow();
    });
  });

  describe('game state gate', () => {
    it('throws CommandExecutionError when the game state is not "next"', () => {
      gameManager.game.state = GameState.draw;
      expect(() => new FigureNextCommand().execute()).toThrow(CommandExecutionError);
    });
  });

  describe('no active figure yet', () => {
    it('forward: activates the first figure that is not off', () => {
      const figure1 = createTestCharacter(1);
      const figure2 = createTestCharacter(2);
      figure1.off = true;
      figure2.off = false;
      const toggleSpy = spyToggleFigure();

      new FigureNextCommand().execute();

      expect(toggleSpy).toHaveBeenCalledTimes(1);
      expect(toggleSpy.mock.calls[0][0]).toBe(figure2);
    });

    it('reverse: activates the last figure in the list, regardless of its "off" state', () => {
      createTestCharacter(1);
      createTestCharacter(2);
      const figure3 = createTestCharacter(3);
      figure3.off = true;
      const toggleSpy = spyToggleFigure();

      new FigureNextCommand().executeWithParameters(true);

      expect(toggleSpy).toHaveBeenCalledTimes(1);
      expect(toggleSpy.mock.calls[0][0]).toBe(figure3);
    });
  });

  describe('forward with an already-active figure', () => {
    it('keeps delegating to roundManager.toggleFigure with the currently active figure', () => {
      const figure1 = createTestCharacter(1);
      createTestCharacter(2);
      figure1.active = true;
      const toggleSpy = spyToggleFigure();

      new FigureNextCommand().executeWithParameters(false);

      expect(toggleSpy).toHaveBeenCalledTimes(1);
      expect(toggleSpy.mock.calls[0][0]).toBe(figure1);
    });

    it('activates afterTurn summons when the active figure has none active yet', () => {
      const figure1 = createTestCharacter(1);
      figure1.active = true;
      const summon = addSummon(figure1, false, true);
      spyToggleFigure();

      new FigureNextCommand().executeWithParameters(false);

      expect(summon.afterTurnActive).toBe(true);
    });

    it('does not touch afterTurn summons when activeSummons setting is disabled', () => {
      settingsManager.settings.activeSummons = false;
      const figure1 = createTestCharacter(1);
      figure1.active = true;
      const summon = addSummon(figure1, false, true);
      spyToggleFigure();

      new FigureNextCommand().executeWithParameters(false);

      expect(summon.afterTurnActive).toBe(false);
    });
  });

  describe('reverse with an active figure at a later index', () => {
    it('moves back to the previous figure when the active figure has no live summons', () => {
      const figure1 = createTestCharacter(1);
      const figure2 = createTestCharacter(2);
      const figure3 = createTestCharacter(3);
      figure3.active = true;
      const toggleSpy = spyToggleFigure();

      new FigureNextCommand().executeWithParameters(true);

      expect(toggleSpy).toHaveBeenCalledTimes(1);
      expect(toggleSpy.mock.calls[0][0]).toBe(figure2);
      // sanity: figure1 was never touched by this decision
      expect(toggleSpy.mock.calls[0][0]).not.toBe(figure1);
    });

    it('stays on figure at index 0 (nothing earlier to step back to)', () => {
      const figure1 = createTestCharacter(1);
      const figure2 = createTestCharacter(2);
      figure1.active = true;
      const toggleSpy = spyToggleFigure();

      new FigureNextCommand().executeWithParameters(true);

      expect(toggleSpy).toHaveBeenCalledTimes(1);
      expect(toggleSpy.mock.calls[0][0]).toBe(figure1);
      expect(toggleSpy.mock.calls[0][0]).not.toBe(figure2);
    });

    it('deactivates all summons and steps back when no summon is active', () => {
      const figure1 = createTestCharacter(1);
      const figure2 = createTestCharacter(2);
      const summon = addSummon(figure2, false);
      figure2.active = true;
      const toggleSpy = spyToggleFigure();

      new FigureNextCommand().executeWithParameters(true);

      expect(summon.active).toBe(false);
      expect(toggleSpy.mock.calls[0][0]).toBe(figure1);
    });

    it('deactivates all summons and steps back when the first (index 0) summon is active', () => {
      const figure1 = createTestCharacter(1);
      const figure2 = createTestCharacter(2);
      const summon0 = addSummon(figure2, true);
      const summon1 = addSummon(figure2, false);
      figure2.active = true;
      const toggleSpy = spyToggleFigure();

      new FigureNextCommand().executeWithParameters(true);

      expect(summon0.active).toBe(false);
      expect(summon1.active).toBe(false);
      expect(toggleSpy.mock.calls[0][0]).toBe(figure1);
    });

    it('stays on the same figure when a non-first summon is active', () => {
      createTestCharacter(1); // establishes figure2 at index 1, otherwise irrelevant to this case
      const figure2 = createTestCharacter(2);
      const summon0 = addSummon(figure2, false);
      const summon1 = addSummon(figure2, true);
      figure2.active = true;
      const toggleSpy = spyToggleFigure();

      new FigureNextCommand().executeWithParameters(true);

      // command does not touch summon.active in this branch - RoundManager.toggleFigure would
      expect(summon0.active).toBe(false);
      expect(summon1.active).toBe(true);
      expect(toggleSpy.mock.calls[0][0]).toBe(figure2);
    });
  });
});
