import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Component, Inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { Monster } from 'src/app/game/model/Monster';

@Component({
  selector: 'ghs-monster-level-dialog',
  templateUrl: './level-dialog.html',
  styleUrls: ['./level-dialog.scss']
})
export class MonsterLevelDialogComponent {

  levels: number[] = [0, 1, 2, 3, 4, 5, 6, 7];
  gameManager: GameManager = gameManager;

  constructor(@Inject(DIALOG_DATA) public monster: Monster, private dialogRef: DialogRef<number>) { }

  setLevel(level: number) {
    this.dialogRef.close(level);
  }

  getEdition(): string {
    return gameManager.getEdition(this.monster);
  }

  toggleAlly() {
    gameManager.stateManager.before(this.monster.isAlly ? "unsetAlly" : "setAlly", "data.monster." + this.monster.name);
    this.monster.isAlly = !this.monster.isAlly;
    gameManager.stateManager.after();
  }

  toggleallied() {
    gameManager.stateManager.before(this.monster.isAllied ? "unsetallied" : "setallied", "data.monster." + this.monster.name);
    this.monster.isAllied = !this.monster.isAllied;
    gameManager.stateManager.after();
  }

}