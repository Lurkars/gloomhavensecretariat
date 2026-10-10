import type { Game } from 'src/app/game/model/Game';

export function randomSeed(): number {
  return Math.floor(Math.random() * 4294967296) | 0;
}

export class RandomManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  next(): number {
    this.game.seed = (this.game.seed + 0x6d2b79f5) | 0;
    let t = this.game.seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(max: number): number {
    return Math.floor(this.next() * max);
  }

  shuffle<T>(array: T[]): T[] {
    let i = array.length;
    while (i !== 0) {
      const r = this.int(i);
      i--;
      [array[i], array[r]] = [array[r], array[i]];
    }
    return array;
  }

  uuid(): string {
    const hex = (value: number) => (value >>> 0).toString(16).padStart(8, '0');
    const random = () => Math.floor(this.next() * 4294967296);
    const value = hex(random()) + hex(random()) + hex(random()) + hex(random());
    const variant = ((parseInt(value[16], 16) & 0x3) | 0x8).toString(16);
    return (
      value.slice(0, 8) +
      '-' +
      value.slice(8, 12) +
      '-4' +
      value.slice(13, 16) +
      '-' +
      variant +
      value.slice(17, 20) +
      '-' +
      value.slice(20, 32)
    );
  }
}
