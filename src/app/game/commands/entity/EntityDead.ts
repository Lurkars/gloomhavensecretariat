import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';

export class EntityDeadCommand extends CommandImpl {
  id: string = 'entity.dead';
  requiredParameters: number = 2;

  validParameters(figureId: string | number, entityId: string | number): boolean {
    const entities = findEntities(findFigure(figureId), entityId);
    return entities.length > 0 && entities.every((entity) => !(entity instanceof Character));
  }

  executeWithParameters(figureId: string | number, entityId: string | number) {
    const figure = findFigure(figureId);
    const entities = findEntities(figure, entityId);
    if (figure && entities.length) {
      entities.forEach((entity) => gameManager.entityManager.killEntity(entity, figure));
      gameManager.entityManager.removeDeadEntities(
        entities.filter((entity) => gameManager.entityManager.deadRemovable(entity)).map((entity) => ({ entity, figure }))
      );
      gameManager.entityManager.deactivateDeadFigure(figure);
    } else {
      this.executionError('entity not found');
    }
  }
}
