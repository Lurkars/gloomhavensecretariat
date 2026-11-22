import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { GameState } from 'src/app/game/model/Game';

export class FigureNextCommand extends CommandImpl {
  id: string = 'figure.next';
  requiredParameters: number = 1;

  validParameters(seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return true;
  }

  executeWithParameters(seed: number, reverse: boolean) {
    gameManager.game.seed = seed;
    if (gameManager.game.state !== GameState.next) {
      this.executionError('invalid game state');
    }
    const figure = gameManager.roundManager.nextFigure(reverse);
    if (figure) {
      gameManager.roundManager.toggleNextFigure(figure, reverse);
    }
  }
}
