import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntity, findFigure, isFigureLevel } from 'src/app/game/commands/CommandHelper';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';

export class EntityObjectiveMarkerCommand extends CommandImpl {
  id: string = 'entity.objectiveMarker';
  requiredParameters: number = 3;

  validParameters(figureId: string | number, entityId: string | number, marker: string): boolean {
    const figure = findFigure(figureId);
    const entity = isFigureLevel(entityId) ? undefined : findEntity(figure, entityId);
    return (
      figure instanceof ObjectiveContainer &&
      (isFigureLevel(entityId) || entity instanceof ObjectiveEntity) &&
      gameManager.objectiveManager.canSetObjectiveMarker(figure, entity as ObjectiveEntity | undefined, marker)
    );
  }

  executeWithParameters(figureId: string | number, entityId: string | number, marker: string) {
    const figure = findFigure(figureId);
    const entity = isFigureLevel(entityId) ? undefined : findEntity(figure, entityId);
    if (figure instanceof ObjectiveContainer && (!entity || entity instanceof ObjectiveEntity)) {
      gameManager.objectiveManager.setObjectiveMarker(figure, entity, marker);
    } else {
      this.executionError('objective not found');
    }
  }
}
