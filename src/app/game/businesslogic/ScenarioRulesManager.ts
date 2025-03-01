import { moveItemInArray } from "@angular/cdk/drag-drop";
import { ghsShuffleArray } from "src/app/ui/helper/Static";
import { Character } from "../model/Character";
import { Entity, EntityValueFunction } from "../model/Entity";
import { Figure } from "../model/Figure";
import { Game, GameState } from "../model/Game";
import { Monster } from "../model/Monster";
import { MonsterEntity } from "../model/MonsterEntity";
import { ObjectiveContainer } from "../model/ObjectiveContainer";
import { ObjectiveEntity } from "../model/ObjectiveEntity";
import { AttackModifier, AttackModifierType } from "../model/data/AttackModifier";
import { Condition, ConditionName } from "../model/data/Condition";
import { FigureError, FigureErrorType } from "../model/data/FigureError";
import { MonsterStatEffect } from "../model/data/MonsterStat";
import { MonsterType } from "../model/data/MonsterType";
import { ScenarioObjectiveIdentifier } from "../model/data/ObjectiveData";
import { MonsterStandeeData } from "../model/data/RoomData";
import { ScenarioData } from "../model/data/ScenarioData";
import { MonsterSpawnData, ScenarioFigureRule, ScenarioRule, ScenarioRuleIdentifier } from "../model/data/ScenarioRule";
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
        if (!rule.alwaysApply || !settingsManager.settings.scenarioRulesAutoapply) {
          this.addScenarioRule(scenario, rule, index, false, initial);
        }
      })
    }

    if (this.game.sections) {
      this.game.sections.forEach((section) => {
        if (section.rules) {
          section.rules.forEach((rule, index) => {
            if (!rule.alwaysApply || !settingsManager.settings.scenarioRulesAutoapply) {
              this.addScenarioRule(section, rule, index, true, initial);
            }
          })
        }
      })
    }

    this.addScenarioErrata();
    this.filterDisabledScenarioRules();
  }

  addScenarioRulesAlways() {
    const scenario = this.game.scenario;
    if (scenario && scenario.rules) {
      scenario.rules.filter((rule) => this.game.round > 0 && rule.always || rule.alwaysApply || rule.alwaysApplyTurn).forEach((rule) => {
        if (rule.alwaysApply && settingsManager.settings.scenarioRulesAutoapply && this.scnearioRuleActive(rule, scenario.rules.indexOf(rule), false)) {
          this.applyRule(rule, { "edition": scenario.edition, "scenario": scenario.index, "group": scenario.group, "index": scenario.rules.indexOf(rule), "section": false });
        } else if (!this.game.discardedScenarioRules.find((identifier) => identifier.edition == scenario.edition && identifier.scenario == scenario.index && identifier.group == scenario.group && identifier.index == scenario.rules.indexOf(rule) && !identifier.section)) {
          this.addScenarioRule(scenario, rule, scenario.rules.indexOf(rule), false);
        }
      })
    }

    if (this.game.sections) {
      this.game.sections.forEach((section) => {
        if (section.rules) {
          section.rules.filter((rule) => this.game.round > 0 && rule.always || rule.alwaysApply || rule.alwaysApplyTurn).forEach((rule) => {
            if (rule.alwaysApply && settingsManager.settings.scenarioRulesAutoapply && this.scnearioRuleActive(rule, section.rules.indexOf(rule), true)) {
              this.applyRule(rule, { "edition": section.edition, "scenario": section.index, "group": section.group, "index": section.rules.indexOf(rule), "section": true });
              gameManager.game.scenarioRules.splice(gameManager.game.scenarioRules.length - 1, 1);
            } else if (!this.game.discardedScenarioRules.find((identifier) => identifier.edition == section.edition && identifier.scenario == section.index && identifier.group == section.group && identifier.index == section.rules.indexOf(rule) && identifier.section)) {
              this.addScenarioRule(section, rule, section.rules.indexOf(rule), true);
            }
          })
        }
      })
    }

    this.addScenarioErrata();
    this.filterDisabledScenarioRules();
  }

  applyScenarioRulesAlways() {
    const scenario = this.game.scenario;
    let rules: { identifier: ScenarioRuleIdentifier, rule: ScenarioRule }[] = [];
    if (scenario && scenario.rules) {
      rules.push(...scenario.rules.map((rule, index) => {
        const identifier = { "edition": scenario.edition, "scenario": scenario.index, "group": scenario.group, "index": index, "section": false };
        return { identifier: identifier, rule: rule };
      }).filter((ruleModel) => ruleModel.rule.alwaysApply && this.game.appliedScenarioRules.find((applied) => applied.edition == ruleModel.identifier.edition && applied.scenario == ruleModel.identifier.scenario && applied.group == ruleModel.identifier.group && applied.index == ruleModel.identifier.index && applied.section == ruleModel.identifier.section)))
    }

    if (this.game.sections) {
      this.game.sections.forEach((section) => {
        if (section.rules) {
          rules.push(...section.rules.map((rule, index) => {
            const identifier = { "edition": section.edition, "scenario": section.index, "group": section.group, "index": index, "section": true };
            return { identifier: identifier, rule: rule };
          }).filter((ruleModel) => ruleModel.rule.alwaysApply && this.game.appliedScenarioRules.find((applied) => applied.edition == ruleModel.identifier.edition && applied.scenario == ruleModel.identifier.scenario && applied.group == ruleModel.identifier.group && applied.index == ruleModel.identifier.index && applied.section == ruleModel.identifier.section)))
        }
      })
    }

    rules.forEach((ruleModel) => {
      if (this.scnearioRuleActive(ruleModel.rule, ruleModel.identifier.index, ruleModel.identifier.section)) {
        this.applyRule(ruleModel.rule, ruleModel.identifier);
      }
    })
  }


  applyScenarioRulesTurn(entity: Entity, after: boolean = false) {
    const scenario = this.game.scenario;
    let rules: { identifier: ScenarioRuleIdentifier, rule: ScenarioRule }[] = [];
    if (scenario && scenario.rules) {
      rules.push(...scenario.rules.map((rule, index) => {
        const identifier = { "edition": scenario.edition, "scenario": scenario.index, "group": scenario.group, "index": index, "section": false };
        return { identifier: identifier, rule: rule };
      }).filter((ruleModel) => ruleModel.rule.alwaysApplyTurn && (!after && ruleModel.rule.alwaysApplyTurn == "turn" || after && ruleModel.rule.alwaysApplyTurn == "after") && this.game.appliedScenarioRules.find((applied) => applied.edition == ruleModel.identifier.edition && applied.scenario == ruleModel.identifier.scenario && applied.group == ruleModel.identifier.group && applied.index == ruleModel.identifier.index && applied.section == ruleModel.identifier.section)));
    }

    if (this.game.sections) {
      this.game.sections.forEach((section) => {
        if (section.rules) {
          rules.push(...section.rules.map((rule, index) => {
            const identifier = { "edition": section.edition, "scenario": section.index, "group": section.group, "index": index, "section": true };
            return { identifier: identifier, rule: rule };
          }).filter((ruleModel) => ruleModel.rule.alwaysApplyTurn && (!after && ruleModel.rule.alwaysApplyTurn == "turn" || after && ruleModel.rule.alwaysApplyTurn == "after") && this.game.appliedScenarioRules.find((applied) => applied.edition == ruleModel.identifier.edition && applied.scenario == ruleModel.identifier.scenario && applied.group == ruleModel.identifier.group && applied.index == ruleModel.identifier.index && applied.section == ruleModel.identifier.section)))
        }
      })
    }

    rules.forEach((ruleModel) => {
      this.applyRule(ruleModel.rule, ruleModel.identifier, [entity]);
    })
  }

  addScenarioErrata() {
    const scenario = this.game.scenario;
    if (scenario && scenario.errata) {
      scenario.errata.split('|').forEach((errata, index) => {
        this.addScenarioRule(scenario, this.createErrataRule(scenario.edition, errata), -1 - index, false);
      })
    }

    if (this.game.sections) {
      this.game.sections.forEach((section) => {
        if (section && section.errata) {
          section.errata.split('|').forEach((errata, index) => {
            this.addScenarioRule(section, this.createErrataRule(section.edition, errata), -1 - index, false);
          })
        }
      })
    }
  }

  createErrataRule(edition: string, errata: string): ScenarioRule {
    let errataRule = new ScenarioRule("true");
    errataRule.always = true;
    errataRule.once = true;
    errataRule.note = '%errata%:&nbsp;%data.custom.' + edition + '.errata.' + errata + '%';
    return errataRule;
  }

  filterDisabledScenarioRules() {
    this.game.scenarioRules = this.game.scenarioRules.filter((ruleModel, index, self) => !self.find((disableRule) => disableRule.rule.disableRules && disableRule.rule.disableRules.some((value) => value.edition == ruleModel.identifier.edition && value.group == ruleModel.identifier.group && (value.index == ruleModel.identifier.index || value.index == -1) && value.scenario == ruleModel.identifier.scenario && value.section == ruleModel.identifier.section)));
  }

  scnearioRuleActive(rule: ScenarioRule, index: number, section: boolean, initial: boolean = false): boolean {
    let round = rule.round || 'false';
    let active: boolean = false;

    while (round.indexOf('R') != -1) {
      round = round.replace('R', '' + (rule.start ? (this.game.round + 1) : this.game.round));
    }

    while (round.indexOf('C') != -1) {
      round = round.replace('C', '' + gameManager.characterManager.characterCount());
    }

    try {
      active = eval(round) && (rule.always || this.game.state == GameState.next || rule.start && initial);
    } catch (error) {
      console.warn("Cannot apply scenario rule: '" + rule.round + "'", "index: " + index, error);
      active = false;
    }

    if (active) {
      if (rule.figures && rule.figures.filter((figureRule) => figureRule.type == "present" || figureRule.type == "dead").length > 0) {
        rule.figures.filter((figureRule) => figureRule.type == "present" || figureRule.type == "dead").forEach((figureRule) => {
          const gameplayFigures: Entity[] = this.presentEntitiesByFigureRule(figureRule, rule);
          const tolerance: number = figureRule.value ? EntityValueFunction(figureRule.value.split(':')[0]) : (figureRule.type == "present" ? 1 : 0);
          active = active && tolerance >= 0 && (figureRule.type == "present" ? gameplayFigures.length >= tolerance : gameplayFigures.length <= tolerance);
          if (figureRule.identifier && (figureRule.identifier.marker || figureRule.identifier.tags && figureRule.identifier.tags.length > 0) && !settingsManager.settings.automaticStandees) {
            active = false;
          }
        })
      }

      if (active) {
        if (rule.figures && rule.figures.filter((figureRule) => figureRule.type == "killed").length > 0) {
          rule.figures.filter((figureRule) => figureRule.type == "killed").forEach((figureRule) => {
            if (!figureRule.identifier) {
              active = false;
            } else {
              const counters = gameManager.entityCounters(figureRule.identifier);
              active = active && counters.length > 0;
              if (active) {
                if (figureRule.value == "all") {
                  counters.forEach((counter) => {
                    active = active && counter && counter.total > 0 && counter.killed >= counter.total || false;
                  })
                } else {
                  const value = EntityValueFunction(figureRule.value || 0);
                  let count = 0;
                  counters.forEach((counter) => {
                    count += counter.killed;
                  })
                  active = active && count > 0 && count >= value || false;
                }
              }
            }
          })
        }
      }

      if (active) {
        if (rule.figures && rule.figures.filter((figureRule) => figureRule.type == "initiative").length > 0) {
          rule.figures.filter((figureRule) => figureRule.type == "initiative").forEach((figureRule) => {
            if (!figureRule.identifier) {
              active = false;
            } else {
              const figures = this.figuresByFigureRule(figureRule, rule);
              active = active && figures.length && (figures.find((figure) => {
                if (!figure.active) {
                  return false;
                }
                if (!isNaN(+figureRule.value)) {
                  return figure.getInitiative() == +figureRule.value;
                } else {
                  return eval(figure.getInitiative() + " " + figureRule.value);
                }
              }) != undefined || figures.every((figure) => !figure.active && isNaN(+figureRule.value) && !eval(figure.getInitiative() + " " + figureRule.value))) || false;
            }
          })
        }
      }

      if (rule.requiredRooms && rule.requiredRooms.length) {
        rule.requiredRooms.forEach((room) => {
          active = active && gameManager.game.scenario != undefined && gameManager.game.scenario.revealedRooms.indexOf(room) != -1;
        })
      }

      if (rule.requiredRules && rule.requiredRules.length) {
        rule.requiredRules.forEach((other) => {
          active = active && this.game.appliedScenarioRules.some((identifier) => other.edition == identifier.edition && other.scenario == identifier.scenario && other.group == identifier.group && other.index == identifier.index && other.section == identifier.section);
        })
      }

      if (rule.rooms && rule.rooms.length && rule.rooms.every((roomNumber) => gameManager.game.scenario && gameManager.game.scenario.revealedRooms.indexOf(roomNumber) != -1)) {
        active = false;
      }

      if (rule.treasures) {
        let treasures = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => (figure as Character).treasures.map((treasure) => typeof treasure === 'number' ? treasure : 'G')).flat();
        if ((typeof rule.treasures === 'number' || typeof rule.treasures === 'string') && treasures.length < EntityValueFunction(rule.treasures)) {
          active = false;
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
            active = false;
          }
        }
      }
    }

    return active;
  }

  addScenarioRule(scenarioData: ScenarioData, rule: ScenarioRule, index: number, section: boolean, initial: boolean = false) {
    const add = this.scnearioRuleActive(rule, index, section, initial);

    const identifier = { "edition": scenarioData.edition, "scenario": scenarioData.index, "group": scenarioData.group, "index": index, "section": section };

    const applied = this.game.appliedScenarioRules.find((applied) => applied.edition == identifier.edition && applied.scenario == identifier.scenario && applied.group == identifier.group && applied.index == identifier.index && applied.section == identifier.section);

    const discarded = this.game.discardedScenarioRules.find((discarded) => discarded.edition == identifier.edition && discarded.scenario == identifier.scenario && discarded.group == identifier.group && discarded.index == identifier.index && discarded.section == identifier.section);

    const visible = this.game.scenarioRules.find((ruleModel) => ruleModel.identifier.edition == identifier.edition && ruleModel.identifier.scenario == identifier.scenario && ruleModel.identifier.group == identifier.group && ruleModel.identifier.index == identifier.index && ruleModel.identifier.section == identifier.section);

    if (add && !applied && !discarded && !visible) {
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

    if (!figureRule.identifier || !figureRule.identifier.health && !figureRule.identifier.hp && (!figureRule.identifier.conditions || figureRule.identifier.conditions.length == 0)) {
      return gameManager.figuresByIdentifier(figureRule.identifier, figureRule.scenarioEffect);
    }

    return gameManager.figuresByIdentifier(figureRule.identifier, figureRule.scenarioEffect).filter((figure) => {
      if (figureRule.identifier && figureRule.identifier.number) {
        if (figure instanceof Monster && figure.entities.every((entity) => figureRule.identifier && figureRule.identifier.number && !eval(figureRule.identifier.number.replaceAll('N', '' + entity.number)))) {
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
          return eval(figureRule.identifier.hp.replaceAll('HP', '' + figure.health).replaceAll('H', '' + EntityValueFunction(figure.maxHealth)));
        } else if (figure instanceof Monster || figure instanceof ObjectiveContainer) {
          return figure.entities.some((entity) => {
            if (figureRule.identifier && figureRule.identifier.hp && gameManager.entityManager.isAlive(entity)) {
              return eval(figureRule.identifier.hp.replaceAll('HP', '' + entity.health).replaceAll('H', '' + EntityValueFunction(entity.maxHealth)));
            }

            return false;
          });
        }
      }

      if (figureRule.identifier && figureRule.identifier.conditions) {
        if (figure instanceof Character) {
          return figureRule.identifier.conditions.every((condition) => condition.startsWith('!') && !gameManager.entityManager.hasCondition(figure, new Condition(condition.substring(1))) || !condition.startsWith('!') && gameManager.entityManager.hasCondition(figure, new Condition(condition)));
        } else if (figure instanceof Monster || figure instanceof ObjectiveContainer) {
          return figure.entities.some((entity) => {
            if (figureRule.identifier && figureRule.identifier.health && gameManager.entityManager.isAlive(entity)) {
              return figureRule.identifier.conditions && figureRule.identifier.conditions.every((condition) => condition.startsWith('!') && !gameManager.entityManager.hasCondition(entity, new Condition(condition.substring(1))) || !condition.startsWith('!') && gameManager.entityManager.hasCondition(entity, new Condition(condition)));
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
    if (!figureRule.identifier || !figureRule.identifier.number && !figureRule.identifier.health && !figureRule.identifier.hp && (!figureRule.identifier.conditions || figureRule.identifier.conditions.length == 0)) {
      return gameManager.entitiesByIdentifier(figureRule.identifier, figureRule.scenarioEffect);
    }

    return gameManager.entitiesByIdentifier(figureRule.identifier, figureRule.scenarioEffect).filter((entity) => {
      let filter = true;
      if (figureRule.identifier && figureRule.identifier.health && gameManager.entityManager.isAlive(entity)) {
        const health = EntityValueFunction(figureRule.identifier.health.replaceAll('H', '' + EntityValueFunction(entity.maxHealth)));
        filter = filter && entity.health <= health;
      }

      if (figureRule.identifier && figureRule.identifier.hp && gameManager.entityManager.isAlive(entity)) {
        filter = filter && eval(figureRule.identifier.hp.replaceAll('HP', '' + entity.health).replaceAll('H', '' + EntityValueFunction(entity.maxHealth)));
      }

      if (figureRule.identifier && figureRule.identifier.conditions) {
        filter = filter && figureRule.identifier.conditions.every((condition) => condition.startsWith('!') && !gameManager.entityManager.hasCondition(entity, new Condition(condition.substring(1))) || !condition.startsWith('!') && gameManager.entityManager.hasCondition(entity, new Condition(condition)));
      }

      if (figureRule.identifier && figureRule.identifier.number) {
        filter = filter && eval(figureRule.identifier.number.replaceAll('N', '' + entity.number));
      }

      return filter;
    });
  }

  presentEntitiesByFigureRule(figureRule: ScenarioFigureRule, rule: ScenarioRule): Entity[] {
    return this.entitiesByFigureRule(figureRule, rule).filter((entity) => (gameManager.entityManager.isAlive(entity) || entity instanceof MonsterEntity && entity.dormant) && (!(entity instanceof MonsterEntity) || (!(figureRule.identifier?.marker) || (entity instanceof MonsterEntity && figureRule.identifier && entity.marker == figureRule.identifier.marker && (!figureRule.identifier.tags || figureRule.identifier.tags.length == 0 || (entity instanceof MonsterEntity && figureRule.identifier.tags.forEach((tag) => entity.tags.indexOf(tag) != -1)))))))
  }

  applyRule(rule: ScenarioRule, identifier: ScenarioRuleIdentifier, entityFilter: Entity[] | undefined = undefined) {

    const scenario = gameManager.scenarioRulesManager.getScenarioForRule(identifier).scenario;
    const section = gameManager.scenarioRulesManager.getScenarioForRule(identifier).section;
    if (scenario) {
      if (rule.figures) {
        rule.figures.filter((figureRule) => figureRule.type == "remove").forEach((figureRule) => {
          const figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
          figures.forEach((figure) => {
            if (figure instanceof ObjectiveContainer) {
              gameManager.objectiveManager.removeObjective(figure);
            } else if (figure instanceof Monster) {
              gameManager.monsterManager.removeMonster(figure);
            }
          })
        })
      }

      if (rule.spawns) {
        let checkActive: string[] = [];
        rule.spawns.forEach((spawn) => {
          const type = this.spawnType(spawn.monster);
          if (scenario && (type == MonsterType.boss || type == MonsterType.elite)) {
            checkActive.push(...this.applySpawnRule(scenario, rule, spawn, type));
          }
        })

        rule.spawns.forEach((spawn) => {
          const type = this.spawnType(spawn.monster);
          if (scenario && type == MonsterType.normal) {
            checkActive.push(...this.applySpawnRule(scenario, rule, spawn, type));
          }
        })
      }

      if (rule.objectiveSpawns) {
        rule.objectiveSpawns.forEach((spawn) => {
          const objectiveIdentifier: ScenarioObjectiveIdentifier = { "edition": scenario.edition, "scenario": scenario.index, "group": scenario.group, "section": section, "index": spawn.objective.id - 1 };
          const objectiveData = gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(objectiveIdentifier);
          if (objectiveData && spawn.count != 0) {
            const count = EntityValueFunction(spawn.count || 1);
            let objective = gameManager.objectiveManager.addObjective(objectiveData, objectiveData.name, objectiveIdentifier);
            if (objective) {
              if (spawn.objective.marker) {
                objective.marker = spawn.objective.marker;
              }
            }
            for (let i = 0; i < count; i++) {
              const objectiveEntity = gameManager.objectiveManager.addObjectiveEntity(objective);
              if (spawn.objective.tags) {
                objectiveEntity.tags = spawn.objective.tags;
              }
              if (objective.marker || objectiveEntity.tags.length > 0) {
                gameManager.addEntityCount(objective);
              }
            }
          }
        })
      }

      if (rule.elements) {
        rule.elements.forEach((ruleElement) => {
          gameManager.game.elementBoard.forEach((element) => {
            if (ruleElement && element.type == ruleElement.type) {
              element.state = ruleElement.state;
            }
          })
        })
      }


      if (rule.figures) {
        rule.figures.filter((figureRule) => figureRule.type == "gainCondition" || figureRule.type == "permanentCondition" || figureRule.type == "loseCondition" || figureRule.type == "damage" || figureRule.type == "heal" || figureRule.type == "setHp" || figureRule.type == "dormant" || figureRule.type == "activate" || figureRule.type == "removeEntity").forEach((figureRule) => {
          let figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
          let ruleEntities: Entity[] = gameManager.scenarioRulesManager.entitiesByFigureRule(figureRule, rule);
          figures.forEach((figure) => {
            let entities: Entity[] = gameManager.entityManager.entitiesAll(figure).filter((entity) => ruleEntities.indexOf(entity) != -1 && (!entityFilter || entityFilter.indexOf(entity) != -1));
            entities.forEach((entity) => {
              switch (figureRule.type) {
                case "gainCondition":
                  let gainCondition = new Condition(figureRule.value);
                  if (!gameManager.entityManager.hasCondition(entity, gainCondition)) {
                    gameManager.entityManager.addCondition(entity, figure, gainCondition);
                  }
                  break;
                case "permanentCondition":
                  let permanentCondition = new Condition(figureRule.value);
                  if (!gameManager.entityManager.hasCondition(entity, permanentCondition, true)) {
                    gameManager.entityManager.addCondition(entity, figure, permanentCondition, true);
                  }
                  break;
                case "loseCondition":
                  let loseCondition = new Condition(figureRule.value);
                  if (gameManager.entityManager.hasCondition(entity, loseCondition)) {
                    gameManager.entityManager.removeCondition(entity, figure, loseCondition);
                  }
                  break;
                case "damage": let damage = 0;
                  if (isNaN(+figureRule.value) && figureRule.value.indexOf('H') != -1) {
                    damage = +EntityValueFunction(figureRule.value.replaceAll('HP', '' + entity.health).replaceAll('H', '' + EntityValueFunction(entity.maxHealth)));
                  } else {
                    damage = +EntityValueFunction(figureRule.value);
                  }
                  if (damage < 0) {
                    damage = 0;
                  } else if (damage > EntityValueFunction(entity.maxHealth)) {
                    damage = EntityValueFunction(entity.maxHealth);
                  }
                  gameManager.entityManager.changeHealth(entity, figure, -damage);
                  break;
                case "heal":
                  let heal = 0;
                  if (isNaN(+figureRule.value) && figureRule.value.indexOf('H') != -1) {
                    heal = +EntityValueFunction(figureRule.value.replaceAll('HP', '' + entity.health).replaceAll('H', '' + EntityValueFunction(entity.maxHealth)));
                  } else {
                    heal = +EntityValueFunction(figureRule.value);
                  }
                  if (heal < 0) {
                    heal = 0;
                  }

                  entity.health += heal;
                  gameManager.entityManager.addCondition(entity, figure, new Condition(ConditionName.heal, heal));
                  gameManager.entityManager.applyCondition(entity, figure, ConditionName.heal, true);
                  break;
                case "setHp":
                  let hp = 0;
                  if (isNaN(+figureRule.value) && figureRule.value.indexOf('H') != -1) {
                    hp = +EntityValueFunction(figureRule.value.replaceAll('HP', '' + entity.health).replaceAll('H', '' + EntityValueFunction(entity.maxHealth)));
                  } else {
                    hp = +EntityValueFunction(figureRule.value);
                  }
                  if (hp < 0) {
                    hp = 0;
                  } else if (hp > EntityValueFunction(entity.maxHealth)) {
                    hp = EntityValueFunction(entity.maxHealth);
                  }

                  entity.health = hp;
                  break;
                case "dormant":
                  if (entity instanceof MonsterEntity) {
                    entity.dormant = true;
                    entity.revealed = false;
                  }
                  break;
                case "activate":
                  if (entity instanceof MonsterEntity) {
                    entity.dormant = false;
                  }
                  break;
                case "removeEntity":
                  entity.tags.push("ignore-kill");
                  if (entity instanceof Character) {
                    gameManager.characterManager.removeCharacter(entity);
                  } else if (figure instanceof Monster && entity instanceof MonsterEntity) {
                    gameManager.monsterManager.removeMonsterEntity(figure, entity);
                  } else if (figure instanceof ObjectiveContainer && entity instanceof ObjectiveEntity) {
                    gameManager.objectiveManager.removeObjectiveEntity(figure, entity)
                  }
                  if (figureRule.identifier) {
                    gameManager.entityCounters(figureRule.identifier).forEach((entityCounter) => {
                      entityCounter.total -= 1;
                    })
                  }
                  break;
              }
            })
          })
        })

        rule.figures.filter((figureRule) => figureRule.type == "toggleOff" || figureRule.type == "toggleOn").forEach((figureRule) => {
          const figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
          figures.forEach((figure) => {
            figure.off = figureRule.type == "toggleOff";
            if (figure instanceof Monster) {
              figure.entities.forEach((entity) => {
                entity.dormant = figureRule.type == "toggleOff";
              })
            }
          })
        })

        rule.figures.filter((figureRule) => figureRule.type == "transfer" || figureRule.type == "transferEntities").forEach((figureRule) => {
          const figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
          const entities: Entity[] = gameManager.scenarioRulesManager.entitiesByFigureRule(figureRule, rule);
          if (figures.length == 1 && figures[0] instanceof Monster) {
            const figure = figures[0];
            const monster = gameManager.monsterManager.addMonsterByName(figureRule.value, scenario.edition);
            if (monster) {
              if (figureRule.type == "transfer") {
                if (figureRule.value.indexOf(':') == -1) {
                  monster.level = figure.level;
                }
                monster.active = figure.active;
                monster.drawExtra = figure.drawExtra;
                monster.lastDraw = figure.lastDraw;
                monster.ability = figure.ability;
                monster.isAlly = figure.isAlly;
                monster.isAllied = figure.isAllied;
                if (figureRule.identifier) {
                  gameManager.entityCounters(figureRule.identifier).forEach((entityCounter) => {
                    entityCounter.total -= figure.entities.length;
                  })
                }
                monster.entities = [...monster.entities, ...figure.entities];
                figure.entities.forEach((entity) => {
                  gameManager.addEntityCount(monster, entity);
                })
              } else {
                if (figureRule.identifier) {
                  gameManager.entityCounters(figureRule.identifier).forEach((entityCounter) => {
                    entityCounter.total -= entities.length;
                  })
                }
                monster.entities = [...monster.entities, ...entities.filter((entity) => entity instanceof MonsterEntity).map((entity) => entity as MonsterEntity)];
                entities.forEach((entity) => {
                  gameManager.addEntityCount(monster, entity);
                })
              }

              monster.entities.forEach((entity) => {
                const figureStat = figure.stats.find((stat) => {
                  return stat.level == figure.level && stat.type == entity.type;
                });
                const stat = monster.stats.find((stat) => {
                  return stat.level == monster.level && stat.type == entity.type;
                });

                if (!stat) {
                  monster.errors = monster.errors || [];
                  if (!monster.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !monster.errors.find((figureError) => figureError.type == FigureErrorType.stat)) {
                    console.error("Could not find '" + entity.type + "' stats for monster: " + monster.name + " level: " + monster.level);
                    monster.errors.push(new FigureError(FigureErrorType.stat, "monster", monster.name, monster.edition, entity.type, "" + monster.level));
                  }
                } else {
                  entity.stat = stat;
                  if (figureStat && entity.maxHealth == EntityValueFunction(figureStat.health)) {
                    entity.maxHealth = EntityValueFunction(stat.health);
                  }

                }

                if (entity.health > entity.maxHealth || entity.maxHealth == 0 && entity.health > 0) {
                  entity.health = entity.maxHealth;
                }
              })

              if (monster != figure) {
                if (figureRule.type == "transfer") {
                  gameManager.monsterManager.removeMonster(figure);
                } else {
                  figure.entities = figure.entities.filter((entity) => entities.indexOf(entity) == -1);
                }
              }
              monster.off = gameManager.monsterManager.monsterEntityCount(monster) == 0;
              figure.off = gameManager.monsterManager.monsterEntityCount(figure) == 0;
              gameManager.sortFigures(monster);
            }
          } else if (figures.length == 1 && figures[0] instanceof ObjectiveContainer) {
            const figure = figures[0];
            const objectiveIdentifier: ScenarioObjectiveIdentifier = { "edition": scenario.edition, "scenario": scenario.index, "group": scenario.group, "section": section, "index": (+figureRule.value) - 1 };

            const objectiveData = scenario.objectives[(+figureRule.value) - 1];
            let objectiveContainer = gameManager.objectiveManager.addObjective(objectiveData, undefined, objectiveIdentifier);

            objectiveContainer.entities = figure.entities;

            objectiveContainer.entities.forEach((entity) => {
              entity.maxHealth = EntityValueFunction(figure.health);
              if (entity.health > entity.maxHealth) {
                entity.health = entity.maxHealth;
              }
              if (objectiveData) {
                if (objectiveData.tags) {
                  entity.tags = objectiveData.tags;
                }
                if (objectiveData.marker) {
                  entity.marker = objectiveData.marker;
                }
              }
            })

            gameManager.objectiveManager.removeObjective(figure);
          }
        })

        rule.figures.filter((figureRule) => figureRule.type == "amAdd" || figureRule.type == "amRemove").forEach((figureRule) => {
          const figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
          figures.forEach((figure) => {
            const deck = gameManager.attackModifierManager.byFigure(figure);
            const type: AttackModifierType = figureRule.value.split(':')[0] as AttackModifierType;
            let value = +(figureRule.value.split(':')[1]);
            if (figureRule.type == "amAdd") {
              for (let i = 0; i < value; i++) {
                if (type == AttackModifierType.bless && gameManager.attackModifierManager.countUpcomingBlesses() >= 10) {
                  return;
                } else if (type == AttackModifierType.curse && gameManager.attackModifierManager.countUpcomingCurses((figure instanceof Monster && !figure.isAlly && !figure.isAllied)) >= 10) {
                  return;
                } else if (type == AttackModifierType.minus1 && gameManager.attackModifierManager.countExtraMinus1() >= 15) {
                  return;
                } else {
                  gameManager.attackModifierManager.addModifier(deck, new AttackModifier(type));
                }
              }
            } else {
              let card = deck.cards.find((attackModifier, index) => {
                return attackModifier.type == type && index > deck.current;
              });
              while (card && value > 0) {
                deck.cards.splice(deck.cards.indexOf(card), 1);
                card = deck.cards.find((attackModifier, index) => {
                  return attackModifier.type == type && index > deck.current;
                });
                value--;
              }
              if (value > 0) {
                let card = deck.cards.find((attackModifier) => {
                  return attackModifier.type == type;
                });
                while (card && value < 0) {
                  deck.cards.splice(deck.cards.indexOf(card), 1);
                  card = deck.cards.find((attackModifier) => {
                    return attackModifier.type == type;
                  });
                  value--;
                }
              }
            }

          })
        })

        rule.figures.filter((figureRule) => figureRule.type == "setAbility" || figureRule.type == "drawAbility" || figureRule.type == "discardAbilityToBottom").forEach((figureRule) => {
          const figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
          figures.forEach((figure) => {
            if (figure instanceof Monster) {
              if (figureRule.type == "setAbility") {
                const ability = gameManager.abilities(figure).find((ability) => isNaN(+figureRule.value) ? ability.name == figureRule.value : ability.cardId == (+figureRule.value));
                if (ability) {
                  const index = gameManager.abilities(figure).indexOf(ability);
                  if (index != -1) {
                    figure.abilities = figure.abilities.filter((number) => number != index);
                    figure.abilities.unshift(index);
                    figure.ability = gameManager.game.state == GameState.draw ? -1 : 0;
                  }
                }
              } else if (figureRule.type == "drawAbility") {
                gameManager.monsterManager.drawAbility(figure);
              } else if (figureRule.type == "discardAbilityToBottom") {
                moveItemInArray(figure.abilities, figure.ability, 0);
              }
            }
          })
        })
      }

      if (rule.statEffects) {
        rule.statEffects.forEach((statEffectRule) => {
          const figures: Figure[] = gameManager.figuresByIdentifier(statEffectRule.identifier);
          let referenceValue: number = 0;
          if (statEffectRule.reference && (statEffectRule.reference.type == "present" || statEffectRule.reference.type == "killed")) {
            const referenceCount = gameManager.scenarioRulesManager.presentEntitiesByFigureRule(statEffectRule.reference, rule).length;
            const offset: number = statEffectRule.reference.value ? EntityValueFunction(statEffectRule.reference.value.split(':')[0]) : 0;
            referenceValue = statEffectRule.reference.type == "present" ? referenceCount + offset : offset - referenceCount;
          }

          figures.forEach((figure) => {
            if (figure instanceof Monster) {
              let statEffect = new MonsterStatEffect();

              statEffect.name = statEffectRule.statEffect.name;

              if (statEffectRule.statEffect.health) {
                statEffect.health = ('' + statEffectRule.statEffect.health).replaceAll('X', '' + referenceValue);
              }
              if (statEffectRule.statEffect.movement) {
                statEffect.movement = ('' + statEffectRule.statEffect.movement).replaceAll('X', '' + referenceValue);
              }
              if (statEffectRule.statEffect.attack) {
                statEffect.attack = ('' + statEffectRule.statEffect.attack).replaceAll('X', '' + referenceValue);
              }
              if (statEffectRule.statEffect.range) {
                statEffect.range = ('' + statEffectRule.statEffect.range).replaceAll('X', '' + referenceValue);
              }

              statEffect.initiative = statEffectRule.statEffect.initiative;
              statEffect.flying = statEffectRule.statEffect.flying;
              statEffect.actions = statEffectRule.statEffect.actions;
              statEffect.special = statEffectRule.statEffect.special;
              statEffect.immunities = statEffectRule.statEffect.immunities;
              statEffect.deck = statEffectRule.statEffect.deck;
              statEffect.absolute = statEffectRule.statEffect.absolute || false;

              statEffect.note = statEffectRule.note;

              if (statEffect.absolute || (statEffect.health || statEffect.movement || statEffect.attack || statEffect.range || statEffect.initiative || statEffect.actions && statEffect.actions.length || statEffect.immunities && statEffect.immunities.length || statEffect.deck || statEffect.name || statEffect.flying != undefined)) {
                figure.statEffect = statEffect;
              } else {
                figure.statEffect = undefined;
              }

              if (figure.statEffect && figure.statEffect.initiative) {
                gameManager.sortFigures();
              }
            }
          })
        })
      }

      if (rule.randomDungeon && rule.randomDungeon.monsterCount && gameManager.game.scenario) {
        const shuffledSections = ghsShuffleArray(gameManager.sectionData(gameManager.game.scenario.edition, true).filter((sectionData) => sectionData.group == 'randomMonsterCard' && rule.randomDungeon && (!rule.randomDungeon.monsterCards || rule.randomDungeon.monsterCards.indexOf(sectionData.index) != -1) && (!gameManager.game.scenario || !gameManager.game.scenario.additionalSections || gameManager.game.scenario.additionalSections.indexOf(sectionData.index) == -1)));
        if (shuffledSections.length >= rule.randomDungeon.monsterCount) {
          gameManager.game.scenario.additionalSections = gameManager.game.scenario.additionalSections || [];
          gameManager.game.scenario.additionalSections.push(...shuffledSections.slice(0, rule.randomDungeon.monsterCount).map((sectionData) => sectionData.index));
          if (rule.randomDungeon.initial) {
            gameManager.scenarioManager.addSection(shuffledSections[0]);
          }
        }
      }
    }
  }

  spawns(rule: ScenarioRule): MonsterSpawnData[] {
    return rule.spawns && rule.spawns.filter((spawn) => this.spawnType(spawn.monster)) || [];
  }

  spawnType(monsterStandeeData: MonsterStandeeData): MonsterType | undefined {
    let type: MonsterType | undefined = monsterStandeeData.type;

    if (!type) {
      const charCount = Math.max(2, gameManager.characterManager.characterCount());
      if (charCount < 3) {
        type = monsterStandeeData.player2;
      } else if (charCount == 3) {
        type = monsterStandeeData.player3;
      } else {
        type = monsterStandeeData.player4;
      }
    }

    return type;
  }

  spawnCount(rule: ScenarioRule, spawn: MonsterSpawnData): number {
    let count = spawn.count;
    let F = 0;
    if (count && rule.figures) {
      const figureRule = rule.figures.find((figureRule) => figureRule.type == "present" || figureRule.type == "dead");
      if (figureRule) {
        const gameplayEntities: Entity[] = gameManager.scenarioRulesManager.entitiesByFigureRule(figureRule, rule).filter((entity) => gameManager.entityManager.isAlive(entity) && (!(entity instanceof MonsterEntity) || !(figureRule.identifier?.marker) || (entity instanceof MonsterEntity && entity.marker == figureRule.identifier?.marker)));
        const max: number = figureRule.value && figureRule.value.split(':').length > 1 ? EntityValueFunction(figureRule.value.split(':')[1]) : 0;
        F = figureRule.type == "present" ? gameplayEntities.length : Math.max(0, max - gameplayEntities.length);
      }
    }

    while (typeof count == 'string' && count.indexOf('F') != -1) {
      count = count.replace('F', '' + F);
    }

    return EntityValueFunction(count || (spawn.manual ? 0 : 1));
  }



  applySpawnRule(scenario: ScenarioData, rule: ScenarioRule, spawn: MonsterSpawnData, type: MonsterType): string[] {
    const monster = gameManager.monsterManager.addMonsterByName(spawn.monster.name, scenario.edition);
    let checkActive: string[] = [];
    if (monster) {
      for (let i = 0; i < this.spawnCount(rule, spawn); i++) {
        let entity = gameManager.monsterManager.spawnMonsterEntity(monster, type, scenario.allies && scenario.allies.indexOf(spawn.monster.name) != -1, scenario.allied && scenario.allied.indexOf(spawn.monster.name) != -1, scenario.drawExtra && scenario.drawExtra.indexOf(spawn.monster.name) != -1, spawn.summon);
        if (entity) {
          if (spawn.monster.marker) {
            entity.marker = spawn.monster.marker;
          }
          if (spawn.monster.tags) {
            entity.tags = spawn.monster.tags;
          }
          checkActive.push(spawn.monster.name);
          if (entity.marker || entity.tags.length > 0) {
            gameManager.addEntityCount(monster, entity);
          }
        }
      }
    }
    return checkActive;
  }
}
