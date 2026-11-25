import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntity, findFigure } from 'src/app/game/commands/CommandHelper';

export class EntityActiveCommand extends CommandImpl {
  id: string = 'entity.active';
  requiredParameters: number = 3;

  validParameters(figureId: string | number, entityId: string | number, active: boolean): boolean {
    const figure = findFigure(figureId);
    const entity = findEntity(figure, entityId);
    return !!figure && !!entity && gameManager.entityManager.canSetEntityActive(figure, entity, active);
  }

  executeWithParameters(figureId: string | number, entityId: string | number, active: boolean) {
    const figure = findFigure(figureId);
    const entity = findEntity(figure, entityId);
    if (!figure || !entity || !gameManager.entityManager.setEntityActive(figure, entity, active)) {
      this.executionError('entity not found');
    }
  }
}
