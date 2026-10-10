import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { ObjectiveData } from 'src/app/game/model/data/ObjectiveData';

export class ObjectiveAddCommand extends CommandImpl {
  id: string = 'objective.add';
  requiredParameters: number = 1;

  validParameters(seed: number, escort: boolean = false): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return typeof escort === 'boolean';
  }

  executeWithParameters(seed: number, escort: boolean = false) {
    gameManager.game.seed = seed;
    const objectiveContainer = gameManager.objectiveManager.addObjective(new ObjectiveData('', escort ? 3 : 7, escort));
    gameManager.objectiveManager.addObjectiveEntity(objectiveContainer);
  }
}
