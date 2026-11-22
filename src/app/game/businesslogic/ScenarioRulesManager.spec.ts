import { gameManager } from 'src/app/game/businesslogic/Managers';
import { ScenarioRuleModel } from 'src/app/game/businesslogic/ScenarioRulesManager';
import { Element, ElementModel, ElementState } from 'src/app/game/model/data/Element';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { ScenarioRule, ScenarioRuleIdentifier } from 'src/app/game/model/data/ScenarioRule';
import { GameState } from 'src/app/game/model/Game';
import { GameScenarioModel, Scenario } from 'src/app/game/model/Scenario';

// ScenarioRulesManager also covers addScenarioRule()/applyRule()/applyScenarioRulesAlways()
// (deep stateful flows spawning monsters/objectives, applying conditions, and mutating figures).
// This spec sticks to the smaller, clearly-scoped lookups: createErrataRule, getScenarioForRule/
// getScenarioRule, cleanActiveScenarioRules, filterDisabledScenarioRules, and the non-figure
// branches of scenarioRuleActive (round expression, required rules/scenarios, rooms, elements).

function buildScenario(overrides: Partial<ScenarioData> = {}): Scenario {
  return new Scenario(Object.assign(new ScenarioData(), { edition: 'gh', index: '1' }, overrides));
}

