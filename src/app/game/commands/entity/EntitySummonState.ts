import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findEntity, findFigure } from 'src/app/game/commands/CommandHelper';
import { Entity } from 'src/app/game/model/Entity';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { Summon, SummonState } from 'src/app/game/model/Summon';

export class EntitySummonStateCommand extends CommandImpl {
  id: string = 'entity.summonState';
  requiredParameters: number = 3;

  validState(entity: Entity | undefined, state: BASE_TYPE): boolean {
    return (
      (entity instanceof MonsterEntity || entity instanceof Summon) &&
      gameManager.monsterManager.canSetSummonState(entity, state as SummonState)
    );
  }

  validParameters(figureId: string | number, entityId: string | number, state: string): boolean {
    return this.validState(findEntity(findFigure(figureId), entityId), state);
  }

  executeWithParameters(figureId: string | number, entityId: string | number, state: SummonState) {
    const entity = findEntity(findFigure(figureId), entityId);
    if (entity instanceof MonsterEntity || entity instanceof Summon) {
      gameManager.monsterManager.setSummonState(entity, state);
    } else {
      this.executionError('entity not found');
    }
  }
}
