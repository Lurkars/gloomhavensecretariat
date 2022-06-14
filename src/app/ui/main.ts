import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { Game, GameModel, GameState } from 'src/app/game/model/Game';
import { SettingsManager, settingsManager } from '../game/businesslogic/SettingsManager';
import { Figure } from '../game/model/Figure';

@Component({
  selector: 'ghs-main',
  templateUrl: './main.html',
  styleUrls: [ './main.scss' ],
})
export class MainComponent implements OnInit {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;

  async ngOnInit() {
    await settingsManager.init();
    const local: string | null = localStorage.getItem("ghs-game");
    if (local != null) {
      const gameModel: GameModel = Object.assign(new GameModel(), JSON.parse(local));
      gameManager.game.fromModel(gameModel);
    } else {
      localStorage.setItem("ghs-game", JSON.stringify(this.gameManager.game.toModel()));
    }

    document.body.style.setProperty('--ghs-factor', settingsManager.settings.zoom + '');
  }

  drop(event: CdkDragDrop<Figure[]>) {
    gameManager.stateManager.before();
    moveItemInArray(gameManager.game.figures, event.previousIndex, event.currentIndex);
    gameManager.stateManager.after();
  }

}