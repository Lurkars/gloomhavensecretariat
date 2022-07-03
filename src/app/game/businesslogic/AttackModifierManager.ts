import { AttackModifier, AttackModifierType } from "../model/AttackModifier";
import { Game } from "../model/Game";

export class AttackModifierManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
    this.shuffleModifiers();
  }

  addModifier(attackModifier: AttackModifier, index: number = -1) {
    if (index < 0 || index > this.game.attackModifiers.length) {
      index =
        Math.random() *
        (this.game.attackModifiers.length - this.game.attackModifier + 1) +
        this.game.attackModifier;
    }
    this.game.attackModifiers.splice(index, 0, attackModifier);
  }

  drawModifier() {
    this.game.attackModifier = this.game.attackModifier + 1;
    if (this.game.attackModifier == this.game.attackModifiers.length) {
      this.shuffleModifiers();
    }
  }

  shuffleModifiers() {
    this.game.attackModifiers = this.game.attackModifiers.filter(
      (attackModifier: AttackModifier, index: number) =>
        index > this.game.attackModifier ||
        (attackModifier.type != AttackModifierType.bless &&
          attackModifier.type != AttackModifierType.curse)
    );

    this.game.attackModifier = -1;
    this.game.attackModifiers = this.game.attackModifiers
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }

  removeDrawnDiscards() {
    const before = this.game.attackModifiers.length;
    this.game.attackModifiers = this.game.attackModifiers.filter(
      (attackModifier: AttackModifier, index: number) =>
        index > this.game.attackModifier ||
        (attackModifier.type != AttackModifierType.bless &&
          attackModifier.type != AttackModifierType.curse)
    );
    this.game.attackModifier = this.game.attackModifier - (before - this.game.attackModifiers.length);
  }

  next() {
    if (
      this.game.attackModifiers.some(
        (attackModifier: AttackModifier, index: number) => {
          return index <= this.game.attackModifier && attackModifier.shuffle;
        }
      )
    ) {
      this.shuffleModifiers();
    }
  }

  draw() { }
}
