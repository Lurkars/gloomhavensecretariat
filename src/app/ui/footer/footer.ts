import { Component } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
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

  next(force: boolean = false): void {
    if (!force && this.disabled()) {
      this.open();
    } else {
      this.close();
      gameManager.stateManager.before();
      const activeFigure = gameManager.game.figures.find((figure: Figure) => figure.active && !figure.off);
      if (!this.active() && activeFigure) {
        gameManager.endTurn(activeFigure);
      }
      gameManager.nextGameState();
      gameManager.stateManager.after(1000);
    }
  }

  confirmTurns() {
    gameManager.game.figures.forEach((figure: Figure) => gameManager.endTurn(figure));
    this.next(true);
  }

  empty(): boolean {
    return gameManager.game.figures.length == 0;
  }

  missingInitative(): boolean {
    return gameManager.game.figures.some((figure: Figure) => figure instanceof Character && figure.initiative < 1 && !figure.exhausted);
  }

  active(): boolean {
    const activeFigure = gameManager.game.figures.find((figure: Figure) => figure.active && !figure.off);

    if (!activeFigure) {
      return false;
    }

    return gameManager.game.figures.find((figure: Figure, index: number) => !figure.off && index > gameManager.game.figures.indexOf(activeFigure)) != undefined;
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
}

