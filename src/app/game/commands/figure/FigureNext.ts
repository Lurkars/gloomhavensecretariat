import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { GameState } from 'src/app/game/model/Game';

export class FigureNextCommand extends CommandImpl {
  id: string = 'figure.next';
  requiredParameters: number = 1;

  validParameters(seed: number, reverse: boolean = false): boolean {
    return validSeed(seed) && gameManager.game.state === GameState.next && !!gameManager.turnManager.nextFigure(!!reverse);
  }

  executeWithParameters(seed: number, reverse: boolean = false) {
    gameManager.game.seed = seed;
    const figure = gameManager.turnManager.nextFigure(!!reverse);
    if (figure) {
      gameManager.turnManager.toggleNextFigure(figure, !!reverse);
    }
  }
}
