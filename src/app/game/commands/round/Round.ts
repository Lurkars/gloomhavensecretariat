import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';

export class RoundNextCommand extends CommandImpl {
  id: string = 'round.next';
  requiredParameters: number = 1;

  validParameters(seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return gameManager.game.state === GameState.next || gameManager.roundManager.drawAvailable();
  }

  activeHint(): boolean {
    return (
      gameManager.game.figures.some((figure) => figure.active && !figure.off && (!(figure instanceof Character) || !figure.absent)) &&
      settingsManager.settings.turnConfirmation &&
      (settingsManager.settings.expireConditions || settingsManager.settings.applyConditions)
    );
  }

  executeWithParameters(seed: number) {
    gameManager.game.seed = seed;
    if (gameManager.game.state === GameState.next) {
      if (settingsManager.settings.turnConfirmation) {
        const activeFigure = gameManager.game.figures.find((figure) => figure.active && !figure.off);
        if (!this.activeHint() && activeFigure) {
          gameManager.roundManager.afterTurn(activeFigure);
        }
      } else {
        let lastActive = gameManager.game.figures.find((figure) => gameManager.gameplayFigure(figure) && !figure.off);
        while (lastActive) {
          gameManager.roundManager.toggleFigure(lastActive, true);
          lastActive = gameManager.game.figures.find((figure) => gameManager.gameplayFigure(figure) && !figure.off);
        }
      }
    }
    gameManager.roundManager.nextGameState();
  }
}

export class RoundEndAllTurnsCommand extends CommandImpl {
  id: string = 'round.endAllTurns';
  requiredParameters: number = 1;

  validParameters(seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return gameManager.game.state === GameState.next;
  }

  executeWithParameters(seed: number) {
    gameManager.game.seed = seed;
    gameManager.game.figures.forEach((figure) => gameManager.roundManager.afterTurn(figure));
  }
}

export class RoundResetCommand extends CommandImpl {
  id: string = 'round.reset';
  requiredParameters: number = 1;

  validParameters(value: number): boolean {
    return typeof value === 'number' && value >= 0;
  }

  executeWithParameters(value: number) {
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
  }
}
