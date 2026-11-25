import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findObjectiveContainer } from 'src/app/game/commands/CommandHelper';

export class ObjectiveAmDeckCommand extends CommandImpl {
  id: string = 'objective.amDeck';
  requiredParameters: number = 2;

  validParameters(figureId: string, deck: string): boolean {
    const objectiveContainer = findObjectiveContainer(figureId);
    return !!objectiveContainer && gameManager.objectiveManager.canSetAmDeck(objectiveContainer, deck);
  }

  executeWithParameters(figureId: string, deck: string) {
    const objectiveContainer = findObjectiveContainer(figureId);
    if (objectiveContainer) {
      gameManager.objectiveManager.setAmDeck(objectiveContainer, deck);
    } else {
      this.executionError('objective not found');
    }
  }
}
