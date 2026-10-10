import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findObjectiveContainer, validSeed } from 'src/app/game/commands/CommandHelper';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';

export class ObjectiveEntityAddCommand extends CommandImpl {
  id: string = 'objective.entity.add';
  requiredParameters: number = 2;

  number(objectiveContainer: ObjectiveContainer): number {
    const objectiveCount = objectiveContainer.entities.filter((entity) => gameManager.entityManager.isAlive(entity)).length;
    let number = objectiveCount % 12;
    if (objectiveCount < 12) {
      while (objectiveContainer.entities.find((objectiveEntity) => objectiveEntity.number - 1 === number)) {
        number++;
      }
    }
    return number;
  }

  validParameters(figureId: string, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return !!findObjectiveContainer(figureId);
  }

  executeWithParameters(figureId: string, seed: number) {
    gameManager.game.seed = seed;
    const objectiveContainer = findObjectiveContainer(figureId);
    if (objectiveContainer) {
      gameManager.objectiveManager.addObjectiveEntity(objectiveContainer, this.number(objectiveContainer));
    } else {
      this.executionError('objective not found');
    }
  }
}
