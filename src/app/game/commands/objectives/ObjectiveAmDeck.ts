import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findObjectiveContainer } from 'src/app/game/commands/CommandHelper';

export class ObjectiveAmDeckCommand extends CommandImpl {
  id: string = 'objective.amDeck';
  requiredParameters: number = 2;

  validParameters(figureId: string, deck: string): boolean {
    const objectiveContainer = findObjectiveContainer(figureId);
    return (
      !!objectiveContainer &&
      (deck === '' || objectiveContainer.amDeck === deck || gameManager.attackModifierManager.objectiveAmDecks().includes(deck))
    );
  }

  executeWithParameters(figureId: string, deck: string) {
    const objectiveContainer = findObjectiveContainer(figureId);
    if (objectiveContainer) {
      objectiveContainer.amDeck = deck || undefined;
    } else {
      this.executionError('objective not found');
    }
  }
}
