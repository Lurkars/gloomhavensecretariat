import type { Game } from 'src/app/game/model/Game';

const SEED_STEP = 0x6d2b79f5;

export function randomSeed(): number {
  return Math.floor(Math.random() * 4294967296) | 0;
}

function seedValue(seed: number): number {
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function uuidFrom(next: () => number): string {
  const hex = (value: number) => (value >>> 0).toString(16).padStart(8, '0');
  const random = () => Math.floor(next() * 4294967296);
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

// for ids outside of the game state, must not touch the game seed
export function randomUUID(): string {
  return uuidFrom(Math.random);
}

// Outside of a state change (stateManager.before/after) draws are previews: they use a stream derived from the game seed
// and leave the synced seed untouched. The next state change advances the game seed once if any preview was drawn.
export class RandomManager {
  game: Game;
  previewOutsideChanges: boolean = false;
  private changing: boolean = false;
  private previewed: boolean = false;
  private previewBase: number = 0;
  private previewState: number | undefined;

  constructor(game: Game) {
    this.game = game;
  }

  next(): number {
    if (this.previewOutsideChanges && !this.changing) {
      if (this.previewState === undefined || this.previewBase !== this.game.seed) {
        this.previewBase = this.game.seed;
        this.previewState = Math.floor(seedValue((this.game.seed + SEED_STEP) | 0) * 4294967296) | 0;
      }
      this.previewState = (this.previewState + SEED_STEP) | 0;
      this.previewed = true;
      return seedValue(this.previewState);
    }
    this.game.seed = (this.game.seed + SEED_STEP) | 0;
    return seedValue(this.game.seed);
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
    return uuidFrom(() => this.next());
  }

  beginChange() {
    this.changing = true;
    this.previewState = undefined;
    if (this.previewed) {
      this.previewed = false;
      this.game.seed = (this.game.seed + SEED_STEP) | 0;
    }
  }

  endChange() {
    this.changing = false;
    this.previewState = undefined;
  }
}
