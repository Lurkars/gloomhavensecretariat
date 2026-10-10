import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { createTestCharacter, createTestEdition, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import {
  ScenarioCancelCommand,
  ScenarioCustomCommand,
  ScenarioCustomNameCommand,
  ScenarioResetCommand,
  ScenarioRoomCommand,
  ScenarioSectionCommand,
  ScenarioSetCommand
} from 'src/app/game/commands/scenario/Scenario';
import {
  ScenarioRuleClearDiscardedCommand,
  ScenarioRuleDiscardCommand,
  ScenarioRuleHideCommand,
  ScenarioRuleRemoveCommand
} from 'src/app/game/commands/scenario/ScenarioRule';
import { ScenarioTreasureLootCommand, ScenarioTreasureRemoveCommand } from 'src/app/game/commands/scenario/ScenarioTreasure';
import { RoomData } from 'src/app/game/model/data/RoomData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { ScenarioRule, ScenarioRuleIdentifier } from 'src/app/game/model/data/ScenarioRule';
import { Scenario } from 'src/app/game/model/Scenario';

function scenarioData(index: string, overrides: Partial<ScenarioData> = {}): ScenarioData {
  return Object.assign(new ScenarioData(), { index: index, name: 'scenario ' + index, edition: 'test' }, overrides);
}

function ruleModel(once: boolean = false): { identifier: ScenarioRuleIdentifier; rule: ScenarioRule } {
  const identifier = Object.assign(new ScenarioRuleIdentifier(), { edition: 'test', scenario: '1', index: 0 });
  const rule = Object.assign(new ScenarioRule('true'), { once: once });
  return { identifier, rule };
}

describe('Scenario commands', () => {
  beforeEach(() => {
    resetTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ScenarioSetCommand', () => {
    it('sets a scenario of the edition', () => {
      createTestEdition({ scenarios: [scenarioData('1')] });
      const setScenario = vi.spyOn(gameManager.scenarioManager, 'setScenario').mockImplementation(() => {});
      expect(new ScenarioSetCommand('test', '2', 1).validParameters('test', '2', 1)).toBe(false);
      new ScenarioSetCommand('test', '1', 1).execute();
      expect(setScenario).toHaveBeenCalledWith(expect.any(Scenario), false);
      expect(setScenario.mock.calls[0][0]?.index).toBe('1');
    });
  });

  describe('reset, cancel and custom scenarios', () => {
    it('resets the current scenario', () => {
      gameManager.game.scenario = new Scenario(scenarioData('1'));
      const resetScenario = vi.spyOn(gameManager.roundManager, 'resetScenario').mockImplementation(() => {});
      const setScenario = vi.spyOn(gameManager.scenarioManager, 'setScenario').mockImplementation(() => {});
      new ScenarioResetCommand(1).execute();
      expect(resetScenario).toHaveBeenCalled();
      expect(setScenario).toHaveBeenCalledWith(gameManager.game.scenario);
    });

    it('cancels the current scenario', () => {
      expect(new ScenarioCancelCommand().validParameters()).toBe(false);
      gameManager.game.scenario = new Scenario(scenarioData('1'));
      const setScenario = vi.spyOn(gameManager.scenarioManager, 'setScenario').mockImplementation(() => {});
      new ScenarioCancelCommand().execute();
      expect(setScenario).toHaveBeenCalledWith(undefined);
    });

    it('starts a custom scenario, renames and ends it', () => {
      const setScenario = vi.spyOn(gameManager.scenarioManager, 'setScenario').mockImplementation((scenario) => {
        gameManager.game.scenario = scenario;
      });
      new ScenarioCustomCommand(true).execute();
      expect(gameManager.game.scenario?.custom).toBe(true);
      new ScenarioCustomNameCommand('My Scenario').execute();
      expect(gameManager.game.scenario?.name).toBe('My Scenario');
      new ScenarioCustomCommand(false).execute();
      expect(setScenario).toHaveBeenLastCalledWith(undefined);
    });
  });

  describe('rooms and sections', () => {
    it('opens an unrevealed room of the current scenario', () => {
      const room = Object.assign(new RoomData(), { roomNumber: 2, ref: 'B1' });
      gameManager.game.scenario = new Scenario(scenarioData('1', { rooms: [room] }));
      const openRoom = vi.spyOn(gameManager.scenarioManager, 'openRoom').mockImplementation(() => {});
      expect(new ScenarioRoomCommand(3, 1).validParameters(3, 1)).toBe(false);
      new ScenarioRoomCommand(2, 1).execute();
      expect(openRoom).toHaveBeenCalledWith(room, gameManager.game.scenario, false);
      gameManager.game.scenario.revealedRooms = [2];
      expect(new ScenarioRoomCommand(2, 1).validParameters(2, 1)).toBe(false);
    });

    it('adds a section to the current scenario', () => {
      createTestEdition({ sections: [scenarioData('1.1')] });
      gameManager.game.scenario = new Scenario(scenarioData('1'));
      const addSection = vi.spyOn(gameManager.scenarioManager, 'addSection').mockImplementation(() => {});
      new ScenarioSectionCommand('test', '1.1', 1).execute();
      expect(addSection).toHaveBeenCalled();
      expect(new ScenarioSectionCommand('test', '9.9', 1).validParameters('test', '9.9', 1)).toBe(false);
    });
  });

  describe('scenario rules', () => {
    it('hides a rule into the discarded rules', () => {
      const model = ruleModel();
      gameManager.game.scenarioRules = [model];
      expect(new ScenarioRuleHideCommand('test', '1', 0, true).validParameters()).toBe(false);
      new ScenarioRuleHideCommand('test', '1', 0, false).execute();
      expect(gameManager.game.scenarioRules).toEqual([]);
      expect(gameManager.game.discardedScenarioRules).toEqual([model.identifier]);
      expect(new ScenarioRuleHideCommand('test', '1', 0, false).validParameters()).toBe(false);
    });

    it('removes a rule, discarding once rules only', () => {
      const once = ruleModel(true);
      const normal = ruleModel(false);
      normal.identifier.index = 1;
      gameManager.game.scenarioRules = [once, normal];
      new ScenarioRuleRemoveCommand('test', '1', 1, false).execute();
      expect(gameManager.game.scenarioRules).toEqual([once]);
      new ScenarioRuleRemoveCommand('test', '1', 0, false).execute();
      expect(gameManager.game.discardedScenarioRules).toEqual([once.identifier]);

      new ScenarioRuleClearDiscardedCommand().execute();
      expect(gameManager.game.discardedScenarioRules).toEqual([]);
    });

    it('discards an applied rule by identifier', () => {
      const once = ruleModel(true);
      gameManager.game.appliedScenarioRules = [once.identifier];
      vi.spyOn(gameManager.scenarioRulesManager, 'getScenarioForRule').mockReturnValue({
        scenario: Object.assign(scenarioData('1'), { rules: [once.rule] })
      } as never);
      expect(new ScenarioRuleDiscardCommand('test', '1', 0, true).validParameters()).toBe(false);
      new ScenarioRuleDiscardCommand('test', '1', 0, false).execute();
      expect(gameManager.game.appliedScenarioRules).toEqual([]);
      expect(gameManager.game.discardedScenarioRules).toEqual([once.identifier]);
    });
  });

  describe('scenario treasures', () => {
    it('loots a treasure of the scenario and removes it again', () => {
      const character = createTestCharacter(1);
      gameManager.game.scenario = new Scenario(scenarioData('1'));
      vi.spyOn(gameManager.scenarioManager, 'getTreasures').mockReturnValue([5, 'G']);
      vi.spyOn(gameManager.lootManager, 'lootTreasure').mockReturnValue([]);

      new ScenarioTreasureLootCommand(1, 0, 1).execute();
      new ScenarioTreasureLootCommand(1, 1, 1).execute();
      expect(character.treasures).toEqual([5, 'G-1']);
      expect(gameManager.game.party.treasures.map((treasure) => treasure.name)).toEqual(['5']);
      expect(new ScenarioTreasureLootCommand(1, 0, 1).validParameters(1, 0, 1)).toBe(false);

      new ScenarioTreasureRemoveCommand(1, 5).execute();
      expect(character.treasures).toEqual(['G-1']);
      expect(gameManager.game.party.treasures).toEqual([]);
    });
  });
});
