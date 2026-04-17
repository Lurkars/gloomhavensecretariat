import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { Monster } from 'src/app/game/model/Monster';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
  imports: [NgClass, GhsLabelDirective, PointerInputDirective],
  selector: 'ghs-monster-level-dialog',
  templateUrl: './level-dialog.html',
  styleUrls: ['./level-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonsterLevelDialogComponent {
  levels: number[] = [0, 1, 2, 3, 4, 5, 6, 7];
  gameManager: GameManager = gameManager;

  monster: Monster = inject(DIALOG_DATA);

  constructor(private dialogRef: DialogRef) {}

  setLevel(level: number) {
    ghsDialogClosingHelper(this.dialogRef, level);
  }

  getEdition(): string {
    return gameManager.getEdition(this.monster);
  }

  toggleAlly() {
    gameManager.stateManager.before(this.monster.isAlly ? 'unsetAlly' : 'setAlly', 'data.monster.' + this.monster.name);
    this.monster.isAlly = !this.monster.isAlly;
    gameManager.stateManager.after();
  }

  toggleallied() {
    gameManager.stateManager.before(this.monster.isAllied ? 'unsetAllied' : 'setAllied', 'data.monster.' + this.monster.name);
    this.monster.isAllied = !this.monster.isAllied;
    gameManager.stateManager.after();
  }
}
