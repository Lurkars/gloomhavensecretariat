import { EntityValueFunction } from "../model/Entity";
import { Game, GameState } from "../model/Game";
import { ObjectiveContainer } from "../model/ObjectiveContainer";
import { ObjectiveEntity } from "../model/ObjectiveEntity";
import { ObjectiveData, ScenarioObjectiveIdentifier } from "../model/data/ObjectiveData";
import { gameManager } from "./GameManager";
import { v4 as uuidv4 } from 'uuid';


export class ObjectiveManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  addObjective(objectiveData: ObjectiveData | undefined = undefined, name: string | undefined = undefined, objectiveId: ScenarioObjectiveIdentifier | undefined = undefined): ObjectiveContainer {

    let objectiveContainer = new ObjectiveContainer(uuidv4(), objectiveId);

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
    gameManager.addEntityCount(objectiveContainer);
    gameManager.sortFigures(objectiveContainer);
    return objectiveContainer;
  }

  removeObjective(objectiveContainer: ObjectiveContainer) {
    this.game.figures.splice(this.game.figures.indexOf(objectiveContainer), 1);
  }

  addObjectiveEntity(objectiveContainer: ObjectiveContainer, number: number | undefined = undefined) {
    if (!number || objectiveContainer.entities.find((objectiveEntity) => objectiveEntity.number == number)) {
      const objectiveCount = objectiveContainer.entities.filter((entity) => gameManager.entityManager.isAlive(entity)).length;
      number = objectiveCount % 12;
      if (objectiveCount < 12) {
        while (objectiveContainer.entities.find((objectiveEntity) => objectiveEntity.number - 1 == number)) {
          number++;
        }
      }
    }

    let entity: ObjectiveEntity = new ObjectiveEntity(uuidv4(), number + 1, objectiveContainer);

    objectiveContainer.entities.push(entity);
  }

  removeObjectiveEntity(objectiveCOntainer: ObjectiveContainer, objectiveEntity: ObjectiveEntity) {
    objectiveCOntainer.entities.splice(objectiveCOntainer.entities.indexOf(objectiveEntity), 1);
    if (objectiveCOntainer.entities.length == 0 || objectiveCOntainer.entities.every((entity) => !gameManager.entityManager.isAlive(entity))) {
      if (!objectiveCOntainer.off && gameManager.game.state == GameState.next) {
        if (objectiveCOntainer.active) {
          gameManager.roundManager.toggleFigure(objectiveCOntainer);
        } else {
          objectiveCOntainer.off = true;
        }
      } else {
        objectiveCOntainer.off = true;
      }
    }
  }

}