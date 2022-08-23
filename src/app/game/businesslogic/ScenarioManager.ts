import { Character } from "../model/Character";
import { EditionData } from "../model/data/EditionData";
import { ScenarioData } from "../model/data/ScenarioData";
import { SectionData } from "../model/data/SectionData";
import { Game } from "../model/Game";
import { Identifier } from "../model/Identifier";
import { Scenario } from "../model/Scenario";
import { gameManager } from "./GameManager";

export class ScnearioManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }


  setScenario(scenario: Scenario | undefined) {
    this.game.scenario = scenario;
    if (scenario && !scenario.custom) {
      const editionData: EditionData | undefined = gameManager.editionData.find((value) => value.edition == scenario.edition);
      if (!editionData) {
        console.error("Could not find edition data!");
        return;
      }
      gameManager.roundManager.resetRound();
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
      this.game.party.scenarios.push(new Identifier(this.game.scenario.index, this.game.scenario.edition));
    }

    this.game.scenario = undefined;
    this.game.sections = [];
    gameManager.roundManager.resetRound();
  }


  addSection(section: SectionData) {
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
          gameManager.monsterManager.addMonster(monsterData);
        }
      });
    }

    if (scenarioData.objectives) {
      scenarioData.objectives.forEach((objectiveData) => {
        gameManager.characterManager.addObjective(objectiveData)
      })
    }
  }
} 