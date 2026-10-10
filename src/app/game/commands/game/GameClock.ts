import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { GameClockTimestamp } from 'src/app/game/model/Game';

function running(): boolean {
  const gameClock = gameManager.game.gameClock || [];
  return gameClock.length > 0 && !gameClock[0].clockOut;
}

export class GameClockCommand extends CommandImpl {
  id: string = 'gameClock.clock';
  requiredParameters: number = 2;

  validParameters(clockIn: boolean, timestamp: number): boolean {
    return (
      typeof clockIn === 'boolean' &&
      typeof timestamp === 'number' &&
      running() !== clockIn &&
      (clockIn || timestamp >= gameManager.game.gameClock[0].clockIn)
    );
  }

  executeWithParameters(clockIn: boolean, timestamp: number) {
    gameManager.game.gameClock = gameManager.game.gameClock || [];
    if (clockIn) {
      gameManager.game.gameClock.unshift(new GameClockTimestamp(timestamp));
    } else {
      gameManager.game.gameClock[0].clockOut = timestamp;
    }
  }
}

export class GameClockMergeCommand extends CommandImpl {
  id: string = 'gameClock.merge';
  requiredParameters: number = 1;

  index(clockIn: number): number {
    return (gameManager.game.gameClock || []).findIndex((timestamp) => timestamp.clockIn === clockIn);
  }

  validParameters(clockIn: number): boolean {
    return typeof clockIn === 'number' && this.index(clockIn) > 0;
  }

  executeWithParameters(clockIn: number) {
    const index = this.index(clockIn);
    gameManager.game.gameClock[index - 1].clockIn = gameManager.game.gameClock[index].clockIn;
    gameManager.game.gameClock.splice(index, 1);
  }
}
