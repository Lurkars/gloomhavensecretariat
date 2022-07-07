import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { GameState } from 'src/app/game/model/Game';
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
    document.body.classList.add('no-select');
    await settingsManager.init();
    gameManager.stateManager.init();
    document.body.style.setProperty('--ghs-factor', settingsManager.settings.zoom + '');
  }

  drop(event: CdkDragDrop<Figure[]>) {
    gameManager.stateManager.before();
    moveItemInArray(gameManager.game.figures, event.previousIndex, event.currentIndex);
    gameManager.stateManager.after();
  }

}