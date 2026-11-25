import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Game, GameClockTimestamp } from 'src/app/game/model/Game';

export class GameClockManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  toggleGameClock() {
    this.game.gameClock = this.game.gameClock || [];
    let last: GameClockTimestamp | undefined = this.game.gameClock.length ? this.game.gameClock[0] : undefined;
    if (last) {
      if (!last.clockIn) {
        console.warn('Timestamp with invalid clock:', last);
        last.clockIn = new Date().getTime();
      } else if (!last.clockOut) {
        last.clockOut = new Date().getTime();
      } else {
        last = undefined;
      }
    }

    if (!last) {
      this.game.gameClock.unshift(new GameClockTimestamp(new Date().getTime()));
    }
    gameManager.stateManager.saveLocal();
  }

  clockedIn(): boolean {
    const last = this.game.gameClock && this.game.gameClock.length ? this.game.gameClock[0] : undefined;
    return !!last && !last.clockOut;
  }

  // a clock out shortly before (e.g. a page refresh) is resumed instead of starting a new timestamp
  automaticClockIn() {
    const last = this.game.gameClock && this.game.gameClock.length ? this.game.gameClock[0] : undefined;
    if (last && last.clockOut && new Date().getTime() - last.clockOut < 7000) {
      last.clockOut = undefined;
    } else {
      this.toggleGameClock();
    }
  }

  canSetGameClock(clockIn: boolean, timestamp: number): boolean {
    return (
      typeof clockIn === 'boolean' &&
      Number.isFinite(timestamp) &&
      this.clockedIn() !== clockIn &&
      (clockIn || timestamp >= this.game.gameClock[0].clockIn)
    );
  }

  setGameClock(clockIn: boolean, timestamp: number): boolean {
    if (!this.canSetGameClock(clockIn, timestamp)) {
      return false;
    }
    this.game.gameClock = this.game.gameClock || [];
    if (clockIn) {
      this.game.gameClock.unshift(new GameClockTimestamp(timestamp));
    } else {
      this.game.gameClock[0].clockOut = timestamp;
    }
    return true;
  }

  canMergeGameClock(index: number): boolean {
    return Number.isInteger(index) && index > 0 && index < (this.game.gameClock || []).length;
  }

  mergeGameClock(index: number): boolean {
    if (!this.canMergeGameClock(index)) {
      return false;
    }
    this.game.gameClock[index - 1].clockIn = this.game.gameClock[index].clockIn;
    this.game.gameClock.splice(index, 1);
    return true;
  }

  mergeGameClocks(gameClockA: GameClockTimestamp[], gameClockB: GameClockTimestamp[]): GameClockTimestamp[] {
    const gameClock: GameClockTimestamp[] = [];

    gameClockA.forEach((value) => {
      const matchingValue = gameClockB.find(
        (other) =>
          other.clockIn <= value.clockIn && ((other.clockOut && value.clockOut && other.clockOut >= value.clockOut) || !other.clockOut)
      );
      if (matchingValue) {
        gameClock.push(matchingValue);
      } else {
        gameClock.push(value);
      }
    });

    gameClockB.forEach((value) => {
      if (
        !gameClock.find(
          (other) =>
            other.clockIn <= value.clockIn && ((other.clockOut && value.clockOut && other.clockOut >= value.clockOut) || !other.clockOut)
        )
      ) {
        gameClock.push(value);
      }
    });

    return gameClock.sort((a, b) => b.clockIn - a.clockIn);
  }
}
