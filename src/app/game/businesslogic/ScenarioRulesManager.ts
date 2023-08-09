import { Character } from "../model/Character";
import { ScenarioData } from "../model/data/ScenarioData";
import { ScenarioFigureRule, ScenarioRule, ScenarioRuleIdentifier } from "../model/data/ScenarioRule";
import { Entity, EntityValueFunction } from "../model/Entity";
import { Figure } from "../model/Figure";
import { Game, GameState } from "../model/Game";
import { Monster } from "../model/Monster";
import { MonsterEntity } from "../model/MonsterEntity";
import { Objective } from "../model/Objective";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

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
        this.addScenarioRule(scenario, rule, index, false, initial);
      })
    }

    if (this.game.sections) {
      this.game.sections.forEach((section) => {
        if (section.rules) {
          section.rules.forEach((rule, index) => {
            this.addScenarioRule(section, rule, index, true, initial);
          })
        }
      })
    }

    this.filterDisabledScenarioRules();
  }

  addScenarioRulesAlways() {
    const scenario = this.game.scenario;
    if (scenario && scenario.rules) {
      scenario.rules.filter((rule) => rule.always).forEach((rule) => {
        this.addScenarioRule(scenario, rule, scenario.rules.indexOf(rule), false);
      })
    }

    if (this.game.sections) {
      this.game.sections.forEach((section) => {
        if (section.rules) {
          section.rules.filter((rule) => rule.always).forEach((rule) => {
            this.addScenarioRule(section, rule, section.rules.indexOf(rule), true);
          })
        }
      })
    }

    this.filterDisabledScenarioRules();
  }

  filterDisabledScenarioRules() {
    this.game.scenarioRules = this.game.scenarioRules.filter((ruleModel, index, self) => !self.find((disableRule) => disableRule.rule.disableRules && disableRule.rule.disableRules.some((value) => value.edition == ruleModel.identifier.edition && value.group == ruleModel.identifier.group && (value.index == ruleModel.identifier.index || value.index == -1) && value.scenario == ruleModel.identifier.scenario && value.section == ruleModel.identifier.section)));
  }

  addScenarioRule(scenarioData: ScenarioData, rule: ScenarioRule, index: number, section: boolean, initial: boolean = false) {
    const identifier = { "edition": scenarioData.edition, "scenario": scenarioData.index, "group": scenarioData.group, "index": index, "section": section };

    let round = rule.round || 'false';
    let add = false;

    while (round.indexOf('R') != -1) {
      round = round.replace('R', '' + (rule.start ? (this.game.round + 1) : this.game.round));
    }

    while (round.indexOf('C') != -1) {
      round = round.replace('C', '' + gameManager.characterManager.characterCount());
    }

    try {
      add = eval(round) && (rule.always || this.game.state == GameState.next || rule.start && initial);
    } catch (error) {
      console.warn("Cannot apply scenario rule: '" + rule.round + "'", "index: " + index, error);
      add = false;
    }

    if (add) {
      if (rule.figures && rule.figures.filter((figureRule) => figureRule.type == "present" || figureRule.type == "dead").length > 0) {
        rule.figures.filter((figureRule) => figureRule.type == "present" || figureRule.type == "dead").forEach((figureRule) => {
          const gameplayFigures: Entity[] = this.entitiesByFigureRule(figureRule, rule).filter((entity) => (gameManager.entityManager.isAlive(entity) || entity instanceof MonsterEntity && entity.dormant) && (!(entity instanceof MonsterEntity) || (!(figureRule.identifier?.marker) || (entity instanceof MonsterEntity && figureRule.identifier && entity.marker == figureRule.identifier.marker && (!figureRule.identifier.tags || figureRule.identifier.tags.length == 0 || (entity instanceof MonsterEntity && figureRule.identifier.tags.forEach((tag) => entity.tags.indexOf(tag) != -1)))))));

          const tolerance: number = figureRule.value ? EntityValueFunction(figureRule.value.split(':')[0]) : (figureRule.type == "present" ? 1 : 0);

          add = add && tolerance >= 0 && (figureRule.type == "present" ? gameplayFigures.length >= tolerance : gameplayFigures.length <= tolerance);

          if (figureRule.identifier && (figureRule.identifier.marker || figureRule.identifier.tags && figureRule.identifier.tags.length > 0) && !settingsManager.settings.automaticStandees) {
            add = false;
          }

        })
      }

      if (add) {
        if (rule.figures && rule.figures.filter((figureRule) => figureRule.type == "killed").length > 0) {
          rule.figures.filter((figureRule) => figureRule.type == "killed").forEach((figureRule) => {
            if (!figureRule.identifier) {
              add = false;
            } else {
              const counters = gameManager.entityCounters(figureRule.identifier);
              add = add && counters.length > 0;
              if (add) {
                if (figureRule.value == "all") {
                  counters.forEach((counter) => {
                    add = add && counter && counter.total > 0 && counter.killed >= counter.total || false;
                  })
                } else {
                  const value = EntityValueFunction(figureRule.value || 0);
                  let count = 0;
                  counters.forEach((counter) => {
                    count += counter.killed;
                  })
                  add = add && count > 0 && count >= value || false;
                }
              }
            }
          })
        }
      }

      if (rule.requiredRooms && rule.requiredRooms.length > 0) {
        rule.requiredRooms.forEach((room) => {
          add = add && gameManager.game.scenario != undefined && gameManager.game.scenario.revealedRooms.indexOf(room) != -1;
        })
      }

      if (rule.requiredRules && rule.requiredRules.length > 0) {
        rule.requiredRules.forEach((other) => {
          add = add && this.game.disgardedScenarioRules.some((identifier) => other.edition == identifier.edition && other.scenario == identifier.scenario && other.group == identifier.group && other.index == identifier.index && other.section == identifier.section);
        })
      }

      if (rule.rooms && rule.rooms.every((roomNumber) => gameManager.game.scenario && gameManager.game.scenario.revealedRooms.indexOf(roomNumber) != -1)) {
        add = false;
      }

      if (rule.treasures) {
        let treasures = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => (figure as Character).treasures.map((treasure) => typeof treasure === 'number' ? treasure : 'G')).flat();
        if ((typeof rule.treasures === 'number' || typeof rule.treasures === 'string') && treasures.length < EntityValueFunction(rule.treasures)) {
          add = false;
        } else if (typeof rule.treasures !== 'number' && typeof rule.treasures !== 'string') {
          let count = 0;
          rule.treasures.forEach((treasure) => {
            const index = treasures.indexOf(treasure);
            if (index != -1) {
              treasures.splice(index, 1);
              count++;
            }
          })
          if (count < rule.treasures.length) {
            add = false;
          }
        }
      }
    }

    const disgarded = this.game.disgardedScenarioRules.find((disgarded) => disgarded.edition == identifier.edition && disgarded.scenario == identifier.scenario && disgarded.group == identifier.group && disgarded.index == identifier.index && disgarded.section == identifier.section);

    const visible = this.game.scenarioRules.find((ruleModel) => ruleModel.identifier.edition == identifier.edition && ruleModel.identifier.scenario == identifier.scenario && ruleModel.identifier.group == identifier.group && ruleModel.identifier.index == identifier.index && ruleModel.identifier.section == identifier.section);

    if (add && !disgarded && !visible) {
      if (rule.spawns) {
        rule.spawns.forEach((spawn) => {
          if (spawn.manual && !spawn.count && spawn.count != 0) {
            spawn.count = 1;
          }
        });
      }
      if (rule.objectiveSpawns) {
        rule.objectiveSpawns.forEach((spawn) => {
          if (spawn.manual && !spawn.count && spawn.count != 0) {
            spawn.count = 1;
          }
        });
      }
      this.game.scenarioRules.push({ "identifier": identifier, "rule": rule });
    } else if (!add && rule.always) {
      this.game.scenarioRules = this.game.scenarioRules.filter((model) => model.identifier.edition != identifier.edition || model.identifier.group != identifier.group || model.identifier.index != identifier.index || model.identifier.scenario != identifier.scenario || model.identifier.section != identifier.section);
    }
  }

  getScenarioForRule(rule: ScenarioRuleIdentifier): { scenario: ScenarioData | undefined, section: boolean } {
    if (rule.section) {
      const sectionData = this.game.sections.find((section) => section.edition == rule.edition && section.group == rule.group && section.index == rule.scenario && section.rules && section.rules.length > rule.index);
      if (sectionData) {
        return { scenario: sectionData, section: true };
      }
    } else if (this.game.scenario && this.game.scenario.edition == rule.edition && this.game.scenario.group == rule.group && this.game.scenario.index == rule.scenario && this.game.scenario.rules && this.game.scenario.rules.length > rule.index) {
      return { scenario: this.game.scenario, section: false };
    }

    return { scenario: undefined, section: false };
  }

  figuresByFigureRule(figureRule: ScenarioFigureRule, rule: ScenarioRule): Figure[] {
    const ref = figureRule.identifierRef;
    if (typeof ref == 'number') {
      if (ref >= 0 && ref < rule.figures.length && ref != rule.figures.indexOf(figureRule) && rule.figures.indexOf(figureRule) != rule.figures[ref].identifierRef) {
        return this.figuresByFigureRule(rule.figures[ref], rule);
      } else {
        console.warn("Invalid Figure Fule Identifier Ref!", ref, rule);
        return [];
      }
    }

    if (!figureRule.identifier || !figureRule.identifier.health) {
      return gameManager.figuresByIdentifier(figureRule.identifier, figureRule.scenarioEffect);
    }

    return gameManager.figuresByIdentifier(figureRule.identifier, figureRule.scenarioEffect).filter((figure) => {
      if (figureRule.identifier && figureRule.identifier.health) {
        if (figure instanceof Character || figure instanceof Objective) {
          const health = EntityValueFunction(figureRule.identifier.health.replaceAll('H', '' + EntityValueFunction(figure.maxHealth)));
          return figure.health <= health;
        } else if (figure instanceof Monster) {
          return figure.entities.some((entity) => {
            if (figureRule.identifier && figureRule.identifier.health && gameManager.entityManager.isAlive(entity)) {
              const health = EntityValueFunction(figureRule.identifier.health.replaceAll('H', '' + EntityValueFunction(entity.maxHealth)));
              return entity.health <= health;
            }

            return false;
          });
        }
      }
      return false;
    })
  }

  entitiesByFigureRule(figureRule: ScenarioFigureRule, rule: ScenarioRule): Entity[] {
    const ref = figureRule.identifierRef;
    if (typeof ref == 'number') {
      if (ref >= 0 && ref < rule.figures.length && ref != rule.figures.indexOf(figureRule) && rule.figures.indexOf(figureRule) != rule.figures[ref].identifierRef) {
        return this.entitiesByFigureRule(rule.figures[ref], rule);
      } else {
        console.warn("Invalid Figure Fule Identifier Ref!", ref, rule);
        return [];
      }
    }
    if (!figureRule.identifier || !figureRule.identifier.health) {
      return gameManager.entitiesByIdentifier(figureRule.identifier, figureRule.scenarioEffect);
    }

    return gameManager.entitiesByIdentifier(figureRule.identifier, figureRule.scenarioEffect).filter((entity) => {
      if (figureRule.identifier && figureRule.identifier.health && gameManager.entityManager.isAlive(entity)) {
        const health = EntityValueFunction(figureRule.identifier.health.replaceAll('H', '' + EntityValueFunction(entity.maxHealth)));
        return entity.health <= health;
      }

      return false;
    });
  }
}
