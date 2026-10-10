import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findObjectiveContainer } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';

export class ObjectiveAmDeckCommand extends CommandImpl {
  id: string = 'objective.amDeck';
  requiredParameters: number = 2;

  amDecks(): string[] {
    const amDecks = ['M'];
    if (
      settingsManager.settings.allyAttackModifierDeck &&
      (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules(true))
    ) {
      amDecks.push('A');
    }
    amDecks.push(
      ...gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent).map((figure) => figure.name)
    );
    return amDecks;
  }

  validParameters(figureId: string, deck: string): boolean {
    const objectiveContainer = findObjectiveContainer(figureId);
    return !!objectiveContainer && (deck === '' || objectiveContainer.amDeck === deck || this.amDecks().includes(deck));
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
