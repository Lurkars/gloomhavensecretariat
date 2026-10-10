import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import {
  LevelAdjustmentCommand,
  LevelBonusCommand,
  LevelCalculationCommand,
  LevelGe5PlayerCommand,
  LevelPlayerCountCommand,
  LevelSetCommand,
  LevelSoloCommand
} from 'src/app/game/commands/level/Level';

describe('Level commands', () => {
  beforeEach(() => {
    resetTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets the scenario level and disables the level calculation', () => {
    const setLevel = vi.spyOn(gameManager.levelManager, 'setLevel').mockImplementation(() => {});
    new LevelSetCommand(4).execute();
    expect(setLevel).toHaveBeenCalledWith(4);
    expect(gameManager.game.levelCalculation).toBe(false);
    expect(new LevelSetCommand(8).validParameters(8)).toBe(false);
  });

  it('recalculates the level when changing calculation values', () => {
    const calculate = vi.spyOn(gameManager.levelManager, 'calculateScenarioLevel').mockImplementation(() => {});
    new LevelCalculationCommand(true).execute();
    new LevelAdjustmentCommand(-1).execute();
    new LevelBonusCommand(1).execute();
    new LevelGe5PlayerCommand(false).execute();
    expect(gameManager.game.levelAdjustment).toBe(-1);
    expect(gameManager.game.bonusAdjustment).toBe(1);
    expect(gameManager.game.ge5Player).toBe(false);
    expect(calculate).toHaveBeenCalledTimes(4);
  });

  it('enables, updates and disables a manual player count', () => {
    new LevelPlayerCountCommand(2).execute();
    expect(gameManager.game.playerCount).toBe(2);
    expect(gameManager.game.levelCalculation).toBe(false);
    new LevelPlayerCountCommand(-1).execute();
    expect(gameManager.game.playerCount).toBe(-1);
    expect(new LevelPlayerCountCommand(0).validParameters(0)).toBe(false);
  });

  it('toggles solo', () => {
    new LevelSoloCommand(true).execute();
    expect(gameManager.game.solo).toBe(true);
  });
});
