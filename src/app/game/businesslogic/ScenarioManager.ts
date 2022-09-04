import { Character } from "../model/Character";
import { EditionData } from "../model/data/EditionData";
import { GameScenarioModel, ScenarioData } from "../model/data/ScenarioData";
import { Game } from "../model/Game";
import { Scenario } from "../model/Scenario";
import { gameManager } from "./GameManager";

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
    }
  }

  finishScenario(success: boolean = true) {
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        gameManager.characterManager.addXP(figure, (success ? figure.experience : 0) + gameManager.levelManager.experience());
        figure.progress.gold += figure.loot * gameManager.levelManager.loot();
      }
    })

    if (success && this.game.party && this.game.scenario) {
      this.game.party.scenarios.push(new GameScenarioModel(this.game.scenario.index, this.game.scenario.edition, this.game.scenario.group));
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
        const monsterData = gameManager.monstersData(true).find((monsterData) => monsterData.name == name && (monsterData.edition == editionData.edition || editionData.extentions && editionData.extentions.indexOf(monsterData.edition) != -1));
        if (monsterData) {
          let monster = gameManager.monsterManager.addMonster(monsterData);
          if (scenarioData.allies && scenarioData.allies.indexOf(monster.name) != -1) {
            monster.isAlly = true;
          }
        }
      });
    }

    if (scenarioData.objectives) {
      scenarioData.objectives.forEach((objectiveData) => {
        gameManager.characterManager.addObjective(objectiveData)
      })
    }
  }

  scenarioData(edition: string): ScenarioData[] {
    const editionData = gameManager.editionData.find((editionData) => editionData.edition == edition);

    if (!editionData) {
      return [];
    }
    if (!this.game.party.campaignMode || !editionData.scenarios.some((scenarioData) => scenarioData.initial)) {
      return editionData.scenarios;
    }

    return editionData.scenarios.filter((scenarioData) => {
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
        const scenario = editionData.scenarios.find((value) => value.index == identifier.index && value.edition == identifier.edition && value.group == identifier.group);

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

  scenarioUndoArgs(scenario: ScenarioData | undefined = undefined): string[] {
    scenario = scenario || gameManager.game.scenario;
    if (!scenario) {
      return [ "", "", "" ];
    }

    return [ scenario.index, "data.scenario." + scenario.name, 'data.edition.' + scenario.edition ];
  }

  scenarioDataForModel(model: GameScenarioModel): ScenarioData | undefined {
    if (model.custom) {
      return new ScenarioData(model.custom, "", [], [], [], [], [], [], [], "");
    }

    const scenarioData = gameManager.scenarioData(true).find((scenarioData) => scenarioData.index == model.index && scenarioData.edition == model.edition && scenarioData.group == model.group);
    if (!scenarioData) {
      console.warn("Invalid scenario data:", model);
      return undefined;
    }

    return new ScenarioData(scenarioData.name, scenarioData.index, scenarioData.unlocks, scenarioData.blocks, scenarioData.requires, scenarioData.links, scenarioData.monsters, scenarioData.allies, scenarioData.objectives, scenarioData.edition, scenarioData.group, scenarioData.spoiler);
  }

  sectionDataForModel(model: GameScenarioModel): ScenarioData | undefined {
    const sectionData = gameManager.sectionData(true).find((sectionData) => sectionData.index == model.index && sectionData.edition == model.edition && sectionData.group == model.group);
    if (!sectionData) {
      console.warn("Invalid section data:", model);
      return undefined;
    }

    return new ScenarioData(sectionData.name, sectionData.index, sectionData.unlocks, sectionData.blocks, sectionData.requires, sectionData.links, sectionData.monsters, sectionData.allies, sectionData.objectives, sectionData.edition, sectionData.group, sectionData.spoiler);

  }

  toModel(scenarioData: ScenarioData, custom: string = ""): GameScenarioModel {
    return new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group, custom);
  }
}