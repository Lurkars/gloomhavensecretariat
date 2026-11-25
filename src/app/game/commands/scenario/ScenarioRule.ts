import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { ScenarioRule, ScenarioRuleIdentifier } from 'src/app/game/model/data/ScenarioRule';

function sameRule(
  identifier: ScenarioRuleIdentifier,
  edition: BASE_TYPE | undefined,
  scenario: BASE_TYPE | undefined,
  index: BASE_TYPE | undefined,
  section: BASE_TYPE | undefined,
  group: BASE_TYPE | undefined
): boolean {
  return (
    identifier.edition === edition &&
    identifier.scenario === scenario &&
    identifier.index === index &&
    !!identifier.section === !!section &&
    (identifier.group || '') === (group || '')
  );
}

function ruleIndex(parameters: (BASE_TYPE | undefined)[]): number {
  const [edition, scenario, index, section, group] = parameters;
  return gameManager.game.scenarioRules.findIndex((model) => sameRule(model.identifier, edition, scenario, index, section, group));
}

function ruleModel(parameters: (BASE_TYPE | undefined)[]): { identifier: ScenarioRuleIdentifier; rule: ScenarioRule } | undefined {
  return gameManager.game.scenarioRules[ruleIndex(parameters)];
}

function appliedRuleIndex(parameters: (BASE_TYPE | undefined)[]): number {
  const [edition, scenario, index, section, group] = parameters;
  return gameManager.game.appliedScenarioRules.findIndex((identifier) => sameRule(identifier, edition, scenario, index, section, group));
}

export class ScenarioRuleApplyCommand extends CommandImpl {
  id: string = 'scenario.rule.apply';
  requiredParameters: number = 5;

  ruleParameters(): (BASE_TYPE | undefined)[] {
    return [...this.parameters.slice(0, 4), this.parameters[5]];
  }

  validParameters(): boolean {
    if (!validSeed(this.parameters[4])) {
      return false;
    }
    const model = ruleModel(this.ruleParameters());
    return !!model && !!gameManager.scenarioRulesManager.getScenarioForRule(model.identifier).scenario;
  }

  executeWithParameters() {
    gameManager.game.seed = this.parameters[4] as number;
    const model = ruleModel(this.ruleParameters());
    const scenario = model && gameManager.scenarioRulesManager.getScenarioForRule(model.identifier).scenario;
    if (model && scenario) {
      const result = gameManager.scenarioRulesManager.applyScenarioRule(model);
      if (result.finish) {
        gameManager.scenarioFinishManager.openFinish(
          result.finish.success,
          result.finish.conclusions.length === 1 ? result.finish.conclusions[0] : undefined
        );
      } else if (result.conclusions.length) {
        gameManager.scenarioFinishManager.openFinish(true, result.conclusions[result.conclusions.length - 1]);
      }
      gameManager.scenarioRulesManager.resolveScenarioRule(model);
    } else {
      this.executionError('scenario rule not found');
    }
  }
}

export class ScenarioRuleHideCommand extends CommandImpl {
  id: string = 'scenario.rule.hide';
  requiredParameters: number = 4;

  validParameters(): boolean {
    return !!ruleModel(this.parameters);
  }

  executeWithParameters() {
    const model = ruleModel(this.parameters);
    if (model) {
      gameManager.scenarioRulesManager.hideScenarioRule(model);
    }
  }
}

export class ScenarioRuleRemoveCommand extends CommandImpl {
  id: string = 'scenario.rule.remove';
  requiredParameters: number = 4;

  validParameters(): boolean {
    return !!ruleModel(this.parameters);
  }

  executeWithParameters() {
    const model = ruleModel(this.parameters);
    if (model) {
      gameManager.scenarioRulesManager.removeScenarioRule(model);
    }
  }
}

export class ScenarioRuleDiscardCommand extends CommandImpl {
  id: string = 'scenario.rule.discard';
  requiredParameters: number = 4;

  validParameters(): boolean {
    return appliedRuleIndex(this.parameters) !== -1;
  }

  executeWithParameters() {
    gameManager.scenarioRulesManager.discardAppliedRule(gameManager.game.appliedScenarioRules[appliedRuleIndex(this.parameters)]);
  }
}

export class ScenarioRuleClearDiscardedCommand extends CommandImpl {
  id: string = 'scenario.rule.clearDiscarded';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return true;
  }

  executeWithParameters() {
    gameManager.scenarioRulesManager.clearDiscardedRules();
  }
}
