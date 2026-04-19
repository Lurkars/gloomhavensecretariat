import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { GameState } from 'src/app/game/model/Game';

export class RoundStateCommand extends CommandImpl {
  id: string = 'round.state';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return true;
  }

  executeWithParameters() {
    gameManager.roundManager.nextGameState();
  }

  override before(): BASE_TYPE[] {
    return ['command.' + this.id + (gameManager.game.state === GameState.next ? '.next' : '.draw')];
  }
}
