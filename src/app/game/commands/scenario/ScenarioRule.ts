import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { openScenarioFinish } from 'src/app/game/commands/scenario/ScenarioFinish';
import { GameState } from 'src/app/game/model/Game';
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
      const rule = model.rule;
      const identifier = model.identifier;
      if (!rule.alwaysApplyTurn) {
        gameManager.scenarioRulesManager.applyRule(rule, identifier);

        if (rule.rooms) {
          rule.rooms.forEach((roomNumber) => {
            const roomData = scenario.rooms.find((roomData) => roomData.roomNumber === roomNumber);
            if (roomData && gameManager.game.scenario && !gameManager.game.scenario.revealedRooms.includes(roomNumber)) {
              gameManager.scenarioManager.openRoom(roomData, scenario, identifier.section);
            }
          });
        }

        if (rule.sections) {
          gameManager
            .sectionData(scenario.edition)
            .filter(
              (sectionData) =>
                !gameManager.game.sections.find(
                  (active) =>
                    active.edition === sectionData.edition && active.group === scenario.group && active.index === sectionData.index
                ) &&
                sectionData.group === scenario.group &&
                rule.sections.includes(sectionData.index)
            )
            .forEach((sectionData) => {
              if (sectionData.conclusion) {
                openScenarioFinish(true, sectionData);
              } else {
                gameManager.scenarioManager.addSection(sectionData);
              }
            });
        }

        if (rule.finish && ['won', 'lost'].includes(rule.finish) && gameManager.game.scenario) {
          const success = rule.finish === 'won';
          const gameScenario = gameManager.game.scenario;
          const conclusions = success
            ? gameManager.scenarioManager
                .availableSections(true)
                .filter(
                  (sectionData) =>
                    sectionData.edition === gameScenario.edition &&
                    sectionData.parent === gameScenario.index &&
                    sectionData.group === gameScenario.group &&
                    sectionData.conclusion &&
                    gameManager.scenarioManager.getRequirements(sectionData).length === 0
                )
            : [];
          openScenarioFinish(success, conclusions.length === 1 ? conclusions[0] : undefined);
        }
      }

      if (rule.once || rule.alwaysApply || rule.alwaysApplyTurn) {
        gameManager.game.appliedScenarioRules.push(identifier);
      }
      if (rule.active) {
        gameManager.game.activeScenarioRules.push(identifier);
      }
      gameManager.game.scenarioRules.splice(gameManager.game.scenarioRules.indexOf(model), 1);

      if (rule.finish === 'round') {
        gameManager.roundManager.nextGameState();
        if (gameManager.game.state === GameState.next) {
          gameManager.roundManager.nextGameState();
        }
      }
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
    const model = gameManager.game.scenarioRules.splice(ruleIndex(this.parameters), 1)[0];
    gameManager.game.discardedScenarioRules.push(model.identifier);
  }
}

export class ScenarioRuleRemoveCommand extends CommandImpl {
  id: string = 'scenario.rule.remove';
  requiredParameters: number = 4;

  validParameters(): boolean {
    return !!ruleModel(this.parameters);
  }

  executeWithParameters() {
    const model = gameManager.game.scenarioRules.splice(ruleIndex(this.parameters), 1)[0];
    if (model.rule.once || model.rule.alwaysApplyTurn || model.rule.alwaysApply) {
      gameManager.game.discardedScenarioRules.push(model.identifier);
    }
    gameManager.game.activeScenarioRules = gameManager.game.activeScenarioRules.filter(
      (active) =>
        !(
          active.edition === model.identifier.edition &&
          active.scenario === model.identifier.scenario &&
          active.group === model.identifier.group &&
          active.index === model.identifier.index &&
          active.section === model.identifier.section
        )
    );
  }
}

export class ScenarioRuleDiscardCommand extends CommandImpl {
  id: string = 'scenario.rule.discard';
  requiredParameters: number = 4;

  validParameters(): boolean {
    return appliedRuleIndex(this.parameters) !== -1;
  }

  executeWithParameters() {
    const index = appliedRuleIndex(this.parameters);
    const identifier = gameManager.game.appliedScenarioRules[index];
    const scenario = gameManager.scenarioRulesManager.getScenarioForRule(identifier).scenario;
    const rule = scenario && scenario.rules ? scenario.rules[identifier.index] : undefined;
    gameManager.game.appliedScenarioRules.splice(index, 1);
    if (rule && (rule.once || rule.alwaysApplyTurn)) {
      gameManager.game.discardedScenarioRules.push(identifier);
    }
  }
}

export class ScenarioRuleClearDiscardedCommand extends CommandImpl {
  id: string = 'scenario.rule.clearDiscarded';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return true;
  }

  executeWithParameters() {
    gameManager.game.discardedScenarioRules = [];
  }
}
