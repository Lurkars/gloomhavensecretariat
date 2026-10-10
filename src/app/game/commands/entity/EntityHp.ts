import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure, removeDeadEntity } from 'src/app/game/commands/CommandHelper';
import { Monster } from 'src/app/game/model/Monster';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';

export class EntityHpCommand extends CommandImpl {
  id: string = 'entity.hp';
  requiredParameters: number = 3;

  validParameters(figureId: string | number, entityId: string | number, value: number): boolean {
    return typeof value === 'number' && value !== 0 && findEntities(findFigure(figureId), entityId).length > 0;
  }

  executeWithParameters(figureId: string | number, entityId: string | number, value: number) {
    const figure = findFigure(figureId);
    const entities = findEntities(figure, entityId);
    if (figure && entities.length) {
      entities.forEach((entity) => gameManager.entityManager.changeHealth(entity, figure, value));

      if (
        (figure instanceof Monster || figure instanceof ObjectiveContainer) &&
        figure.active &&
        figure.entities.every((entity) => !gameManager.entityManager.isAlive(entity))
      ) {
        gameManager.roundManager.toggleFigure(figure);
      }

      entities.forEach((entity) => removeDeadEntity(figure, entity));
    } else {
      this.executionError('entity not found');
    }
  }
}
