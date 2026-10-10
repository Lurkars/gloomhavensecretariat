import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findEntity, findFigure } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { Figure } from 'src/app/game/model/Figure';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { Summon } from 'src/app/game/model/Summon';

type Titled = Character | Summon | ObjectiveContainer;

export class EntityTitleCommand extends CommandImpl {
  id: string = 'entity.title';
  requiredParameters: number = 3;

  titled(figure: Figure | undefined, entityId: BASE_TYPE): Titled | undefined {
    if (figure instanceof ObjectiveContainer) {
      return figure;
    }
    const entity = findEntity(figure, entityId);
    return entity instanceof Character || entity instanceof Summon ? entity : undefined;
  }

  validParameters(figureId: string | number, entityId: string | number, title: string): boolean {
    return typeof title === 'string' && !!this.titled(findFigure(figureId), entityId);
  }

  executeWithParameters(figureId: string | number, entityId: string | number, title: string) {
    const titled = this.titled(findFigure(figureId), entityId);
    if (titled) {
      titled.title = title;
    } else {
      this.executionError('entity not found');
    }
  }
}
