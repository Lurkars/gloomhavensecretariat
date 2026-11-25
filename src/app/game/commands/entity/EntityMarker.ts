import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure } from 'src/app/game/commands/CommandHelper';

export class EntityMarkerCommand extends CommandImpl {
  id: string = 'entity.marker';
  requiredParameters: number = 4;

  validParameters(figureId: string | number, entityId: string | number, marker: string, value: boolean): boolean {
    return (
      typeof value === 'boolean' &&
      gameManager.entityManager.canSetMarker(marker) &&
      findEntities(findFigure(figureId), entityId).length > 0
    );
  }

  executeWithParameters(figureId: string | number, entityId: string | number, marker: string, value: boolean) {
    const entities = findEntities(findFigure(figureId), entityId);
    if (entities.length) {
      gameManager.entityManager.setMarker(entities, marker, value);
    } else {
      this.executionError('entity not found');
    }
  }
}
