import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { GameState } from 'src/app/game/model/Game';

export class RoundNextCommand extends CommandImpl {
  id: string = 'round.next';
  requiredParameters: number = 1;

  validParameters(seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return gameManager.game.state === GameState.next || gameManager.roundManager.drawAvailable();
  }

  executeWithParameters(seed: number) {
    gameManager.game.seed = seed;
    gameManager.roundManager.nextRound();
  }
}

export class RoundEndAllTurnsCommand extends CommandImpl {
  id: string = 'round.endAllTurns';
  requiredParameters: number = 1;

  validParameters(seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return gameManager.game.state === GameState.next;
  }

  executeWithParameters(seed: number) {
    gameManager.game.seed = seed;
    gameManager.roundManager.endAllTurns();
  }
}

export class RoundResetCommand extends CommandImpl {
  id: string = 'round.reset';
  requiredParameters: number = 1;

  validParameters(value: number): boolean {
    return typeof value === 'number' && value >= 0;
  }

  executeWithParameters(value: number) {
    gameManager.roundManager.setRoundReset(value);
  }
}
