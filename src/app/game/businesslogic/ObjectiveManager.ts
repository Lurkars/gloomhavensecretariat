import { v4 as uuidv4 } from 'uuid';
import { EntityValueFunction } from "../model/Entity";
import { Figure } from "../model/Figure";
import { Game, GameState } from "../model/Game";
import { Monster } from "../model/Monster";
import { ObjectiveContainer } from "../model/ObjectiveContainer";
import { ObjectiveEntity } from "../model/ObjectiveEntity";
import { ActionType } from "../model/data/Action";
import { AdditionalIdentifier } from "../model/data/Identifier";
import { MonsterType } from "../model/data/MonsterType";
import { ObjectiveData, ScenarioObjectiveIdentifier } from "../model/data/ObjectiveData";
import { ObjectiveSpawnData } from "../model/data/ScenarioRule";
import { gameManager } from "./GameManager";


export class ObjectiveManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  objectiveName(objective: ObjectiveContainer) {
    return objective.title || objective.name && "data.objective." + objective.name || objective.escort ? 'escort' : 'objective';
  }

  addObjective(objectiveData: ObjectiveData | undefined = undefined, name: string | undefined = undefined, objectiveId: AdditionalIdentifier | ScenarioObjectiveIdentifier | undefined = undefined): ObjectiveContainer {
    let objectiveContainer = gameManager.game.figures.find((figure) => figure instanceof ObjectiveContainer && (!objectiveId && objectiveData && !figure.objectiveId && figure.name == objectiveData.name && figure.health == EntityValueFunction("" + objectiveData.health) && figure.escort == objectiveData.escort && figure.initiative == (objectiveData.initiative || 99) || objectiveId && figure.objectiveId && this.objectiveDataByObjectiveIdentifier(objectiveId) == this.objectiveDataByObjectiveIdentifier(figure.objectiveId))) as ObjectiveContainer;

    if (!objectiveContainer) {
      objectiveContainer = new ObjectiveContainer(uuidv4(), objectiveId);
      if (objectiveData) {
        objectiveContainer.marker = objectiveData.marker;
        objectiveContainer.name = objectiveData.name;
        if (name) {
          objectiveContainer.name = name;
        }
        objectiveContainer.health = EntityValueFunction("" + objectiveData.health);
        objectiveContainer.escort = objectiveData.escort;
        if (objectiveData.initiative) {
          objectiveContainer.initiative = objectiveData.initiative;
        }
      }
      objectiveContainer.edition = objectiveContainer.escort ? 'escort' : 'objective';
      this.game.figures.push(objectiveContainer);
    }
    gameManager.addEntityCount(objectiveContainer);
    this.setInitiativeShare(objectiveContainer);
    gameManager.sortFigures(objectiveContainer);
    return objectiveContainer;
  }

  removeObjective(objectiveContainer: ObjectiveContainer) {
    const index = this.game.figures.indexOf(objectiveContainer);
    if (index != -1) {
      this.game.figures.splice(index, 1);
    }
  }

  addObjectiveEntity(objectiveContainer: ObjectiveContainer, number: number | undefined = undefined, objectiveData: ObjectiveData | undefined = undefined): ObjectiveEntity {
    if (!number || objectiveContainer.entities.find((objectiveEntity) => objectiveEntity.number == number)) {
      const objectiveCount = objectiveContainer.entities.filter((entity) => gameManager.entityManager.isAlive(entity)).length;
      number = objectiveCount % 12;
      if (objectiveCount < 12) {
        while (objectiveContainer.entities.find((objectiveEntity) => objectiveEntity.number - 1 == number)) {
          number++;
        }
      }
    }

    let entity: ObjectiveEntity = new ObjectiveEntity(uuidv4(), number + 1, objectiveContainer, objectiveData && objectiveData.marker || objectiveContainer.marker);

    if (objectiveData) {
      entity.tags = objectiveData.tags;
    }

    objectiveContainer.entities.push(entity);

    if (objectiveContainer.off) {
      objectiveContainer.off = false;
    }

    return entity;
  }

  removeObjectiveEntity(objectiveCOntainer: ObjectiveContainer, objectiveEntity: ObjectiveEntity) {
    objectiveCOntainer.entities.splice(objectiveCOntainer.entities.indexOf(objectiveEntity), 1);
    if (objectiveCOntainer.entities.length == 0 || objectiveCOntainer.entities.every((entity) => !gameManager.entityManager.isAlive(entity))) {
      if (!objectiveCOntainer.off && gameManager.game.state == GameState.next) {
        if (objectiveCOntainer.active) {
          gameManager.roundManager.toggleFigure(objectiveCOntainer);
        } else {
          this.removeObjective(objectiveCOntainer);
        }
      } else {
        this.removeObjective(objectiveCOntainer);
      }
    }
  }

  objectiveEntityCountIdentifier(objective: ObjectiveContainer, identifier: AdditionalIdentifier): number {
    if (identifier.type != 'all' && (identifier.name != objective.name || identifier.edition != objective.edition) || identifier.type != 'objective') {
      return 0;
    }

    return objective.entities.filter((entity) => gameManager.entityManager.isAlive(entity) && (!identifier.marker || identifier.marker == entity.marker) && (!identifier.tags || identifier.tags.length == 0 || identifier.tags.every((tag) => entity.tags.indexOf(tag) != -1))).length;
  }

  skipObjective(figure: Figure): boolean {
    if (figure instanceof ObjectiveContainer) {
      if (!figure.escort) {
        if (!figure.objectiveId) {
          return true;
        } else {
          const objectiveData = this.objectiveDataByObjectiveIdentifier(figure.objectiveId);
          if (!objectiveData || !objectiveData.actions || objectiveData.actions.length == 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  objectiveDataByObjectiveIdentifier(objectiveIdentifier: AdditionalIdentifier | ScenarioObjectiveIdentifier): ObjectiveData | undefined {
    if (!("scenario" in objectiveIdentifier)) {
      // TODO: generalize code, now specialized for Elder Drake
      const figures = gameManager.figuresByIdentifier(objectiveIdentifier);
      if (figures.length == 1) {
        let result: ObjectiveData | undefined = undefined;
        const figure: Figure = figures[0];
        if (figure instanceof Monster && figure.boss) {
          const bossStats = gameManager.monsterManager.getStat(figure, MonsterType.boss);
          bossStats.special.forEach((special) => {
            special.forEach((action) => {
              if (!result && (action.type == ActionType.summon || action.type == ActionType.spawn) && action.value == "objectiveSpawn") {
                result = (action.valueObject as ObjectiveSpawnData[])[0].objective as ObjectiveData;
              }
            })
          })
        }
        return result;
      }
    } else {
      const scenarioData = (objectiveIdentifier.section ? gameManager.sectionData(objectiveIdentifier.edition).find((sectionData) => sectionData.index == objectiveIdentifier.scenario && sectionData.group == objectiveIdentifier.group) : gameManager.scenarioData(objectiveIdentifier.edition).find((scenarioData) => scenarioData.index == objectiveIdentifier.scenario && scenarioData.group == objectiveIdentifier.group));
      if (scenarioData) {
        if (objectiveIdentifier.section && !scenarioData.objectives) {
          const parent = gameManager.scenarioData(objectiveIdentifier.edition).find((scenario) => scenario.index == scenarioData.parent && scenario.group == scenarioData.group);
          if (parent && parent.objectives && parent.objectives.length > objectiveIdentifier.index) {
            return parent.objectives[objectiveIdentifier.index];
          }
        } else if (scenarioData.objectives.length > objectiveIdentifier.index) {
          return scenarioData.objectives[objectiveIdentifier.index];
        }
      }
    }

    return undefined;
  }

  next() {
    this.game.figures.forEach((figure) => {
      if (figure instanceof ObjectiveContainer) {
        figure.off = false;
        this.setInitiativeShare(figure);
      }
    })
  }

  setInitiativeShare(figure: ObjectiveContainer) {
    if (figure.objectiveId) {
      const objectiveData = gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(figure.objectiveId);

      if (objectiveData && objectiveData.initiativeShare) {
        let offset = 0;
        const name = objectiveData.initiativeShare.split(':')[0];
        if (objectiveData.initiativeShare.split(':').length > 0) {
          offset = +objectiveData.initiativeShare.split(':')[1];
        }

        const monster = gameManager.game.figures.find((figure) => figure instanceof Monster && figure.name == name);
        if (monster) {
          figure.initiative = gameManager.game.state == GameState.next && monster.getInitiative() && monster.getInitiative() < 100 ? (offset < 0 ? Math.ceil(monster.getInitiative() + offset) : Math.floor(monster.getInitiative() + offset)) : 0;
        }
      }
    }
  }

  draw() {
    this.game.figures.forEach((figure) => {
      if (figure instanceof ObjectiveContainer) {
        if (figure.entities.some((objectiveEntity) => gameManager.entityManager.isAlive(objectiveEntity))) {
          figure.off = false;
        }
        this.setInitiativeShare(figure);
      }
    })
  }


}