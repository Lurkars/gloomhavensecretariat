import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';

export class GameClockCommand extends CommandImpl {
  id: string = 'gameClock.clock';
  requiredParameters: number = 2;

  validParameters(clockIn: boolean, timestamp: number): boolean {
    return gameManager.gameClockManager.canSetGameClock(clockIn, timestamp);
  }

  executeWithParameters(clockIn: boolean, timestamp: number) {
    gameManager.gameClockManager.setGameClock(clockIn, timestamp);
  }
}

export class GameClockMergeCommand extends CommandImpl {
  id: string = 'gameClock.merge';
  requiredParameters: number = 1;

  index(clockIn: number): number {
    return (gameManager.game.gameClock || []).findIndex((timestamp) => timestamp.clockIn === clockIn);
  }

  validParameters(clockIn: number): boolean {
    return typeof clockIn === 'number' && gameManager.gameClockManager.canMergeGameClock(this.index(clockIn));
  }

  executeWithParameters(clockIn: number) {
    gameManager.gameClockManager.mergeGameClock(this.index(clockIn));
  }
}
