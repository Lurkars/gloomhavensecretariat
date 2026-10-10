import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { GameState } from 'src/app/game/model/Game';

export class RoundStateCommand extends CommandImpl {
  id: string = 'round.state';
  requiredParameters: number = 1;

  validParameters(seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return true;
  }

  executeWithParameters(seed: number) {
    gameManager.game.seed = seed;
    gameManager.roundManager.nextGameState();
  }

  override before(): BASE_TYPE[] {
    return ['command.' + this.id + (gameManager.game.state === GameState.next ? '.next' : '.draw')];
  }
}
