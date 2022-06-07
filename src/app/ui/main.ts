import { Component, OnInit } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { GameModel, GameState } from 'src/app/game/model/Game';
import { settingsManager } from '../game/businesslogic/SettingsManager';

@Component({
  selector: 'ghs-main',
  templateUrl: './main.html',
  styleUrls: [ './main.scss' ],
})
export class MainComponent implements OnInit {

  gameManager: GameManager = gameManager;
  GameState = GameState;

  async ngOnInit() {
    await gameManager.loadData(settingsManager.settings.dataUrl || '/assets/data.json');

    const local: string | null = localStorage.getItem("ghs-game");
    if (local != null) {
      const gameModel: GameModel = JSON.parse(local);
      this.gameManager.game.fromModel(gameModel);
    } else {
      localStorage.setItem("ghs-game", JSON.stringify(this.gameManager.game.toModel()));
    }

    document.body.style.setProperty('--ghs-factor', settingsManager.settings.zoom + '');


  }

}