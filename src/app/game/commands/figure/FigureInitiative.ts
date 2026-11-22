import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findFigure } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';

export class FigureInitiativeCommand extends CommandImpl {
  id: string = 'figure.initiative';
  requiredParameters: number = 2;

  validParameters(figureId: string | number, initiative: number): boolean {
    const figure = findFigure(figureId);
    return (
      (figure instanceof Character || figure instanceof ObjectiveContainer) &&
      typeof initiative === 'number' &&
      gameManager.roundManager.validInitiative(initiative)
    );
  }

  executeWithParameters(figureId: string | number, initiative: number) {
    const figure = findFigure(figureId);
    if (figure instanceof Character || figure instanceof ObjectiveContainer) {
      gameManager.roundManager.setInitiative(figure, initiative);
    } else {
      this.executionError('figure not found');
    }
  }
}
