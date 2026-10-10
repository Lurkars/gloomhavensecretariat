import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure } from 'src/app/game/commands/CommandHelper';

export class EntityMarkerCommand extends CommandImpl {
  id: string = 'entity.marker';
  requiredParameters: number = 4;

  validParameters(figureId: string | number, entityId: string | number, marker: string, value: boolean): boolean {
    return (
      typeof value === 'boolean' &&
      typeof marker === 'string' &&
      marker.split('-').length > 1 &&
      findEntities(findFigure(figureId), entityId).length > 0
    );
  }

  executeWithParameters(figureId: string | number, entityId: string | number, marker: string, value: boolean) {
    const entities = findEntities(findFigure(figureId), entityId);
    if (entities.length) {
      if (!value) {
        entities.forEach((entity) => (entity.markers = entity.markers.filter((value) => value !== marker)));
      } else {
        entities.filter((entity) => !entity.markers.includes(marker)).forEach((entity) => entity.markers.push(marker));
      }
    } else {
      this.executionError('entity not found');
    }
  }
}
