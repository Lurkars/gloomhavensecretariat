import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findFigure } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';

export class FigureInitiativeCommand extends CommandImpl {
  id: string = 'figure.initiative';
  requiredParameters: number = 2;

  validParameters(figureId: string | number, initiative: number): boolean {
    const figure = findFigure(figureId);
    return (
      (figure instanceof Character || figure instanceof ObjectiveContainer) &&
      typeof initiative === 'number' &&
      initiative >= 0 &&
      initiative <= 99 &&
      (initiative > 0 || gameManager.game.state === GameState.draw || !settingsManager.settings.initiativeRequired)
    );
  }

  executeWithParameters(figureId: string | number, initiative: number) {
    const figure = findFigure(figureId);
    if (figure instanceof Character) {
      figure.initiative = initiative;
      figure.initiativeVisible = true;
      if (initiative === 99) {
        figure.longRest = true;
      } else if (!initiative || figure.name !== 'prism' || !figure.tags.includes('long_rest')) {
        figure.longRest = false;
      }
    } else if (figure instanceof ObjectiveContainer) {
      figure.initiative = initiative;
    } else {
      this.executionError('figure not found');
    }
    if (figure && gameManager.game.state === GameState.next) {
      gameManager.sortFigures(figure);
    }
  }
}