describe('ScenarioRulesManager', () => {
  const scenarioRulesManager = gameManager.scenarioRulesManager;

  beforeEach(() => {
    gameManager.game.scenario = undefined;
    gameManager.game.sections = [];
    gameManager.game.round = 1;
    gameManager.game.state = GameState.draw;
    gameManager.game.figures = [];
    gameManager.game.appliedScenarioRules = [];
    gameManager.game.discardedScenarioRules = [];
    gameManager.game.activeScenarioRules = [];
    gameManager.game.scenarioRules = [];
    gameManager.game.party.scenarios = [];
    gameManager.game.elementBoard = [new ElementModel(Element.fire), new ElementModel(Element.ice)];
  });

  describe('apply, resolve, hide and remove scenario rules', () => {
    function setupRule(overrides: Partial<ScenarioRule> = {}): ScenarioRuleModel {
      const rule = Object.assign(new ScenarioRule('true'), overrides);
      gameManager.game.scenario = buildScenario({ rules: [rule] });
      const identifier = Object.assign(new ScenarioRuleIdentifier(), { edition: 'gh', scenario: '1', index: 0, section: false });
      const model = { identifier, rule };
      gameManager.game.scenarioRules = [model];
      return model;
    }

    afterEach(() => vi.restoreAllMocks());

    it('returns conclusions of rule sections and adds other sections', () => {
      const conclusion = Object.assign(new ScenarioData(), { edition: 'gh', index: '10.1', conclusion: true });
      const section = Object.assign(new ScenarioData(), { edition: 'gh', index: '10.2' });
      vi.spyOn(gameManager, 'sectionData').mockReturnValue([conclusion, section]);
      const addSection = vi.spyOn(gameManager.scenarioManager, 'addSection').mockImplementation(() => {});
      vi.spyOn(scenarioRulesManager, 'applyRule').mockImplementation(() => {});
      const model = setupRule({ sections: ['10.1', '10.2'] });

      expect(scenarioRulesManager.ruleSections(model.rule, model.identifier)).toEqual([conclusion, section]);
      const result = scenarioRulesManager.applyScenarioRule(model);
      expect(result.conclusions).toEqual([conclusion]);
      expect(result.finish).toBeUndefined();
      expect(addSection).toHaveBeenCalledWith(section);
    });

    it('returns the finish state of a rule', () => {
      vi.spyOn(scenarioRulesManager, 'applyRule').mockImplementation(() => {});
      vi.spyOn(gameManager.scenarioManager, 'availableSections').mockReturnValue([]);
      const model = setupRule({ finish: 'lost' });
      expect(scenarioRulesManager.applyScenarioRule(model).finish).toEqual({ success: false, conclusions: [] });
    });

    it('does not apply always-apply-turn rules', () => {
      const applyRule = vi.spyOn(scenarioRulesManager, 'applyRule').mockImplementation(() => {});
      const model = setupRule({ alwaysApplyTurn: 'turn' });
      scenarioRulesManager.applyScenarioRule(model);
      expect(applyRule).not.toHaveBeenCalled();
    });

    it('resolves a rule into applied and active rules', () => {
      const model = setupRule({ once: true, active: true });
      scenarioRulesManager.resolveScenarioRule(model);
      expect(gameManager.game.scenarioRules).toEqual([]);
      expect(gameManager.game.appliedScenarioRules).toEqual([model.identifier]);
      expect(gameManager.game.activeScenarioRules).toEqual([model.identifier]);
    });

    it('hides a rule as discarded and removes an active once rule', () => {
      const model = setupRule({ once: true });
      scenarioRulesManager.hideScenarioRule(model);
      expect(gameManager.game.scenarioRules).toEqual([]);
      expect(gameManager.game.discardedScenarioRules).toEqual([model.identifier]);

      gameManager.game.discardedScenarioRules = [];
      gameManager.game.scenarioRules = [model];
      gameManager.game.activeScenarioRules = [model.identifier];
      scenarioRulesManager.removeScenarioRule(model);
      expect(gameManager.game.scenarioRules).toEqual([]);
      expect(gameManager.game.activeScenarioRules).toEqual([]);
      expect(gameManager.game.discardedScenarioRules).toEqual([model.identifier]);
    });

    it('removes a rule replaced by an equal model (e.g. after sync)', () => {
      const model = setupRule({ once: true });
      gameManager.game.scenarioRules = [JSON.parse(JSON.stringify(model))];
      scenarioRulesManager.resolveScenarioRule(model);
      expect(gameManager.game.scenarioRules).toEqual([]);

      gameManager.game.scenarioRules = [JSON.parse(JSON.stringify(model))];
      scenarioRulesManager.hideScenarioRule(model);
      expect(gameManager.game.scenarioRules).toEqual([]);
    });

    it('keeps other rules when the rule is gone', () => {
      const model = setupRule({ once: true });
      const other = { identifier: { ...model.identifier, index: model.identifier.index + 1 }, rule: model.rule };
      gameManager.game.scenarioRules = [other];
      scenarioRulesManager.removeScenarioRule(model);
      expect(gameManager.game.scenarioRules).toEqual([other]);
    });

    it('is applicable and visible for rules with something to do', () => {
      const model = setupRule({ note: 'note' });
      expect(scenarioRulesManager.ruleVisible(0)).toBe(true);
      expect(scenarioRulesManager.ruleApplicable(model.rule)).toBe(false);
      model.rule.finish = 'won';
      expect(scenarioRulesManager.ruleApplicable(model.rule)).toBe(true);
      model.rule.note = '';
      model.rule.finish = undefined as any;
      expect(scenarioRulesManager.ruleVisible(0)).toBe(false);
    });
  });

  describe('createErrataRule', () => {
    it('builds an always-active, once, errata-labeled rule', () => {
      const rule = scenarioRulesManager.createErrataRule('gh', 'note1');
      expect(rule.round).toEqual('true');
      expect(rule.always).toBe(true);
      expect(rule.once).toBe(true);
      expect(rule.note).toEqual('%errata%:&nbsp;%data.custom.gh.errata.note1%');
    });
  });

  describe('getScenarioForRule', () => {
    it('resolves the current scenario for a non-section identifier within rule bounds', () => {
      const scenario = buildScenario({ rules: [new ScenarioRule('true')] });
      gameManager.game.scenario = scenario;
      const identifier = Object.assign(new ScenarioRuleIdentifier(), { edition: 'gh', scenario: '1', index: 0, section: false });
      expect(scenarioRulesManager.getScenarioForRule(identifier)).toEqual({ scenario, section: false });
    });

    it('is undefined when the index is out of bounds', () => {
      const scenario = buildScenario({ rules: [new ScenarioRule('true')] });
      gameManager.game.scenario = scenario;
      const identifier = Object.assign(new ScenarioRuleIdentifier(), { edition: 'gh', scenario: '1', index: 5, section: false });
      expect(scenarioRulesManager.getScenarioForRule(identifier).scenario).toBeUndefined();
    });

    it('resolves a section identifier from game.sections', () => {
      const section = buildScenario({ index: '1.1', rules: [new ScenarioRule('true')] });
      gameManager.game.sections = [section];
      const identifier = Object.assign(new ScenarioRuleIdentifier(), { edition: 'gh', scenario: '1.1', index: 0, section: true });
      expect(scenarioRulesManager.getScenarioForRule(identifier)).toEqual({ scenario: section, section: true });
    });
  });

  describe('getScenarioRule', () => {
    it('returns the rule at the given (non-negative) index', () => {
      const rule = new ScenarioRule('true');
      const scenario = buildScenario({ rules: [rule] });
      gameManager.game.scenario = scenario;
      const identifier = Object.assign(new ScenarioRuleIdentifier(), { edition: 'gh', scenario: '1', index: 0, section: false });
      expect(scenarioRulesManager.getScenarioRule(identifier)).toBe(rule);
    });

    it('builds an errata rule for a negative index', () => {
      const scenario = buildScenario({ errata: 'note1|note2' });
      gameManager.game.scenario = scenario;
      const identifier = Object.assign(new ScenarioRuleIdentifier(), { edition: 'gh', scenario: '1', index: -1, section: false });
      const rule = scenarioRulesManager.getScenarioRule(identifier);
      expect(rule?.note).toEqual('%errata%:&nbsp;%data.custom.gh.errata.note1%');
    });

    it('is undefined when nothing resolves', () => {
      const identifier = Object.assign(new ScenarioRuleIdentifier(), { edition: 'gh', scenario: 'missing', index: 0, section: false });
      expect(scenarioRulesManager.getScenarioRule(identifier)).toBeUndefined();
    });
  });

  describe('filterDisabledScenarioRules', () => {
    it("removes a rule whose identifier is targeted by another active rule's disableRules", () => {
      const targetIdentifier = Object.assign(new ScenarioRuleIdentifier(), {
        edition: 'gh',
        scenario: '1',
        group: undefined,
        index: 1,
        section: false
      });
      const disablingRule = Object.assign(new ScenarioRule('true'), { disableRules: [targetIdentifier] });
      gameManager.game.scenarioRules = [
        {
          identifier: Object.assign(new ScenarioRuleIdentifier(), { edition: 'gh', scenario: '1', index: 0, section: false }),
          rule: disablingRule
        },
        { identifier: targetIdentifier, rule: new ScenarioRule('true') }
      ];
      scenarioRulesManager.filterDisabledScenarioRules();
      expect(gameManager.game.scenarioRules.map((r) => r.identifier.index)).toEqual([0]);
    });

    it('a disableRules index of -1 matches any index in the targeted scenario', () => {
      // the disabling rule lives under a different scenario ('0') so the -1 wildcard,
      // which matches on edition/group/scenario/section, does not also disable itself.
      const disablingRule = Object.assign(new ScenarioRule('true'), {
        disableRules: [Object.assign(new ScenarioRuleIdentifier(), { edition: 'gh', scenario: '1', index: -1, section: false })]
      });
      gameManager.game.scenarioRules = [
        {
          identifier: Object.assign(new ScenarioRuleIdentifier(), { edition: 'gh', scenario: '0', index: 0, section: false }),
          rule: disablingRule
        },
        {
          identifier: Object.assign(new ScenarioRuleIdentifier(), { edition: 'gh', scenario: '1', index: 7, section: false }),
          rule: new ScenarioRule('true')
        }
      ];
      scenarioRulesManager.filterDisabledScenarioRules();
      expect(gameManager.game.scenarioRules.map((r) => r.identifier.scenario)).toEqual(['0']);
    });

    it('keeps rules that are not targeted by any disableRules', () => {
      gameManager.game.scenarioRules = [
        {
          identifier: Object.assign(new ScenarioRuleIdentifier(), { edition: 'gh', scenario: '1', index: 0, section: false }),
          rule: new ScenarioRule('true')
        }
      ];
      scenarioRulesManager.filterDisabledScenarioRules();
      expect(gameManager.game.scenarioRules.length).toEqual(1);
    });
  });

  describe('scenarioRuleActive', () => {
    it('is active when the round expression is true and rule.always is set', () => {
      const rule = Object.assign(new ScenarioRule('true'), { always: true });
      expect(scenarioRulesManager.scenarioRuleActive(rule, 0, false)).toBe(true);
    });

    it('evaluates the round expression against R (game.round)', () => {
      const rule = Object.assign(new ScenarioRule('R>=2'), { always: true });
      gameManager.game.round = 1;
      expect(scenarioRulesManager.scenarioRuleActive(rule, 0, false)).toBe(false);
      gameManager.game.round = 2;
      expect(scenarioRulesManager.scenarioRuleActive(rule, 0, false)).toBe(true);
    });

    it('uses R = round + 1 when rule.start is set', () => {
      const rule = Object.assign(new ScenarioRule('R==2'), { always: true, start: true });
      gameManager.game.round = 1;
      expect(scenarioRulesManager.scenarioRuleActive(rule, 0, false)).toBe(true);
    });

    it('does not re-activate a start rule at the round-1-to-round-2 transition', () => {
      // regression test: game.round is still 1 (not yet incremented) and game.state is still
      // GameState.next when addScenarioRules() runs at the top of the round-2 nextGameState() call
      const rule = Object.assign(new ScenarioRule('R==1'), { start: true });
      gameManager.game.round = 1;
      gameManager.game.state = GameState.next;
      expect(scenarioRulesManager.scenarioRuleActive(rule, 0, false)).toBe(false);
    });

    it('without rule.always, is only active during GameState.next (or start+initial)', () => {
      const rule = new ScenarioRule('true');
      gameManager.game.state = GameState.draw;
      expect(scenarioRulesManager.scenarioRuleActive(rule, 0, false)).toBe(false);

      gameManager.game.state = GameState.next;
      expect(scenarioRulesManager.scenarioRuleActive(rule, 0, false)).toBe(true);
    });

    it('rule.start combined with initial=true activates outside GameState.next', () => {
      const rule = Object.assign(new ScenarioRule('true'), { start: true });
      gameManager.game.state = GameState.draw;
      expect(scenarioRulesManager.scenarioRuleActive(rule, 0, false, true)).toBe(true);
    });

    it('falls back to inactive when the round expression cannot be evaluated', () => {
      const rule = Object.assign(new ScenarioRule('not a valid expr('), { always: true });
      expect(scenarioRulesManager.scenarioRuleActive(rule, 0, false)).toBe(false);
    });

    it('requiredRules must already be in game.appliedScenarioRules', () => {
      const required = Object.assign(new ScenarioRuleIdentifier(), {
        edition: 'gh',
        scenario: '1',
        group: undefined,
        index: 0,
        section: false
      });
      const rule = Object.assign(new ScenarioRule('true'), { always: true, requiredRules: [required] });
      expect(scenarioRulesManager.scenarioRuleActive(rule, 1, false)).toBe(false);

      gameManager.game.appliedScenarioRules = [required];
      expect(scenarioRulesManager.scenarioRuleActive(rule, 1, false)).toBe(true);
    });

    it('requiredScenarios must already be completed in game.party.scenarios', () => {
      const required = new GameScenarioModel('2', 'gh');
      const rule = Object.assign(new ScenarioRule('true'), { always: true, requiredScenarios: [required] });
      expect(scenarioRulesManager.scenarioRuleActive(rule, 0, false)).toBe(false);

      gameManager.game.party.scenarios = [required];
      expect(scenarioRulesManager.scenarioRuleActive(rule, 0, false)).toBe(true);
    });

    it('is inactive once every listed room has already been revealed', () => {
      const scenario = buildScenario({ rules: [] });
      gameManager.game.scenario = scenario;
      const rule = Object.assign(new ScenarioRule('true'), { always: true, rooms: [3] });
      expect(scenarioRulesManager.scenarioRuleActive(rule, 0, false)).toBe(true);

      scenario.revealedRooms = [3];
      expect(scenarioRulesManager.scenarioRuleActive(rule, 0, false)).toBe(false);
    });

    it('elementTrigger requires every listed element to be in the given state', () => {
      gameManager.game.elementBoard = [Object.assign(new ElementModel(Element.fire), { state: ElementState.strong })];
      const met = Object.assign(new ScenarioRule('true'), {
        always: true,
        elementTrigger: [Object.assign(new ElementModel(Element.fire), { state: ElementState.strong })]
      });
      expect(scenarioRulesManager.scenarioRuleActive(met, 0, false)).toBe(true);

      const unmet = Object.assign(new ScenarioRule('true'), {
        always: true,
        elementTrigger: [Object.assign(new ElementModel(Element.ice), { state: ElementState.strong })]
      });
      expect(scenarioRulesManager.scenarioRuleActive(unmet, 0, false)).toBe(false);
    });
  });

  describe('cleanActiveScenarioRules', () => {
    it('keeps only identifiers whose rule still resolves and is active', () => {
      const activeRule = new ScenarioRule('true');
      Object.assign(activeRule, { always: true });
      const scenario = buildScenario({ rules: [activeRule] });
      gameManager.game.scenario = scenario;

      const validIdentifier = Object.assign(new ScenarioRuleIdentifier(), { edition: 'gh', scenario: '1', index: 0, section: false });
      const danglingIdentifier = Object.assign(new ScenarioRuleIdentifier(), { edition: 'gh', scenario: '1', index: 99, section: false });
      gameManager.game.activeScenarioRules = [validIdentifier, danglingIdentifier];

      scenarioRulesManager.cleanActiveScenarioRules();

      expect(gameManager.game.activeScenarioRules).toEqual([validIdentifier]);
    });
  });
});
