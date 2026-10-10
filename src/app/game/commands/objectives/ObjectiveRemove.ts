import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findObjectiveContainer } from 'src/app/game/commands/CommandHelper';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';

export class ObjectiveRemoveCommand extends CommandImpl {
  id: string = 'objective.remove';
  requiredParameters: number = 1;

  validParameters(figureId: string): boolean {
    return !!findObjectiveContainer(figureId);
  }

  executeWithParameters(figureId: string) {
    const objectiveContainer = findObjectiveContainer(figureId);
    if (objectiveContainer) {
      gameManager.objectiveManager.removeObjective(objectiveContainer);
    } else {
      this.executionError('objective not found');
    }
  }
}

export class ObjectiveRemoveAllCommand extends CommandImpl {
  id: string = 'objective.removeAll';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return true;
  }

  executeWithParameters() {
    gameManager.game.figures = gameManager.game.figures.filter((figure) => !(figure instanceof ObjectiveContainer));
  }
}
