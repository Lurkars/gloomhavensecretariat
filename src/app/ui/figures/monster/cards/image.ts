import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, Input } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
	standalone: false,
  selector: 'ghs-monster-image',
  templateUrl: './image.html',
  styleUrls: ['./image.scss']
})
export class MonsterImageComponent {

  @Input() monster!: Monster;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;

  constructor(private dialog: Dialog) { }

  toggleFigure() {
    if (gameManager.game.state == GameState.next && gameManager.monsterManager.monsterEntityCount(this.monster)) {
      gameManager.stateManager.before(this.monster.active ? "unsetActive" : "setActive", "data.monster." + this.monster.name);
      gameManager.roundManager.toggleFigure(this.monster);
      gameManager.stateManager.after();
    } else {
      this.imageDialog();
    }
  }

  imageDialog() {
    if (settingsManager.settings.artwork && (!this.monster.noArtwork || !this.monster.noThumbnail)) {
      this.dialog.open(MonsterImageDialogComponent, {
        data: this.monster
      });
    }
  }

}


@Component({
	standalone: false,
  selector: 'ghs-monster-image-dialog',
  templateUrl: './imagedialog.html',
  styleUrls: ['./imagedialog.scss']
})
export class MonsterImageDialogComponent {

  gameManager: GameManager = gameManager;


  opened: boolean = false;

  constructor(@Inject(DIALOG_DATA) public monster: Monster, private dialogRef: DialogRef) {
  }

  ngOnInit(): void {
    this.opened = true;
  }

  close() {
    this.opened = false;
    setTimeout(() => {
      ghsDialogClosingHelper(this.dialogRef);
    }, 400);
  }

}