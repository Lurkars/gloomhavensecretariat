import { Character } from "../model/Character";
import { EditionData } from "../model/data/EditionData";
import { GameScenarioModel, ScenarioData, ScenarioRule } from "../model/data/ScenarioData";
import { Game, GameState } from "../model/Game";
import { LootDeck } from "../model/Loot";
import { Scenario } from "../model/Scenario";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class ScnearioManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }


  setScenario(scenario: Scenario | undefined) {
    this.game.scenario = scenario ? new Scenario(scenario, scenario.custom) : undefined;
    if (scenario && !scenario.custom) {
      const editionData: EditionData | undefined = gameManager.editionData.find((value) => value.edition == scenario.edition);
      if (!editionData) {
        console.error("Could not find edition data!");
        return;
      }
      gameManager.roundManager.resetScenario();
      this.applyScenarioData(editionData, scenario);
    } else if (!scenario) {
      gameManager.roundManager.resetScenario();
    }
  }

  finishScenario(success: boolean = true) {
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        gameManager.characterManager.addXP(figure, (success ? gameManager.levelManager.experience() : 0) + figure.experience);
        figure.progress.gold += figure.loot * gameManager.levelManager.loot();
      }
    })

    if (success && this.game.party && this.game.scenario) {
      this.game.party.scenarios.push(new GameScenarioModel(this.game.scenario.index, this.game.scenario.edition, this.game.scenario.group, this.game.scenario.custom, this.game.scenario.custom ? this.game.scenario.name : ""));
      this.game.party.manualScenarios = this.game.party.manualScenarios.filter((identifier) => this.game.scenario && (this.game.scenario.index != identifier.index || this.game.scenario.edition != identifier.edition || this.game.scenario.group != identifier.group));
    }

    this.game.scenario = undefined;
    this.game.sections = [];
    gameManager.roundManager.resetScenario();
  }


  addSection(section: ScenarioData) {
    const editionData: EditionData | undefined = gameManager.editionData.find((value) => value.edition == section.edition);
    if (!editionData) {
      console.error("Could not find edition data!");
      return;
    }

    if (!this.game.sections.some((value) => value.edition == section.edition && value.index == section.index && value.group == section.group)) {
      this.game.sections.push(section);
      this.applyScenarioData(editionData, section);
    }
  }

  applyScenarioData(editionData: EditionData, scenarioData: ScenarioData) {
    if (scenarioData.monsters) {
      scenarioData.monsters.forEach((name) => {

        let level = gameManager.game.level;
        if (name.indexOf(':') != -1) {
          level = eval(gameManager.game.level + name.split(':')[1]);
          name = name.split(':')[0]
        }

        let monsterData = gameManager.monstersData().find((monsterData) => monsterData.name == name && (monsterData.edition == editionData.edition || editionData.extensions && editionData.extensions.indexOf(monsterData.edition) != -1));

        if (!monsterData) {
          console.warn("Monster not found: '" + name + "' for edition :" + editionData.edition);
          monsterData = gameManager.monstersData().find((monsterData) => monsterData.name == name);
        }

        if (monsterData) {
          let monster = gameManager.monsterManager.addMonster(monsterData, level);
          if (scenarioData.allies && scenarioData.allies.indexOf(monster.name) != -1) {
            monster.isAlly = true;
          }
        } else {
          console.error("Monster not found: '" + name + "'");
        }
      });
    }

    if (scenarioData.solo) {
      gameManager.game.figures = gameManager.game.figures.filter((figure) => !(figure instanceof Character) || figure.name == scenarioData.solo && figure.edition == scenarioData.edition);

      if (!gameManager.game.figures.some((figure) => figure instanceof Character && figure.name == scenarioData.solo && figure.edition == scenarioData.edition)) {
        const characterData = gameManager.charactersData().find((characterData) => characterData.name == scenarioData.solo && characterData.edition == scenarioData.edition);
        if (characterData) {
          gameManager.characterManager.addCharacter(characterData, 1);
        } else {
          console.error("Solo Scneario Character not found: '" + scenarioData.solo + "' (" + scenarioData.name + ")");
        }
      }
    }

    if (scenarioData.objectives) {
      scenarioData.objectives.forEach((objectiveData) => {
        gameManager.characterManager.addObjective(objectiveData)
      })
    }

    if (scenarioData.lootDeckConfig) {
      this.game.lootDeck = new LootDeck(scenarioData.lootDeckConfig);
    }
  }

  scenarioData(edition: string | undefined): ScenarioData[] {
    const scenarios = gameManager.editionData.filter((editionData) => settingsManager.settings.editions.indexOf(editionData.edition) != -1).map((editionData) => editionData.scenarios).flat();

    if (!edition) {
      return scenarios;
    }

    if (!this.game.party.campaignMode || !scenarios.some((scenarioData) => scenarioData.initial)) {
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

  applyScenarioRules() {
    this.game.scenarioRules = [];
    const scenario = this.game.scenario;
    if (scenario && scenario.rules) {
      scenario.rules.forEach((rule, index) => {
        this.applyScenarioRule(scenario, rule, index, false);
      })
    }

    if (this.game.sections) {
      this.game.sections.forEach((section) => {
        if (section.rules) {
          section.rules.forEach((rule, index) => {
            this.applyScenarioRule(section, rule, index, true);
          })
        }
      })
    }
  }

  applyScenarioRule(scenarioData: ScenarioData, rule: ScenarioRule, index: number, section: boolean) {
    let round = rule.round || 'false';

    while (round.indexOf('R') != -1) {
      round = round.replace('R', '' + this.game.round);
    }

    while (round.indexOf('C') != -1) {
      round = round.replace('C', '' + this.game.figures.filter((figure) => figure instanceof Character && !figure.absent).length);
    }

    if (eval(round) && (this.game.state == GameState.next && !rule.start || this.game.state == GameState.draw && rule.start)) {
      this.game.scenarioRules.push({ "edition": scenarioData.edition, "scenario": scenarioData.index, "group": scenarioData.group, "index": index + 1, "section": section });
    }
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
      return new ScenarioData(model.custom, "", [], [], [], [], [], [], [], [], "");
    }

    const scenarioData = gameManager.scenarioData().find((scenarioData) => scenarioData.index == model.index && scenarioData.edition == model.edition && scenarioData.group == model.group);
    if (!scenarioData) {
      console.warn("Invalid scenario data:", model);
      return undefined;
    }

    return new ScenarioData(scenarioData.name, scenarioData.index, scenarioData.unlocks, scenarioData.blocks, scenarioData.requires, scenarioData.links, scenarioData.monsters, scenarioData.allies, scenarioData.objectives, scenarioData.rules, scenarioData.edition, scenarioData.group, scenarioData.spoiler);
  }

  sectionDataForModel(model: GameScenarioModel): ScenarioData | undefined {
    const sectionData = gameManager.sectionData().find((sectionData) => sectionData.index == model.index && sectionData.edition == model.edition && sectionData.group == model.group);
    if (!sectionData) {
      console.warn("Invalid section data:", model);
      return undefined;
    }

    return new ScenarioData(sectionData.name, sectionData.index, sectionData.unlocks, sectionData.blocks, sectionData.requires, sectionData.links, sectionData.monsters, sectionData.allies, sectionData.objectives, sectionData.rules, sectionData.edition, sectionData.group, sectionData.spoiler);

  }

  toModel(scenarioData: ScenarioData, custom: boolean = false, customName: string = ""): GameScenarioModel {
    return new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group, custom, customName);
  }
}