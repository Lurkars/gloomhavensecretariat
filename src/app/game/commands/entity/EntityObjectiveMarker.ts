import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntity, findFigure, isFigureLevel } from 'src/app/game/commands/CommandHelper';
import { OBJECTIVE_MARKERS, ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';

export class EntityObjectiveMarkerCommand extends CommandImpl {
  id: string = 'entity.objectiveMarker';
  requiredParameters: number = 3;

  validParameters(figureId: string | number, entityId: string | number, marker: string): boolean {
    const figure = findFigure(figureId);
    return (
      OBJECTIVE_MARKERS.includes(marker) &&
      figure instanceof ObjectiveContainer &&
      (isFigureLevel(entityId) || findEntity(figure, entityId) instanceof ObjectiveEntity)
    );
  }

  executeWithParameters(figureId: string | number, entityId: string | number, marker: string) {
    const figure = findFigure(figureId);
    if (figure instanceof ObjectiveContainer) {
      if (isFigureLevel(entityId)) {
        figure.marker = marker;
        figure.entities.forEach((objectiveEntity) => (objectiveEntity.marker = marker));
      } else {
        const entity = findEntity(figure, entityId);
        if (entity instanceof ObjectiveEntity) {
          entity.marker = marker;
        } else {
          this.executionError('entity not found');
        }
      }
    } else {
      this.executionError('objective not found');
    }
  }
}
