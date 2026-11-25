import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure } from 'src/app/game/commands/CommandHelper';

export class EntityMaxHpCommand extends CommandImpl {
  id: string = 'entity.maxHp';
  requiredParameters: number = 3;

  validParameters(figureId: string | number, entityId: string | number, value: number): boolean {
    return typeof value === 'number' && gameManager.entityManager.canChangeMaxHealth(findEntities(findFigure(figureId), entityId), value);
  }

  executeWithParameters(figureId: string | number, entityId: string | number, value: number) {
    if (!gameManager.entityManager.changeMaxHealth(findEntities(findFigure(figureId), entityId), value)) {
      this.executionError('entity not found');
    }
  }
}
