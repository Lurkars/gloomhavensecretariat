import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findFigure } from 'src/app/game/commands/CommandHelper';

export class FigureReorderCommand extends CommandImpl {
  id: string = 'figure.reorder';
  requiredParameters: number = 2;

  validParameters(figureId: string | number, beforeFigureId: string | number): boolean {
    const figure = findFigure(figureId);
    const before = beforeFigureId === '' ? undefined : findFigure(beforeFigureId);
    return !!figure && (beforeFigureId === '' || (!!before && before !== figure));
  }

  executeWithParameters(figureId: string | number, beforeFigureId: string | number) {
    const figures = gameManager.game.figures;
    const figure = findFigure(figureId);
    if (figure) {
      figures.splice(figures.indexOf(figure), 1);
      const before = beforeFigureId === '' ? undefined : findFigure(beforeFigureId);
      figures.splice(before ? figures.indexOf(before) : figures.length, 0, figure);
    } else {
      this.executionError('figure not found');
    }
  }
}
