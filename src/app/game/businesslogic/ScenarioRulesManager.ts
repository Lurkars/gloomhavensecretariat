import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { Condition } from 'src/app/game/model/data/Condition';
import { Element } from 'src/app/game/model/data/Element';
import { RoomData } from 'src/app/game/model/data/RoomData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import {
  HiddenScenarioFigureRuleTypes,
  ScenarioFigureRule,
  ScenarioRule,
  ScenarioRuleIdentifier
} from 'src/app/game/model/data/ScenarioRule';
import { Entity, EntityValueFunction } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { Game, GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { evaluateExpression } from 'src/app/game/util/ExpressionEvaluator';

export type ScenarioRuleModel = { identifier: ScenarioRuleIdentifier; rule: ScenarioRule };

export class ScenarioRuleApplyResult {
  conclusions: ScenarioData[] = [];
  finish: { success: boolean; conclusions: ScenarioData[] } | undefined;
}

export class ScenarioRulesManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  addScenarioRules(initial: boolean = false) {
    this.game.scenarioRules = [];
    const scenario = this.game.scenario;
    if (scenario && scenario.rules) {
      scenario.rules.forEach((rule, index) => {
        if (!rule.alwaysApply || !settingsManager.settings.scenarioRulesAutoapply) {
          this.addScenarioRule(scenario, rule, index, false, initial);
        }
      });
    }

    if (this.game.sections) {
      this.game.sections.forEach((section) => {
        if (section.rules) {
          section.rules.forEach((rule, index) => {
            if (!rule.alwaysApply || !settingsManager.settings.scenarioRulesAutoapply) {
              this.addScenarioRule(section, rule, index, true, initial);
            }
          });
        }
      });
    }

    this.addScenarioErrata();
    this.filterDisabledScenarioRules();
  }

  addScenarioRulesAlways() {
    const scenario = this.game.scenario;
    if (scenario && scenario.rules) {
      scenario.rules
        .filter((rule) => (this.game.round > 0 && rule.always) || rule.alwaysApply || rule.alwaysApplyTurn)
        .forEach((rule) => {
          if (
            rule.alwaysApply &&
            settingsManager.settings.scenarioRulesAutoapply &&
            this.scenarioRuleActive(rule, scenario.rules.indexOf(rule), false)
          ) {
            gameManager.scenarioRuleEffectsManager.applyRule(rule, {
              edition: scenario.edition,
              scenario: scenario.index,
              group: scenario.group,
              index: scenario.rules.indexOf(rule),
              section: false
            });
          } else if (
            !this.game.discardedScenarioRules.find(
              (identifier) =>
                identifier.edition === scenario.edition &&
                identifier.scenario === scenario.index &&
                identifier.group === scenario.group &&
                identifier.index === scenario.rules.indexOf(rule) &&
                !identifier.section
            )
          ) {
            this.addScenarioRule(scenario, rule, scenario.rules.indexOf(rule), false);
          }
        });
    }

    if (this.game.sections) {
      this.game.sections.forEach((section) => {
        if (section.rules) {
          section.rules
            .filter((rule) => (this.game.round > 0 && rule.always) || rule.alwaysApply || rule.alwaysApplyTurn)
            .forEach((rule) => {
              if (
                rule.alwaysApply &&
                settingsManager.settings.scenarioRulesAutoapply &&
                this.scenarioRuleActive(rule, section.rules.indexOf(rule), true)
              ) {
                gameManager.scenarioRuleEffectsManager.applyRule(rule, {
                  edition: section.edition,
                  scenario: section.index,
                  group: section.group,
                  index: section.rules.indexOf(rule),
                  section: true
                });
                this.game.scenarioRules.splice(this.game.scenarioRules.length - 1, 1);
              } else if (
                !this.game.discardedScenarioRules.find(
                  (identifier) =>
                    identifier.edition === section.edition &&
                    identifier.scenario === section.index &&
                    identifier.group === section.group &&
                    identifier.index === section.rules.indexOf(rule) &&
                    identifier.section
                )
              ) {
                this.addScenarioRule(section, rule, section.rules.indexOf(rule), true);
              }
            });
        }
      });
    }

    this.addScenarioErrata();
    this.filterDisabledScenarioRules();
  }

  applyScenarioRulesAlways() {
    const scenario = this.game.scenario;
    const rules: { identifier: ScenarioRuleIdentifier; rule: ScenarioRule }[] = [];
    if (scenario && scenario.rules) {
      rules.push(
        ...scenario.rules
          .map((rule, index) => {
            const identifier = { edition: scenario.edition, scenario: scenario.index, group: scenario.group, index: index, section: false };
            return { identifier: identifier, rule: rule };
          })
          .filter(
            (ruleModel) =>
              ruleModel.rule.alwaysApply &&
              this.game.appliedScenarioRules.find(
                (applied) =>
                  applied.edition === ruleModel.identifier.edition &&
                  applied.scenario === ruleModel.identifier.scenario &&
                  applied.group === ruleModel.identifier.group &&
                  applied.index === ruleModel.identifier.index &&
                  applied.section === ruleModel.identifier.section
              )
          )
      );
    }

    if (this.game.sections) {
      this.game.sections.forEach((section) => {
        if (section.rules) {
          rules.push(
            ...section.rules
              .map((rule, index) => {
                const identifier = { edition: section.edition, scenario: section.index, group: section.group, index: index, section: true };
                return { identifier: identifier, rule: rule };
              })
              .filter(
                (ruleModel) =>
                  ruleModel.rule.alwaysApply &&
                  this.game.appliedScenarioRules.find(
                    (applied) =>
                      applied.edition === ruleModel.identifier.edition &&
                      applied.scenario === ruleModel.identifier.scenario &&
                      applied.group === ruleModel.identifier.group &&
                      applied.index === ruleModel.identifier.index &&
                      applied.section === ruleModel.identifier.section
                  )
              )
          );
        }
      });
    }

    rules.forEach((ruleModel) => {
      if (this.scenarioRuleActive(ruleModel.rule, ruleModel.identifier.index, ruleModel.identifier.section)) {
        gameManager.scenarioRuleEffectsManager.applyRule(ruleModel.rule, ruleModel.identifier);
      }
    });
  }

  applyScenarioRulesTurn(entity: Entity, after: boolean = false) {
    const scenario = this.game.scenario;
    const rules: { identifier: ScenarioRuleIdentifier; rule: ScenarioRule }[] = [];
    if (scenario && scenario.rules) {
      rules.push(
        ...scenario.rules
          .map((rule, index) => {
            const identifier = { edition: scenario.edition, scenario: scenario.index, group: scenario.group, index: index, section: false };
            return { identifier: identifier, rule: rule };
          })
          .filter(
            (ruleModel) =>
              ruleModel.rule.alwaysApplyTurn &&
              ((!after && ruleModel.rule.alwaysApplyTurn === 'turn') || (after && ruleModel.rule.alwaysApplyTurn === 'after')) &&
              this.game.appliedScenarioRules.find(
                (applied) =>
                  applied.edition === ruleModel.identifier.edition &&
                  applied.scenario === ruleModel.identifier.scenario &&
                  applied.group === ruleModel.identifier.group &&
                  applied.index === ruleModel.identifier.index &&
                  applied.section === ruleModel.identifier.section
              )
          )
      );
    }

    if (this.game.sections) {
      this.game.sections.forEach((section) => {
        if (section.rules) {
          rules.push(
            ...section.rules
              .map((rule, index) => {
                const identifier = { edition: section.edition, scenario: section.index, group: section.group, index: index, section: true };
                return { identifier: identifier, rule: rule };
              })
              .filter(
                (ruleModel) =>
                  ruleModel.rule.alwaysApplyTurn &&
                  ((!after && ruleModel.rule.alwaysApplyTurn === 'turn') || (after && ruleModel.rule.alwaysApplyTurn === 'after')) &&
                  this.game.appliedScenarioRules.find(
                    (applied) =>
                      applied.edition === ruleModel.identifier.edition &&
                      applied.scenario === ruleModel.identifier.scenario &&
                      applied.group === ruleModel.identifier.group &&
                      applied.index === ruleModel.identifier.index &&
                      applied.section === ruleModel.identifier.section
                  )
              )
          );
        }
      });
    }

    rules.forEach((ruleModel) => {
      gameManager.scenarioRuleEffectsManager.applyRule(ruleModel.rule, ruleModel.identifier, [entity]);
    });
  }

  addScenarioErrata() {
    const scenario = this.game.scenario;
    if (scenario && scenario.errata) {
      scenario.errata.split('|').forEach((errata, index) => {
        this.addScenarioRule(scenario, this.createErrataRule(scenario.edition, errata), -1 - index, false);
      });
    }

    if (this.game.sections) {
      this.game.sections.forEach((section) => {
        if (section && section.errata) {
          section.errata.split('|').forEach((errata, index) => {
            this.addScenarioRule(section, this.createErrataRule(section.edition, errata), -1 - index, false);
          });
        }
      });
    }
  }

  createErrataRule(edition: string, errata: string): ScenarioRule {
    const errataRule = new ScenarioRule('true');
    errataRule.always = true;
    errataRule.once = true;
    errataRule.note = '%errata%:&nbsp;%data.custom.' + edition + '.errata.' + errata + '%';
    return errataRule;
  }

  cleanActiveScenarioRules() {
    this.game.activeScenarioRules = this.game.activeScenarioRules.filter((identifier) => {
      const rule = this.getScenarioRule(identifier);
      return rule && this.scenarioRuleActive(rule, identifier.index, identifier.section);
    });
  }

  filterDisabledScenarioRules() {
    this.game.scenarioRules = this.game.scenarioRules.filter(
      (ruleModel, index, self) =>
        !self.find(
          (disableRule) =>
            disableRule.rule.disableRules &&
            disableRule.rule.disableRules.some(
              (value) =>
                value.edition === ruleModel.identifier.edition &&
                value.group === ruleModel.identifier.group &&
                (value.index === ruleModel.identifier.index || value.index === -1) &&
                value.scenario === ruleModel.identifier.scenario &&
                value.section === ruleModel.identifier.section
            )
        )
    );
  }

  scenarioRuleActive(rule: ScenarioRule, index: number, section: boolean, initial: boolean = false): boolean {
    const round = rule.round || 'false';
    let active: boolean = false;

    try {
      active =
        !!evaluateExpression(round, {
          R: rule.start ? this.game.round + 1 : this.game.round,
          C: gameManager.characterManager.characterCount()
        }) &&
        (rule.always || this.game.state === GameState.next || (rule.start && initial));
    } catch (error) {
      console.warn("Cannot apply scenario rule: '" + rule.round + "'", 'index: ' + index, error);
      active = false;
    }

    if (active) {
      if (rule.figures && rule.figures.filter((figureRule) => figureRule.type === 'present' || figureRule.type === 'dead').length > 0) {
        rule.figures
          .filter((figureRule) => figureRule.type === 'present' || figureRule.type === 'dead')
          .forEach((figureRule) => {
            const gameplayFigures: Entity[] = this.presentEntitiesByFigureRule(figureRule, rule);
            const tolerance: number = figureRule.value
              ? EntityValueFunction(figureRule.value.split(':')[0])
              : figureRule.type === 'present'
                ? 1
                : 0;
            active =
              active &&
              tolerance >= 0 &&
              (figureRule.type === 'present' ? gameplayFigures.length >= tolerance : gameplayFigures.length <= tolerance);
            if (
              figureRule.identifier &&
              (figureRule.identifier.marker || (figureRule.identifier.tags && figureRule.identifier.tags.length > 0)) &&
              !settingsManager.settings.automaticStandees
            ) {
              active = false;
            }
          });
      }

      if (active) {
        if (rule.figures && rule.figures.filter((figureRule) => figureRule.type === 'killed').length > 0) {
          rule.figures
            .filter((figureRule) => figureRule.type === 'killed')
            .forEach((figureRule) => {
              if (!figureRule.identifier) {
                active = false;
              } else {
                const counters = gameManager.entityCounterManager.entityCounters(figureRule.identifier);
                active = active && counters.length > 0;
                if (active) {
                  if (figureRule.value === 'all') {
                    counters.forEach((counter) => {
                      active = (active && counter && counter.total > 0 && counter.killed >= counter.total) || false;
                    });
                  } else {
                    const value = EntityValueFunction(figureRule.value || 0);
                    let count = 0;
                    counters.forEach((counter) => {
                      count += counter.killed;
                    });
                    active = (active && count > 0 && count >= value) || false;
                  }
                }
              }
            });
        }
      }

      if (active) {
        if (rule.figures && rule.figures.filter((figureRule) => figureRule.type === 'initiative').length > 0) {
          rule.figures
            .filter((figureRule) => figureRule.type === 'initiative')
            .forEach((figureRule) => {
              if (!figureRule.identifier) {
                active = false;
              } else {
                const figures = this.figuresByFigureRule(figureRule, rule);
                active =
                  (active &&
                    figures.length &&
                    (figures.find((figure) => {
                      if (!figure.active) {
                        return false;
                      }
                      if (!isNaN(+figureRule.value)) {
                        return figure.getInitiative() === +figureRule.value;
                      } else {
                        return !!evaluateExpression(figure.getInitiative() + ' ' + figureRule.value);
                      }
                    }) !== undefined ||
                      figures.every(
                        (figure) =>
                          !figure.active && isNaN(+figureRule.value) && !evaluateExpression(figure.getInitiative() + ' ' + figureRule.value)
                      ))) ||
                  false;
              }
            });
        }
      }

      if (rule.requiredRooms && rule.requiredRooms.length) {
        rule.requiredRooms.forEach((room) => {
          active = active && this.game.scenario !== undefined && this.game.scenario.revealedRooms.includes(room);
        });
      }

      if (rule.requiredRules && rule.requiredRules.length) {
        rule.requiredRules.forEach((other) => {
          active =
            active &&
            this.game.appliedScenarioRules.some(
              (identifier) =>
                other.edition === identifier.edition &&
                other.scenario === identifier.scenario &&
                other.group === identifier.group &&
                other.index === identifier.index &&
                other.section === identifier.section
            );
        });
      }

      if (rule.requiredScenarios && rule.requiredScenarios.length) {
        rule.requiredScenarios.forEach((scenario) => {
          active =
            active &&
            this.game.party.scenarios.find(
              (other) => other.edition === scenario.edition && other.index === scenario.index && other.group === scenario.group
            ) !== undefined;
        });
      }

      if (
        rule.rooms &&
        rule.rooms.length &&
        rule.rooms.every((roomNumber) => this.game.scenario && this.game.scenario.revealedRooms.includes(roomNumber))
      ) {
        active = false;
      }

      if (rule.treasures) {
        const treasures = this.game.figures
          .filter((figure) => figure instanceof Character)
          .map((figure) => (figure as Character).treasures.map((treasure) => (typeof treasure === 'number' ? treasure : 'G')))
          .flat();
        if (
          (typeof rule.treasures === 'number' || typeof rule.treasures === 'string') &&
          treasures.length < EntityValueFunction(rule.treasures)
        ) {
          active = false;
        } else if (typeof rule.treasures !== 'number' && typeof rule.treasures !== 'string') {
          let count = 0;
          rule.treasures.forEach((treasure) => {
            const index = treasures.indexOf(treasure);
            if (index !== -1) {
              treasures.splice(index, 1);
              count++;
            }
          });
          if (count < rule.treasures.length) {
            active = false;
          }
        }
      }

      if (rule.elementTrigger && rule.elementTrigger.length) {
        active = rule.elementTrigger.every(
          (elementModel) =>
            (elementModel.type === Element.wild && !!this.game.elementBoard.find((element) => element.state === elementModel.state)) ||
            !!this.game.elementBoard.find((element) => element.type === elementModel.type && element.state === elementModel.state)
        );
      }
    }

    return active;
  }

  addScenarioRule(scenarioData: ScenarioData, rule: ScenarioRule, index: number, section: boolean, initial: boolean = false) {
    const add = this.scenarioRuleActive(rule, index, section, initial);

    const identifier = {
      edition: scenarioData.edition,
      scenario: scenarioData.index,
      group: scenarioData.group,
      index: index,
      section: section
    };

    const applied = this.game.appliedScenarioRules.find(
      (applied) =>
        applied.edition === identifier.edition &&
        applied.scenario === identifier.scenario &&
        applied.group === identifier.group &&
        applied.index === identifier.index &&
        applied.section === identifier.section
    );

    const discarded = this.game.discardedScenarioRules.find(
      (discarded) =>
        discarded.edition === identifier.edition &&
        discarded.scenario === identifier.scenario &&
        discarded.group === identifier.group &&
        discarded.index === identifier.index &&
        discarded.section === identifier.section
    );

    const visible = this.game.scenarioRules.find(
      (ruleModel) =>
        ruleModel.identifier.edition === identifier.edition &&
        ruleModel.identifier.scenario === identifier.scenario &&
        ruleModel.identifier.group === identifier.group &&
        ruleModel.identifier.index === identifier.index &&
        ruleModel.identifier.section === identifier.section
    );

    if (add && !applied && !discarded && !visible) {
      if (rule.spawns) {
        rule.spawns.forEach((spawn) => {
          if (spawn.manual && !spawn.count && spawn.count !== 0) {
            spawn.count = 1;
          }
        });
      }
      if (rule.objectiveSpawns) {
        rule.objectiveSpawns.forEach((spawn) => {
          if (spawn.manual && !spawn.count && spawn.count !== 0) {
            spawn.count = 1;
          }
        });
      }
      this.game.scenarioRules.push({ identifier: identifier, rule: rule });
    } else if (!add && rule.always) {
      this.game.scenarioRules = this.game.scenarioRules.filter(
        (model) =>
          model.identifier.edition !== identifier.edition ||
          model.identifier.group !== identifier.group ||
          model.identifier.index !== identifier.index ||
          model.identifier.scenario !== identifier.scenario ||
          model.identifier.section !== identifier.section
      );
    }
  }

  addActiveFigureRule(figure: Figure, after: boolean = false) {
    const scenario = this.game.scenario;
    if (scenario && scenario.rules) {
      scenario.rules
        .filter((rule) => {
          if (rule.figures) {
            const figureRule = rule.figures.find((figureRule) => figureRule.type === (after ? 'afterTurn' : 'onTurn'));
            return (
              figureRule !== undefined &&
              this.figuresByFigureRule(figureRule, rule).some(
                (ruleFigure) => ruleFigure.edition === figure.edition && ruleFigure.name === figure.name
              )
            );
          }
          return false;
        })
        .forEach((rule) => {
          this.addScenarioRule(scenario, rule, scenario.rules.indexOf(rule), false);
        });
    }

    if (this.game.sections) {
      this.game.sections.forEach((section) => {
        if (section.rules) {
          section.rules
            .filter((rule) => {
              if (rule.figures) {
                const figureRule = rule.figures.find((figureRule) => figureRule.type === (after ? 'afterTurn' : 'onTurn'));
                return (
                  figureRule !== undefined &&
                  this.figuresByFigureRule(figureRule, rule).some(
                    (ruleFigure) => ruleFigure.edition === figure.edition && ruleFigure.name === figure.name
                  )
                );
              }
              return false;
            })
            .forEach((rule) => {
              this.addScenarioRule(section, rule, section.rules.indexOf(rule), true);
            });
        }
      });
    }

    this.filterDisabledScenarioRules();
  }

  ruleSections(rule: ScenarioRule, identifier: ScenarioRuleIdentifier): ScenarioData[] {
    const scenario = this.getScenarioForRule(identifier).scenario;
    if (!scenario || !rule.sections) {
      return [];
    }
    return gameManager.editionManager
      .sectionData(scenario.edition)
      .filter(
        (sectionData) =>
          !this.game.sections.some(
            (active) => active.edition === sectionData.edition && active.group === scenario.group && active.index === sectionData.index
          ) &&
          sectionData.group === scenario.group &&
          rule.sections.includes(sectionData.index)
      );
  }

  ruleRooms(rule: ScenarioRule, identifier: ScenarioRuleIdentifier): RoomData[] {
    const scenario = this.getScenarioForRule(identifier).scenario;
    const gameScenario = this.game.scenario;
    if (!scenario || !rule.rooms || !gameScenario) {
      return [];
    }
    return rule.rooms
      .filter((roomNumber) => !gameScenario.revealedRooms.includes(roomNumber))
      .map((roomNumber) => scenario.rooms.find((roomData) => roomData.roomNumber === roomNumber))
      .filter((roomData) => !!roomData)
      .map((roomData) => roomData as RoomData);
  }

  pendingFigureRules(rule: ScenarioRule): ScenarioFigureRule[] {
    return (rule.figures || []).filter((figureRule) => {
      if (HiddenScenarioFigureRuleTypes.includes(figureRule.type)) {
        return false;
      }

      const figures = this.figuresByFigureRule(figureRule, rule);
      if (figures.length === 0) {
        return false;
      }

      if (
        figureRule.type === 'gainCondition' ||
        figureRule.type === 'permanentCondition' ||
        figureRule.type === 'loseCondition' ||
        figureRule.type === 'losePermanentCondition'
      ) {
        const condition = new Condition(('' + figureRule.value).split(':')[0]);
        const permanent = figureRule.type === 'permanentCondition' || figureRule.type === 'losePermanentCondition';
        const gain = figureRule.type === 'gainCondition' || figureRule.type === 'permanentCondition';
        return figures.some((figure) =>
          gameManager.entityManager
            .entities(figure)
            .some((entity) => gameManager.conditionManager.hasCondition(entity, condition, permanent) !== gain)
        );
      } else if (figureRule.type === 'toggleOn' || figureRule.type === 'toggleOff') {
        return figures.some((figure) => figure.off === (figureRule.type === 'toggleOn'));
      }

      return true;
    });
  }

  ruleVisible(index: number): boolean {
    const model = this.game.scenarioRules[index];
    if (!model) {
      return false;
    }
    const rule = model.rule;

    if (
      rule.disablingRules &&
      rule.disablingRules.length > 0 &&
      rule.disablingRules.some((value) =>
        this.game.scenarioRules.some(
          (ruleModel, otherRuleIndex) =>
            index !== otherRuleIndex &&
            value.edition === ruleModel.identifier.edition &&
            value.group === ruleModel.identifier.group &&
            (value.index === ruleModel.identifier.index || value.index === -1) &&
            value.scenario === ruleModel.identifier.scenario &&
            value.section === ruleModel.identifier.section &&
            this.ruleVisible(otherRuleIndex)
        )
      )
    ) {
      return false;
    }

    return (
      gameManager.scenarioRuleEffectsManager.spawns(rule).length > 0 ||
      (!!rule.objectiveSpawns && rule.objectiveSpawns.length > 0) ||
      (!!rule.elements &&
        rule.elements.length > 0 &&
        rule.elements.some(
          (elementModel) => this.game.elementBoard.find((element) => element.type === elementModel.type)?.state !== elementModel.state
        )) ||
      this.ruleSections(rule, model.identifier).length > 0 ||
      this.ruleRooms(rule, model.identifier).length > 0 ||
      this.pendingFigureRules(rule).length > 0 ||
      !!rule.note ||
      !!rule.finish ||
      !!rule.reverseInitiative ||
      !!rule.randomDungeon ||
      (!!rule.statEffects && rule.statEffects.length > 0)
    );
  }

  ruleApplicable(rule: ScenarioRule): boolean {
    return (
      gameManager.scenarioRuleEffectsManager.spawns(rule).length > 0 ||
      (!!rule.objectiveSpawns && rule.objectiveSpawns.length > 0) ||
      (!!rule.elements && rule.elements.length > 0) ||
      !!rule.finish ||
      (settingsManager.settings.scenarioRooms && !!rule.rooms && rule.rooms.length > 0) ||
      (!!rule.sections && rule.sections.length > 0) ||
      !!rule.randomDungeon ||
      !!rule.reverseInitiative ||
      (!!rule.figures &&
        rule.figures.length > 0 &&
        rule.figures.some((figureRule) => !HiddenScenarioFigureRuleTypes.includes(figureRule.type))) ||
      (!!rule.statEffects && rule.statEffects.length > 0)
    );
  }

  applyScenarioRule(model: ScenarioRuleModel): ScenarioRuleApplyResult {
    const result = new ScenarioRuleApplyResult();
    const scenario = this.getScenarioForRule(model.identifier).scenario;
    const rule = model.rule;
    if (!scenario || rule.alwaysApplyTurn) {
      return result;
    }

    gameManager.scenarioRuleEffectsManager.applyRule(rule, model.identifier);

    this.ruleRooms(rule, model.identifier).forEach((roomData) =>
      gameManager.scenarioManager.openRoom(roomData, scenario, model.identifier.section)
    );

    this.ruleSections(rule, model.identifier).forEach((sectionData) => {
      if (sectionData.conclusion) {
        result.conclusions.push(sectionData);
      } else {
        gameManager.scenarioManager.addSection(sectionData);
      }
    });

    if (rule.finish && ['won', 'lost'].includes(rule.finish)) {
      const success = rule.finish === 'won';
      const gameScenario = this.game.scenario;
      result.finish = {
        success,
        conclusions:
          success && gameScenario
            ? gameManager.scenarioManager
                .availableSections(true)
                .filter(
                  (sectionData) =>
                    sectionData.edition === gameScenario.edition &&
                    sectionData.parent === gameScenario.index &&
                    sectionData.group === gameScenario.group &&
                    sectionData.conclusion &&
                    gameManager.scenarioRequirementsManager.getRequirements(sectionData).length === 0
                )
            : []
      };
    }
    return result;
  }

  private ruleModelIndex(model: ScenarioRuleModel): number {
    const index = this.game.scenarioRules.indexOf(model);
    if (index !== -1) {
      return index;
    }
    return this.game.scenarioRules.findIndex(
      (other) =>
        other.identifier.edition === model.identifier.edition &&
        other.identifier.scenario === model.identifier.scenario &&
        other.identifier.group === model.identifier.group &&
        other.identifier.index === model.identifier.index &&
        other.identifier.section === model.identifier.section
    );
  }

  resolveScenarioRule(model: ScenarioRuleModel) {
    const rule = model.rule;
    if (rule.once || rule.alwaysApply || rule.alwaysApplyTurn) {
      this.game.appliedScenarioRules.push(model.identifier);
    }
    if (rule.active) {
      this.game.activeScenarioRules.push(model.identifier);
    }
    const index = this.ruleModelIndex(model);
    if (index !== -1) {
      this.game.scenarioRules.splice(index, 1);
    }

    if (rule.finish === 'round') {
      gameManager.roundManager.nextGameState();
      if (this.game.state === GameState.next) {
        gameManager.roundManager.nextGameState();
      }
    }
  }

  discardAppliedRule(identifier: ScenarioRuleIdentifier) {
    const index = this.game.appliedScenarioRules.indexOf(identifier);
    if (index === -1) {
      return;
    }
    const scenario = this.getScenarioForRule(identifier).scenario;
    const rule = scenario && scenario.rules ? scenario.rules[identifier.index] : undefined;
    this.game.appliedScenarioRules.splice(index, 1);
    if (rule && (rule.once || rule.alwaysApplyTurn)) {
      this.game.discardedScenarioRules.push(identifier);
    }
  }

  clearDiscardedRules() {
    this.game.discardedScenarioRules = [];
  }

  hideScenarioRule(model: ScenarioRuleModel) {
    const index = this.ruleModelIndex(model);
    if (index !== -1) {
      this.game.scenarioRules.splice(index, 1);
      this.game.discardedScenarioRules.push(model.identifier);
    }
  }

  removeScenarioRule(model: ScenarioRuleModel) {
    const index = this.ruleModelIndex(model);
    if (index === -1) {
      return;
    }
    this.game.scenarioRules.splice(index, 1);
    if (model.rule.once || model.rule.alwaysApplyTurn || model.rule.alwaysApply) {
      this.game.discardedScenarioRules.push(model.identifier);
    }
    this.game.activeScenarioRules = this.game.activeScenarioRules.filter(
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

  getScenarioForRule(identifier: ScenarioRuleIdentifier): { scenario: ScenarioData | undefined; section: boolean } {
    if (identifier.section) {
      const sectionData = this.game.sections.find(
        (section) =>
          section.edition === identifier.edition &&
          section.group === identifier.group &&
          section.index === identifier.scenario &&
          section.rules &&
          section.rules.length > identifier.index
      );
      if (sectionData) {
        return { scenario: sectionData, section: true };
      }
    } else if (
      this.game.scenario &&
      this.game.scenario.edition === identifier.edition &&
      this.game.scenario.group === identifier.group &&
      this.game.scenario.index === identifier.scenario &&
      this.game.scenario.rules &&
      this.game.scenario.rules.length > identifier.index
    ) {
      return { scenario: this.game.scenario, section: false };
    }

    return { scenario: undefined, section: false };
  }

  getScenarioRule(identifier: ScenarioRuleIdentifier): ScenarioRule | undefined {
    const scenarioData = this.getScenarioForRule(identifier).scenario;
    if (!!scenarioData) {
      if (scenarioData.rules && scenarioData.rules.length > identifier.index && identifier.index >= 0) {
        if (scenarioData.rules[identifier.index].spawns) {
          scenarioData.rules[identifier.index].spawns.forEach((spawn) => {
            if (spawn.manual && !spawn.count) {
              spawn.count = '1';
            }
          });
        }
        return scenarioData.rules[identifier.index];
      } else if (scenarioData.errata && identifier.index < 0 && scenarioData.errata.split('|')[identifier.index * -1 - 1]) {
        return this.createErrataRule(scenarioData.edition, scenarioData.errata.split('|')[identifier.index * -1 - 1]);
      }
    }

    return undefined;
  }

  figuresByFigureRule(figureRule: ScenarioFigureRule, rule: ScenarioRule): Figure[] {
    const ref = figureRule.identifierRef;
    if (typeof ref === 'number') {
      if (
        ref >= 0 &&
        ref < rule.figures.length &&
        ref !== rule.figures.indexOf(figureRule) &&
        rule.figures.indexOf(figureRule) !== rule.figures[ref].identifierRef
      ) {
        return this.figuresByFigureRule(rule.figures[ref], rule);
      } else {
        console.warn('Invalid Figure Fule Identifier Ref!', ref, rule);
        return [];
      }
    }

    if (
      !figureRule.identifier ||
      (!figureRule.identifier.health &&
        !figureRule.identifier.hp &&
        (!figureRule.identifier.conditions || figureRule.identifier.conditions.length === 0) &&
        figureRule.identifier.identity === undefined)
    ) {
      return gameManager.entityManager.figuresByIdentifier(figureRule.identifier, figureRule.scenarioEffect);
    }

    return gameManager.entityManager.figuresByIdentifier(figureRule.identifier, figureRule.scenarioEffect).filter((figure) => {
      if (figureRule.identifier && figureRule.identifier.number) {
        if (
          figure instanceof Monster &&
          figure.entities.every(
            (entity) =>
              figureRule.identifier &&
              figureRule.identifier.number &&
              !evaluateExpression(figureRule.identifier.number, { N: entity.number })
          )
        ) {
          return false;
        }
      }

      if (figureRule.identifier && figureRule.identifier.health) {
        if (figure instanceof Character) {
          const health = EntityValueFunction(figureRule.identifier.health.replaceAll('H', '' + EntityValueFunction(figure.maxHealth)));
          return figure.health <= health;
        } else if (figure instanceof Monster || figure instanceof ObjectiveContainer) {
          return figure.entities.some((entity) => {
            if (figureRule.identifier && figureRule.identifier.health && gameManager.entityManager.isAlive(entity)) {
              const health = EntityValueFunction(figureRule.identifier.health.replaceAll('H', '' + EntityValueFunction(entity.maxHealth)));
              return entity.health <= health;
            }

            return false;
          });
        }
      }

      if (figureRule.identifier && figureRule.identifier.hp) {
        if (figure instanceof Character) {
          return !!evaluateExpression(figureRule.identifier.hp, { HP: figure.health, H: EntityValueFunction(figure.maxHealth) });
        } else if (figure instanceof Monster || figure instanceof ObjectiveContainer) {
          return figure.entities.some((entity) => {
            if (figureRule.identifier && figureRule.identifier.hp && gameManager.entityManager.isAlive(entity)) {
              return !!evaluateExpression(figureRule.identifier.hp, { HP: entity.health, H: EntityValueFunction(entity.maxHealth) });
            }

            return false;
          });
        }
      }

      if (figureRule.identifier && figureRule.identifier.conditions) {
        if (figure instanceof Character) {
          return figureRule.identifier.conditions.every(
            (condition) =>
              (condition.startsWith('!') && !gameManager.conditionManager.hasCondition(figure, new Condition(condition.substring(1)))) ||
              (!condition.startsWith('!') && gameManager.conditionManager.hasCondition(figure, new Condition(condition)))
          );
        } else if (figure instanceof Monster || figure instanceof ObjectiveContainer) {
          return figure.entities.some((entity) => {
            if (figureRule.identifier && figureRule.identifier.health && gameManager.entityManager.isAlive(entity)) {
              return (
                figureRule.identifier.conditions &&
                figureRule.identifier.conditions.every(
                  (condition) =>
                    (condition.startsWith('!') &&
                      !gameManager.conditionManager.hasCondition(entity, new Condition(condition.substring(1)))) ||
                    (!condition.startsWith('!') && gameManager.conditionManager.hasCondition(entity, new Condition(condition)))
                )
              );
            }

            return false;
          });
        }
      }

      if (figureRule.identifier && figureRule.identifier.identity !== undefined) {
        if (figure instanceof Character) {
          return figure.identity === figureRule.identifier.identity;
        }
        return false;
      }
      return false;
    });
  }

  entitiesByFigureRule(figureRule: ScenarioFigureRule, rule: ScenarioRule | undefined): Entity[] {
    const ref = figureRule.identifierRef;
    if (typeof ref === 'number') {
      if (
        rule &&
        ref >= 0 &&
        ref < rule.figures.length &&
        ref !== rule.figures.indexOf(figureRule) &&
        rule.figures.indexOf(figureRule) !== rule.figures[ref].identifierRef
      ) {
        return this.entitiesByFigureRule(rule.figures[ref], rule);
      } else {
        console.warn('Invalid Figure Fule Identifier Ref!', ref, rule);
        return [];
      }
    }
    if (
      !figureRule.identifier ||
      (!figureRule.identifier.number &&
        !figureRule.identifier.health &&
        !figureRule.identifier.hp &&
        (!figureRule.identifier.conditions || figureRule.identifier.conditions.length === 0) &&
        figureRule.identifier.identity === undefined)
    ) {
      return gameManager.entityManager.entitiesByIdentifier(figureRule.identifier, figureRule.scenarioEffect);
    }

    return gameManager.entityManager.entitiesByIdentifier(figureRule.identifier, figureRule.scenarioEffect).filter((entity) => {
      let filter = true;
      if (figureRule.identifier && figureRule.identifier.health && gameManager.entityManager.isAlive(entity)) {
        const health = EntityValueFunction(figureRule.identifier.health.replaceAll('H', '' + EntityValueFunction(entity.maxHealth)));
        filter = filter && entity.health <= health;
      }

      if (figureRule.identifier && figureRule.identifier.hp && gameManager.entityManager.isAlive(entity)) {
        filter = filter && !!evaluateExpression(figureRule.identifier.hp, { HP: entity.health, H: EntityValueFunction(entity.maxHealth) });
      }

      if (figureRule.identifier && figureRule.identifier.conditions) {
        filter =
          filter &&
          figureRule.identifier.conditions.every(
            (condition) =>
              (condition.startsWith('!') && !gameManager.conditionManager.hasCondition(entity, new Condition(condition.substring(1)))) ||
              (!condition.startsWith('!') && gameManager.conditionManager.hasCondition(entity, new Condition(condition)))
          );
      }

      if (figureRule.identifier && figureRule.identifier.number) {
        filter = filter && !!evaluateExpression(figureRule.identifier.number, { N: entity.number });
      }

      if (figureRule.identifier && figureRule.identifier.marker && (entity instanceof MonsterEntity || entity instanceof ObjectiveEntity)) {
        filter = filter && figureRule.identifier.marker === entity.marker;
      }

      if (figureRule.identifier && figureRule.identifier.identity !== undefined && entity instanceof Character) {
        filter = filter && entity.identity === figureRule.identifier.identity;
      }

      return filter;
    });
  }

  presentEntitiesByFigureRule(figureRule: ScenarioFigureRule, rule: ScenarioRule | undefined): Entity[] {
    return this.entitiesByFigureRule(figureRule, rule).filter(
      (entity) =>
        (gameManager.entityManager.isAlive(entity) || (entity instanceof MonsterEntity && entity.dormant)) &&
        (!(entity instanceof MonsterEntity) ||
          !figureRule.identifier?.marker ||
          (figureRule.identifier &&
            entity.marker === figureRule.identifier.marker &&
            (!figureRule.identifier.tags ||
              figureRule.identifier.tags.length === 0 ||
              figureRule.identifier.tags.forEach((tag) => entity.tags.includes(tag)))))
    );
  }
}
