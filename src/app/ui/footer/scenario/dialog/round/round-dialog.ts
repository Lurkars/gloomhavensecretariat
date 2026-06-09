import { DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GameState } from 'src/app/game/model/Game';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsNumberInput } from 'src/app/ui/helper/number-input/number-input';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsNumberInput],
  selector: 'ghs-round-dialog',
  templateUrl: './round-dialog.html',
  styleUrls: ['./round-dialog.scss']
})
export class RoundDialogComponent {
  private dialogRef = inject(DialogRef);

  gameManager: GameManager = gameManager;

  get currentReset(): number {
    const hidden = gameManager.game.roundResetsHidden;
    return hidden.length > 0 ? hidden[hidden.length - 1] || 0 : 0;
  }

  currentRound(): number {
    const g = gameManager.game;
    const offset = (g.round > 0 || g.roundResets.length > 0 || g.roundResetsHidden.length > 0) && g.state === GameState.draw ? 1 : 0;
    return g.round + offset + g.roundResetsHidden.reduce((a, b) => (a || 0) + (b || 0), 0);
  }

  private safeMin(min: number): number {
    return min === 0 ? -Number.EPSILON : min;
  }

  minReset(): number {
    const hidden = gameManager.game.roundResetsHidden;
    const lastValue = hidden.length > 0 ? hidden[hidden.length - 1] || 0 : 0;
    return this.safeMin(1 + lastValue - this.currentRound());
  }

  resetSteps(): number[] {
    const base = [1, 2, 3];
    const values = new Set(base);
    const jump = this.currentRound() - 1;
    if (jump > base[base.length - 1]) {
      values.add(jump);
    }
    const resetAbs = Math.abs(this.currentReset);
    if (resetAbs > 0) {
      values.add(resetAbs);
    }
    return Array.from(values).sort((a, b) => a - b);
  }

  setReset(value: number): void {
    gameManager.stateManager.before('setRoundReset', '' + value);
    const hidden = gameManager.game.roundResetsHidden;
    if (hidden.length === 0) {
      if (value !== 0) {
        hidden.push(value);
      }
    } else if (value === 0) {
      hidden.splice(hidden.length - 1, 1);
    } else {
      hidden[hidden.length - 1] = value;
    }
    gameManager.stateManager.after();
  }

  close(): void {
    ghsDialogClosingHelper(this.dialogRef);
  }
}
