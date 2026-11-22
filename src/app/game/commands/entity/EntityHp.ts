import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure } from 'src/app/game/commands/CommandHelper';

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

      gameManager.entityManager.deactivateDeadFigure(figure);
      gameManager.entityManager.removeDeadEntities(entities.map((entity) => ({ entity, figure })));
    } else {
      this.executionError('entity not found');
    }
  }
}
