import { Component, OnInit } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { Game, GameModel, GameState } from 'src/app/game/model/Game';
import { settingsManager } from '../game/businesslogic/SettingsManager';
import { CharacterEntity } from '../game/model/CharacterEntity';
import { Figure } from '../game/model/Figure';
import { Monster } from '../game/model/Monster';

@Component({
  selector: 'ghs-main',
  templateUrl: './main.html',
  styleUrls: [ './main.scss' ],
})
export class MainComponent implements OnInit {

  gameManager: GameManager = gameManager;
  GameState = GameState;

  async ngOnInit() {
    await settingsManager.init();
    const local: string | null = localStorage.getItem("ghs-game");
    if (local != null) {
      const gameModel: GameModel = Object.assign(new Game(), JSON.parse(local));
      gameManager.game.fromModel(gameModel);
    } else {
      localStorage.setItem("ghs-game", JSON.stringify(this.gameManager.game.toModel()));
    }

    document.body.style.setProperty('--ghs-factor', settingsManager.settings.zoom + '');
  }

  sortedFigures(): Figure[] {
    gameManager.game.figures = gameManager.game.figures.sort((a: Figure, b: Figure) => {
      if (gameManager.game.state == GameState.draw || (a.getInitiative() < 1 && b.getInitiative() < 1)) {
        if (a instanceof CharacterEntity && b instanceof Monster) {
          return -1;
        } else if (a instanceof Monster && b instanceof CharacterEntity) {
          return 1;
        }

        const aName = a instanceof CharacterEntity ? (a.title.toLowerCase() || settingsManager.getLabel('data.character.' + a.name).toLowerCase()) :
          settingsManager.getLabel('data.monster.' + a.name).toLowerCase();
        const bName = b instanceof CharacterEntity ? (b.title.toLowerCase() || settingsManager.getLabel('data.character.' + b.name).toLowerCase()) :
          settingsManager.getLabel('data.monster.' + b.name).toLowerCase();
        return aName < bName ? -1 : 1;
      }

      if (a instanceof CharacterEntity && a.exhausted) {
        return 99;
      }

      if (b instanceof CharacterEntity && b.exhausted) {
        return 99;
      }
      return a.getInitiative() - b.getInitiative();
    });

    return gameManager.game.figures;
  }

}