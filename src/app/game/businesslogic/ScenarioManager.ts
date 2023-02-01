import { Character } from "../model/Character";
import { ScenarioObjectiveIdentifier } from "../model/data/ObjectiveData";
import { RoomData } from "../model/data/RoomData";
import { ScenarioData } from "../model/data/ScenarioData";
import { ScenarioRule, ScenarioRuleIdentifier } from "../model/data/ScenarioRule";
import { EntityValueFunction } from "../model/Entity";
import { Figure } from "../model/Figure";
import { Game, GameState } from "../model/Game";
import { Monster } from "../model/Monster";
import { MonsterEntity } from "../model/MonsterEntity";
import { MonsterType } from "../model/MonsterType";
import { GameScenarioModel, Scenario } from "../model/Scenario";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class ScenarioManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }


  setScenario(scenario: Scenario | undefined) {
    this.game.scenario = scenario ? new Scenario(scenario, scenario.revealedRooms, scenario.custom) : undefined;
    if (scenario && !scenario.custom) {
      const scenarioData = gameManager.scenarioData().find((scenarioData) => scenarioData.index == scenario.index && scenarioData.edition == scenario.edition && scenarioData.group == scenario.group);
      if (!scenarioData) {
        console.error("Could not find scenario data!");
        return;
      }
      gameManager.roundManager.resetScenario();
      this.applyScenarioData(scenarioData);
      this.addScenarioRules(true);
    } else if (!scenario) {
      gameManager.roundManager.resetScenario();
    }
  }

  finishScenario(success: boolean = true) {
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character && !figure.absent) {
        gameManager.characterManager.addXP(figure, (success ? gameManager.levelManager.experience() : 0) + figure.experience);
        figure.progress.gold += figure.loot * gameManager.levelManager.loot();
      }
    })

    if (success && this.game.party && this.game.scenario) {
      this.game.party.scenarios.push(new GameScenarioModel(this.game.scenario.index, this.game.scenario.edition, this.game.scenario.group, this.game.scenario.custom, this.game.scenario.custom ? this.game.scenario.name : "", this.game.scenario.revealedRooms));
      this.game.party.manualScenarios = this.game.party.manualScenarios.filter((identifier) => this.game.scenario && (this.game.scenario.index != identifier.index || this.game.scenario.edition != identifier.edition || this.game.scenario.group != identifier.group));
    }

    this.game.scenario = undefined;
    this.game.sections = [];
    gameManager.roundManager.resetScenario();

    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        figure.absent = false;
      }
    });
  }


  addSection(section: ScenarioData) {
    if (!this.game.sections.some((value) => value.edition == section.edition && value.index == section.index && value.group == section.group)) {
      this.game.sections.push(new Scenario(section, []));
      this.applyScenarioData(section, true);
      if (section.rules) {
        section.rules.forEach((rule, index) => {
          this.addScenarioRule(section, rule, index, true);
        })

        this.filterDisabledScenarioRules();
      }
    }
  }

  applyScenarioData(scenarioData: ScenarioData, section: boolean = false) {
    if (settingsManager.settings.disableStandees || !settingsManager.settings.scenarioRooms || !scenarioData.rooms || scenarioData.rooms.length == 0) {
      if (scenarioData.monsters) {
        scenarioData.monsters.forEach((name) => {
          let monster = gameManager.monsterManager.addMonsterByName(name, scenarioData.edition);
          if (monster && scenarioData.allies && scenarioData.allies.indexOf(name) != -1) {
            monster.isAlly = true;
          }
          if (monster && scenarioData.drawExtra && scenarioData.drawExtra.indexOf(name) != -1) {
            monster.drawExtra = true;
          }
        });
      }

      if (scenarioData.objectives) {
        scenarioData.objectives.forEach((objectiveData, index) => {
          const objectiveIdentifier: ScenarioObjectiveIdentifier = { "edition": scenarioData.edition, "scenario": scenarioData.index, "group": scenarioData.group, "section": section, "index": index };
          if (objectiveData.count) {
            const count = EntityValueFunction(objectiveData.count);
            if (typeof count == 'number') {
              for (let i = 0; i < count; i++) {
                gameManager.characterManager.addObjective(objectiveData, undefined, objectiveIdentifier);
              }
            } else {
              gameManager.characterManager.addObjective(objectiveData, undefined, objectiveIdentifier);
            }
          } else {
            gameManager.characterManager.addObjective(objectiveData, undefined, objectiveIdentifier);
          }
        })
      }
    } else {
      scenarioData.rooms.filter((roomData) => roomData.initial).forEach((roomData) => {
        this.openRoom(roomData, scenarioData, section);
      })

      if (!settingsManager.settings.automaticStandees && scenarioData.monsters) {
        scenarioData.monsters.forEach((name) => {
          if (!scenarioData.rooms || !scenarioData.rooms.some((roomData) => roomData.monster && roomData.monster.some((standee) => standee.name == name))) {
            let monster = gameManager.monsterManager.addMonsterByName(name, scenarioData.edition);
            if (monster && scenarioData.allies && scenarioData.allies.indexOf(name) != -1) {
              monster.isAlly = true;
            }
            if (monster && scenarioData.drawExtra && scenarioData.drawExtra.indexOf(name) != -1) {
              monster.drawExtra = true;
            }
          }
        })
      }
    }

    if (scenarioData.solo) {
      gameManager.game.figures.forEach((figure) => {
        if (figure instanceof Character && (figure.name != scenarioData.solo || figure.edition != scenarioData.edition)) {
          figure.absent = true;
        }
      });

      if (!gameManager.game.figures.some((figure) => figure instanceof Character && figure.name == scenarioData.solo && figure.edition == scenarioData.edition)) {
        const characterData = gameManager.charactersData().find((characterData) => characterData.name == scenarioData.solo && characterData.edition == scenarioData.edition);
        if (characterData) {
          gameManager.characterManager.addCharacter(characterData, 1);
        } else {
          console.error("Solo Scenario Character not found: '" + scenarioData.solo + "' (" + scenarioData.name + ")");
        }
      }
    }

    if (scenarioData.lootDeckConfig) {
      gameManager.lootManager.apply(this.game.lootDeck, scenarioData.lootDeckConfig);
    }

    if (scenarioData.resetRound) {
      this.game.roundResets.push(this.game.round);
      this.game.round = this.game.state == GameState.draw ? 0 : 1;
    }
  }

  openRoom(roomData: RoomData, scenarioData: ScenarioData, section: boolean) {
    if (this.game.scenario) {
      this.game.scenario.revealedRooms = this.game.scenario.revealedRooms || [];
      this.game.scenario.revealedRooms.push(roomData.roomNumber);
    }

    if (roomData.monster) {
      let entities: MonsterEntity[] = [];
      roomData.monster.forEach((monsterStandeeData) => {
        let type: MonsterType | undefined = monsterStandeeData.type;

        if (!type) {
          const charCount = this.game.figures.filter((figure) => figure instanceof Character && !figure.absent).length;
          if (charCount < 3) {
            type = monsterStandeeData.player2;
          } else if (charCount == 3) {
            type = monsterStandeeData.player3;
          } else {
            type = monsterStandeeData.player4;
          }
        }

        if (type) {
          const entity = gameManager.monsterManager.spawnMonsterEntity(monsterStandeeData.name, type, scenarioData);
          if (entity) {
            if (monsterStandeeData.marker) {
              entity.marker = monsterStandeeData.marker;
            }
            if (monsterStandeeData.tags) {
              entity.tags = monsterStandeeData.tags;
            }
            entities.push(entity);
          }
        }
      })

      if (this.game.state == GameState.next) {
        this.game.figures.forEach((figure) => {
          if (figure instanceof Monster && (figure.edition == scenarioData.edition || gameManager.editionExtensions(scenarioData.edition).indexOf(figure.edition) != -1) && figure.entities.some((entity) => entities.indexOf(entity) != -1)) {
            figure.active = !this.game.figures.some((figure) => figure.active);
            if (this.game.state == GameState.next) {
              figure.entities.forEach((entity) => {
                if (entities.indexOf(entity) != -1) {
                  entity.active = figure.active || gameManager.game.figures.some((figure, index, self) => figure.active && index > self.indexOf(figure));
                }
              })
            }
          }
        })
      }
    }

    if (roomData.objectives) {
      roomData.objectives.forEach((index) => {
        if (typeof index == 'number' && index > 0 && index <= scenarioData.objectives.length) {
          const objectiveIdentifier: ScenarioObjectiveIdentifier = { "edition": scenarioData.edition, "scenario": scenarioData.index, "group": scenarioData.group, "section": section, "index": index - 1 };
          gameManager.characterManager.addObjective(scenarioData.objectives[index - 1], undefined, objectiveIdentifier);
        } else if (typeof index == 'string' && index.indexOf(':') != -1) {
          let split = index.split(':');
          const id = +(split.splice(0, 1));
          const count = EntityValueFunction(split.join(':'));
          if (id > 0 && id <= scenarioData.objectives.length && count > 0) {
            for (let i = 0; i < count; i++) {
              const objectiveIdentifier: ScenarioObjectiveIdentifier = { "edition": scenarioData.edition, "scenario": scenarioData.index, "group": scenarioData.group, "section": section, "index": id - 1 };
              gameManager.characterManager.addObjective(scenarioData.objectives[id - 1], undefined, objectiveIdentifier);
            }
          }
        }
      })
    }

    this.addScenarioRulesRooms();
    this.addScenarioRulesAlways();
  }

  scenarioData(edition: string | undefined, all: boolean = false): ScenarioData[] {
    const scenarios = gameManager.editionData.filter((editionData) => settingsManager.settings.editions.indexOf(editionData.edition) != -1).map((editionData) => editionData.scenarios).flat();

    if (!edition) {
      return scenarios;
    }

    if (all || !this.game.party.campaignMode || !scenarios.some((scenarioData) => scenarioData.initial)) {
      return scenarios.filter((scenarioData) => scenarioData.edition == edition);
    }

    return scenarios.filter((scenarioData) => {

      if (scenarioData.edition != edition) {
        return false;
      }

      if (scenarioData.initial) {
        return true;
      }

      if (this.game.party.scenarios.find((identifier) => scenarioData.index == identifier.index && scenarioData.edition == identifier.edition && scenarioData.group == identifier.group)) {
        return true;
      }

      if (this.game.party.manualScenarios.find((identifier) => scenarioData.index == identifier.index && scenarioData.edition == identifier.edition && scenarioData.group == identifier.group)) {
        return true;
      }

      let unlocked: boolean = false;
      let requires: boolean = !scenarioData.requires || scenarioData.requires.length == 0;
      this.game.party.scenarios.forEach((identifier) => {
        const scenario = scenarios.find((value) => value.index == identifier.index && value.edition == identifier.edition && value.group == identifier.group);

        if (scenario && scenario.group == scenarioData.group) {
          if ((scenario.unlocks && scenario.unlocks.indexOf(scenarioData.index) != -1)) {
            unlocked = true;
          }
        }
      })

      if (!requires) {
        requires = scenarioData.requires.some((requires) => requires.every((require) => this.game.party.scenarios.find((identifier) => identifier.index == require && identifier.group == scenarioData.group && identifier.edition == scenarioData.edition)));
      }

      return unlocked && requires;
    });
  }

  isBlocked(scenarioData: ScenarioData): boolean {
    let blocked = false;
    const editionData = gameManager.editionData.find((editionData) => editionData.edition == scenarioData.edition);
    if (editionData) {
      this.game.party.scenarios.forEach((identifier) => {
        const scenario = editionData.scenarios.find((value) => value.index == identifier.index && value.edition == identifier.edition && value.group == identifier.group);
        if (scenario) {
          if (scenario.blocks && scenario.blocks.indexOf(scenarioData.index) != -1) {
            blocked = true;
          }
        }
      })
    }
    return blocked;
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

  addScenarioRulesRooms() {
    const scenario = this.game.scenario;
    if (scenario && scenario.rules) {
      scenario.rules.filter((rule) => rule.requiredRooms && rule.requiredRooms.length > 0).forEach((rule) => {
        this.addScenarioRule(scenario, rule, scenario.rules.indexOf(rule), false);
      })
    }

    if (this.game.sections) {
      this.game.sections.forEach((section) => {
        if (section.rules) {
          section.rules.filter((rule) => rule.requiredRooms && rule.requiredRooms.length > 0).forEach((rule, index) => {
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
      round = round.replace('C', '' + this.game.figures.filter((figure) => figure instanceof Character && !figure.absent).length);
    }

    if (round == "always") {
      add = true
    } else {
      try {
        add = eval(round) && (this.game.state == GameState.next || rule.start && initial);
      } catch (error) {
        console.warn("Cannot apply scenario rule: '" + rule.round + "'", "index: " + index, error);
        add = false;
      }
    }

    if (add) {
      if (rule.figures && rule.figures.filter((figureRule) => figureRule.type == "present" || figureRule.type == "dead").length > 0) {
        rule.figures.filter((figureRule) => figureRule.type == "present" || figureRule.type == "dead").forEach((figureRule) => {
          const gameplayFigures: Figure[] = gameManager.figuresByIdentifier(figureRule.identifier, figureRule.scenarioEffect).filter((figure) => gameManager.gameplayFigure(figure) && (!(figure instanceof Monster) || (!(figureRule.identifier?.marker) || (figure instanceof Monster && figure.entities.some((entity) => entity.marker == figureRule.identifier?.marker && !entity.dead && entity.health >= 1))) && (!(figureRule.identifier?.tag) || (figure instanceof Monster && figure.entities.some((entity) => figureRule.identifier?.tag && entity.tags.indexOf(figureRule.identifier?.tag) != -1 && !entity.dead && entity.health >= 1)))));
          const tolerance: number = figureRule.value ? EntityValueFunction(figureRule.value.split(':')[0]) : 0;
          add = add && (figureRule.type == "present" ? gameplayFigures.length > tolerance : gameplayFigures.length <= tolerance);

          if ((figureRule.identifier?.marker || figureRule.identifier?.tag) && !settingsManager.settings.automaticStandees) {
            add = false;
          }

        })
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
    }

    const disgarded = this.game.disgardedScenarioRules.find((disgarded) => disgarded.edition == identifier.edition && disgarded.scenario == identifier.scenario && disgarded.group == identifier.group && disgarded.index == identifier.index && disgarded.section == identifier.section);

    const visible = this.game.scenarioRules.find((ruleModel) => ruleModel.identifier.edition == identifier.edition && ruleModel.identifier.scenario == identifier.scenario && ruleModel.identifier.group == identifier.group && ruleModel.identifier.index == identifier.index && ruleModel.identifier.section == identifier.section);

    if (add && !disgarded && !visible) {
      if (rule.spawns) {
        rule.spawns.forEach((spawn) => {
          if (spawn.manual && !spawn.count) {
            spawn.count = "1";
          }
        });
      }
      this.game.scenarioRules.push({ "identifier": identifier, "rule": rule });
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

  availableSections(): ScenarioData[] {
    if (!this.game.scenario) {
      return [];
    }

    return gameManager.sectionData(this.game.scenario.edition).filter((sectionData) => (this.game.scenario && sectionData.edition == this.game.scenario.edition && sectionData.parent == this.game.scenario.index && (!sectionData.parentSections || sectionData.parentSections.length == 0) || this.game.sections.find((active) => active.edition == sectionData.edition && sectionData.parentSections && sectionData.parentSections.indexOf(active.index) != -1)) && !this.game.sections.find((active) => active.edition == sectionData.edition && active.index == sectionData.index) && !this.game.sections.find((active) => active.edition == sectionData.edition && sectionData.blocksSections && sectionData.blocksSections.indexOf(active.index) != -1));
  }

  openRooms(initial: boolean = false): RoomData[] {
    if (!this.game.scenario) {
      return [];
    }

    return this.game.scenario.rooms.filter((roomData) => this.game.scenario && this.game.scenario.revealedRooms.indexOf(roomData.roomNumber) != -1 && (initial || !roomData.initial));
  }

  closedRooms(): RoomData[] {
    if (!this.game.scenario) {
      return [];
    }

    return this.game.scenario.rooms.filter((roomData) => this.game.scenario && this.game.scenario.revealedRooms.indexOf(roomData.roomNumber) == -1 && this.openRooms(true).some((openRoomData) => openRoomData.rooms && openRoomData.rooms.indexOf(roomData.roomNumber) != -1));
  }

  scenarioUndoArgs(scenario: Scenario | undefined = undefined): string[] {
    scenario = scenario || gameManager.game.scenario;
    if (!scenario) {
      return ["", "", ""];
    }

    return [scenario.index, "data.scenario." + scenario.name, scenario.custom ? 'scenario.custom' : 'data.edition.' + scenario.edition];
  }

  scenarioDataForModel(model: GameScenarioModel): ScenarioData | undefined {
    if (model.isCustom) {
      return new ScenarioData(model.custom, "", [], [], [], [], [], [], [], [], [], "", [], "");
    }

    const scenarioData = gameManager.scenarioData().find((scenarioData) => scenarioData.index == model.index && scenarioData.edition == model.edition && scenarioData.group == model.group);
    if (!scenarioData) {
      console.warn("Invalid scenario data:", model);
      return undefined;
    }

    return JSON.parse(JSON.stringify(scenarioData));
  }

  sectionDataForModel(model: GameScenarioModel): ScenarioData | undefined {
    const sectionData = gameManager.sectionData().find((sectionData) => sectionData.index == model.index && sectionData.edition == model.edition && sectionData.group == model.group);
    if (!sectionData) {
      console.warn("Invalid section data:", model);
      return undefined;
    }

    return JSON.parse(JSON.stringify(sectionData));
  }

  toModel(scenarioData: ScenarioData, revealedRooms: number[], custom: boolean = false, customName: string = ""): GameScenarioModel {
    return new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group, custom, customName, JSON.parse(JSON.stringify(revealedRooms)));
  }
}
