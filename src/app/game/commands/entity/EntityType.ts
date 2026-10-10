import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure } from 'src/app/game/commands/CommandHelper';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';

export class EntityTypeCommand extends CommandImpl {
  id: string = 'entity.type';
  requiredParameters: number = 3;

  monsterEntities(figureId: BASE_TYPE, entityId: BASE_TYPE): MonsterEntity[] {
    return findEntities(findFigure(figureId), entityId)
      .filter((entity) => entity instanceof MonsterEntity)
      .filter((entity) => entity.type === MonsterType.normal || entity.type === MonsterType.elite);
  }

  validParameters(figureId: string | number, entityId: string | number, type: string): boolean {
    return (
      (type === MonsterType.normal || type === MonsterType.elite) &&
      findFigure(figureId) instanceof Monster &&
      this.monsterEntities(figureId, entityId).length > 0
    );
  }

  executeWithParameters(figureId: string | number, entityId: string | number, type: MonsterType) {
    const monster = findFigure(figureId);
    if (monster instanceof Monster) {
      this.monsterEntities(figureId, entityId)
        .filter((entity) => entity.type !== type && gameManager.entityManager.isAlive(entity))
        .forEach((entity) => gameManager.monsterManager.changeType(entity, monster));
    } else {
      this.executionError('monster not found');
    }
  }
}
