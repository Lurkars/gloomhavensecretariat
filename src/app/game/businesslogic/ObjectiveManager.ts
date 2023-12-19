import { EntityValueFunction } from "../model/Entity";
import { Figure } from "../model/Figure";
import { Game, GameState } from "../model/Game";
import { ObjectiveContainer } from "../model/ObjectiveContainer";
import { ObjectiveEntity } from "../model/ObjectiveEntity";
import { AdditionalIdentifier } from "../model/data/Identifier";
import { ObjectiveData, ScenarioObjectiveIdentifier } from "../model/data/ObjectiveData";
import { gameManager } from "./GameManager";
import { v4 as uuidv4 } from 'uuid';


export class ObjectiveManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  objectiveName(objective: ObjectiveContainer) {
    return objective.title || objective.name && "data.objective." + objective.name || objective.escort ? 'escort' : 'objective';
  }

  addObjective(objectiveData: ObjectiveData | undefined = undefined, name: string | undefined = undefined, objectiveId: ScenarioObjectiveIdentifier | undefined = undefined): ObjectiveContainer {
    let objectiveContainer = gameManager.game.figures.find((figure) => figure instanceof ObjectiveContainer && (!objectiveId && objectiveData && !figure.objectiveId && figure.name == objectiveData.name && figure.health == EntityValueFunction("" + objectiveData.health) && figure.escort == objectiveData.escort && figure.initiative == (objectiveData.initiative || 99) || objectiveId && figure.objectiveId && gameManager.objectiveDataByScenarioObjectiveIdentifier(objectiveId) == gameManager.objectiveDataByScenarioObjectiveIdentifier(figure.objectiveId))) as ObjectiveContainer;

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
      this.game.figures.push(objectiveContainer);
    }
    gameManager.addEntityCount(objectiveContainer);
    gameManager.sortFigures(objectiveContainer);
    this.addObjectiveEntity(objectiveContainer, undefined, objectiveData);
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
          const objectiveData = gameManager.objectiveDataByScenarioObjectiveIdentifier(figure.objectiveId);
          if (!objectiveData || !objectiveData.actions || objectiveData.actions.length == 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

}