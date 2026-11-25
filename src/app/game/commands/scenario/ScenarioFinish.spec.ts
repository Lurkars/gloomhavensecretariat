import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import {
  ScenarioFinishApplyCommand,
  ScenarioFinishBattleGoalCommand,
  ScenarioFinishCloseCommand,
  ScenarioFinishCollectiveGoldCommand,
  ScenarioFinishItemCommand,
  ScenarioFinishOpenCommand,
  ScenarioFinishTrialCommand
} from 'src/app/game/commands/scenario/ScenarioFinish';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { ScenarioData, ScenarioRewards } from 'src/app/game/model/data/ScenarioData';
import { Scenario } from 'src/app/game/model/Scenario';

describe('Scenario finish commands', () => {
  beforeEach(() => {
    resetTestGame();
    gameManager.game.scenario = new Scenario(Object.assign(new ScenarioData(), { index: '1', edition: 'test', name: 'test' }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('orders summary characters with absent characters last', () => {
    const first = createTestCharacter(1);
    const second = createTestCharacter(2);
    first.absent = true;
    expect(gameManager.scenarioFinishManager.summaryCharacters()).toEqual([second, first]);
  });

  it('opens and closes the shared scenario summary', () => {
    createTestCharacter(1);
    new ScenarioFinishOpenCommand(true).execute();
    expect(gameManager.game.finish?.success).toBe(true);
    expect(gameManager.game.finish?.battleGoals).toEqual([0]);
    expect(new ScenarioFinishOpenCommand(true).validParameters(true)).toBe(false);

    new ScenarioFinishCloseCommand().execute();
    expect(gameManager.game.finish).toBeUndefined();
  });

  it('changes the summary state for characters', () => {
    createTestCharacter(1);
    createTestCharacter(2);
    gameManager.trialsManager.trialsEnabled = true;
    vi.spyOn(gameManager.scenarioFinishManager, 'currentFinishRewards').mockReturnValue(
      Object.assign(new ScenarioRewards(), { collectiveGold: 5, items: ['1'] })
    );
    vi.spyOn(gameManager.scenarioFinishManager, 'rewardItems').mockReturnValue({
      items: [Object.assign(new ItemData(), { id: 1, edition: 'test', count: 2 })],
      counts: [1]
    });
    new ScenarioFinishOpenCommand(true).execute();
    new ScenarioFinishBattleGoalCommand(2, 2).execute();
    new ScenarioFinishTrialCommand(1, true).execute();
    new ScenarioFinishCollectiveGoldCommand(2, 5).execute();
    new ScenarioFinishItemCommand(1, 0, true).execute();
    expect(new ScenarioFinishItemCommand(1, 0, true).validParameters(1, 0, true)).toBe(false);
    expect(gameManager.game.finish?.battleGoals).toEqual([0, 2]);
    expect(gameManager.game.finish?.trials).toEqual([true]);
    expect(gameManager.game.finish?.collectiveGold).toEqual([undefined, 5]);
    expect(gameManager.game.finish?.items).toEqual([[0]]);
    expect(new ScenarioFinishItemCommand(2, 0, true).validParameters(2, 0, true)).toBe(false);
    expect(new ScenarioFinishCollectiveGoldCommand(1, 1).validParameters(1, 1)).toBe(false);
    new ScenarioFinishItemCommand(1, 0, false).execute();
    expect(gameManager.game.finish?.items).toEqual([[]]);
    expect(new ScenarioFinishBattleGoalCommand(3, 1).validParameters(3, 1)).toBe(false);
    expect(new ScenarioFinishBattleGoalCommand(1, 3).validParameters(1, 3)).toBe(false);
    gameManager.trialsManager.trialsEnabled = false;
  });

  it('requires an open summary for summary changes', () => {
    createTestCharacter(1);
    expect(new ScenarioFinishBattleGoalCommand(1, 1).validParameters(1, 1)).toBe(false);
  });

  it('applies battle goal checks and finishes the scenario', () => {
    const scenarioRewards = settingsManager.settings.scenarioRewards;
    settingsManager.settings.scenarioRewards = true;
    const character = createTestCharacter(1);
    vi.spyOn(gameManager, 'bbRules').mockReturnValue(false);
    vi.spyOn(gameManager.trialsManager, 'applyTrialCards').mockImplementation(() => {});
    const finishScenario = vi.spyOn(gameManager.scenarioFinishManager, 'finishScenario').mockImplementation(() => {});
    new ScenarioFinishOpenCommand(true).execute();
    new ScenarioFinishBattleGoalCommand(1, 2).execute();

    new ScenarioFinishApplyCommand(1).execute();

    expect(character.progress.battleGoals).toBe(2);
    expect(finishScenario).toHaveBeenCalledWith(gameManager.game.scenario, true, undefined, false, false, expect.any(Boolean), false);
    settingsManager.settings.scenarioRewards = scenarioRewards;
  });
});
