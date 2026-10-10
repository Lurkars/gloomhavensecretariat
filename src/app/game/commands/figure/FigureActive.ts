import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findFigure, validSeed } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';

export class FigureActiveCommand extends CommandImpl {
  id: string = 'figure.active';
  requiredParameters: number = 2;

  validParameters(figureId: string | number, seed: number): boolean {
    const figure = findFigure(figureId);
    if (!figure || gameManager.game.state !== GameState.next) {
      if (!validSeed(seed)) {
        return false;
      }
      return false;
    }
    if (figure instanceof Character) {
      return !figure.absent && !figure.exhausted && (!settingsManager.settings.initiativeRequired || figure.initiative > 0);
    }
    return true;
  }

  executeWithParameters(figureId: string | number, seed: number) {
    gameManager.game.seed = seed;
    const figure = findFigure(figureId);
    if (figure instanceof Character) {
      const activeSummon = figure.summons.find((summon) => summon.active);
      const summonsAfterTurn = figure.summons.filter((summon) => summon.afterTurn);
      if (
        settingsManager.settings.activeSummons &&
        !activeSummon &&
        figure.active &&
        summonsAfterTurn.length &&
        !summonsAfterTurn.find((summon) => summon.active)
      ) {
        summonsAfterTurn.forEach((spirit) => (spirit.afterTurnActive = true));
      }
      gameManager.roundManager.toggleFigure(figure);
    } else if (figure) {
      gameManager.roundManager.toggleFigure(figure);
    } else {
      this.executionError('figure not found');
    }
  }
}
