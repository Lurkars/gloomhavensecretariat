import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure, isAllEntities } from 'src/app/game/commands/CommandHelper';

export class EntityShieldCommand extends CommandImpl {
  id: string = 'entity.shield';
  requiredParameters: number = 3;

  validParameters(figureId: string | number, entityId: string | number, value: number): boolean {
    return (
      typeof value === 'number' &&
      findEntities(findFigure(figureId), entityId).some((entity) => gameManager.shieldRetaliateManager.enabled(entity))
    );
  }

  executeWithParameters(figureId: string | number, entityId: string | number, value: number, persistent: boolean = false) {
    const entities = findEntities(findFigure(figureId), entityId);
    if (entities.length) {
      entities
        .filter((entity) => gameManager.shieldRetaliateManager.enabled(entity))
        .forEach((entity) =>
          gameManager.shieldRetaliateManager.setShield(
            entity,
            persistent,
            value,
            isAllEntities(findFigure(figureId), entityId) && !!gameManager.shieldRetaliateManager.shieldAction(entity, persistent)
          )
        );
    } else {
      this.executionError('entity not found');
    }
  }
}
