import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findFigure, validSeed } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';

export class FigureActiveCommand extends CommandImpl {
  id: string = 'figure.active';
  requiredParameters: number = 2;

  validParameters(figureId: string | number, seed: number): boolean {
    const figure = findFigure(figureId);
    if (!validSeed(seed) || !figure || gameManager.game.state !== GameState.next) {
      return false;
    }
    return !(figure instanceof Character) || gameManager.characterManager.canToggleActive(figure);
  }

  executeWithParameters(figureId: string | number, seed: number) {
    gameManager.game.seed = seed;
    const figure = findFigure(figureId);
    if (figure instanceof Character) {
      gameManager.characterManager.toggleActive(figure);
    } else if (figure) {
      gameManager.turnManager.toggleFigure(figure);
    } else {
      this.executionError('figure not found');
    }
  }
}
