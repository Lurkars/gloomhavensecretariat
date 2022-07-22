import { Component } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Figure } from 'src/app/game/model/Figure';
import { GameState } from 'src/app/game/model/Game';
import { DialogComponent } from '../dialog/dialog';

@Component({
  selector: 'ghs-footer',
  templateUrl: './footer.html',
  styleUrls: [ './footer.scss', '../dialog/dialog.scss' ]
})
export class FooterComponent extends DialogComponent {

  gameManager: GameManager = gameManager;
  GameState = GameState;
  currentTime: string = "";

  next(force: boolean = false): void {
    if (!force && this.disabled()) {
      this.open();
    } else {
      this.close();
      gameManager.stateManager.before();
      const activeFigure = gameManager.game.figures.find((figure: Figure) => figure.active && !figure.off);
      if (!this.active() && activeFigure) {
        gameManager.afterTurn(activeFigure);
      }
      gameManager.nextGameState();
      gameManager.stateManager.after(1000);
    }
  }

  confirmTurns() {
    gameManager.game.figures.forEach((figure: Figure) => gameManager.afterTurn(figure));
    this.next(true);
  }

  empty(): boolean {
    return gameManager.game.figures.length == 0;
  }

  missingInitative(): boolean {
    return gameManager.game.figures.some((figure: Figure) => figure instanceof Character && settingsManager.settings.initiativeRequired &&  figure.initiative < 1 && !figure.exhausted);
  }

  active(): boolean {
    return gameManager.game.figures.find((figure: Figure) => figure.active && !figure.off) != undefined;
  };

  disabled(): boolean {
    return (gameManager.game.state == GameState.draw && this.drawDisabled() || gameManager.game.state == GameState.next && this.nextDisabled());
  }

  drawDisabled(): boolean {
    return this.empty() || this.missingInitative();
  }

  nextDisabled(): boolean {
    return this.active();
  }


  override ngOnInit(): void {
    super.ngOnInit();

    setInterval(() => {
      gameManager.game.playSeconds++;
      let seconds = gameManager.game.playSeconds;
      this.currentTime = "";
      if (seconds / 3600 >= 1) {
        this.currentTime += Math.floor(seconds / 3600) + "h ";
        seconds = seconds % 3600;
      }

      if (seconds / 60 >= 1) {
        this.currentTime += (this.currentTime && this.currentTime && Math.floor(seconds / 60) < 10 ? '0' : '') + Math.floor(seconds / 60) + "m ";
        seconds = seconds % 60;
      }
      this.currentTime += (this.currentTime && seconds < 10 ? '0' : '') + Math.floor(seconds) + "s";

      // store every 30 seconds
      if ((new Date().getTime() / 1000 - gameManager.stateManager.lastSaveTimestamp / 1000) > 30) {
        gameManager.stateManager.after();
      }

    }, 1000)
  }

}

