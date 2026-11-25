import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findObjectiveContainer, validSeed } from 'src/app/game/commands/CommandHelper';

export class ObjectiveEntityAddCommand extends CommandImpl {
  id: string = 'objective.entity.add';
  requiredParameters: number = 2;

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
      gameManager.objectiveManager.addObjectiveEntity(objectiveContainer);
    } else {
      this.executionError('objective not found');
    }
  }
}
