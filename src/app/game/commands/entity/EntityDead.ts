import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntities, findFigure, removeDeadEntity } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { ConditionType } from 'src/app/game/model/data/Condition';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { Summon } from 'src/app/game/model/Summon';

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
      entities.forEach((entity) => {
        if (entity instanceof MonsterEntity || entity instanceof Summon || entity instanceof ObjectiveEntity) {
          entity.dead = true;
        }
      });

      entities.forEach((entity) => {
        if (
          gameManager.game.state === GameState.draw ||
          entity.entityConditions.every(
            (entityCondition) => !entityCondition.types.includes(ConditionType.turn) && !entityCondition.types.includes(ConditionType.apply)
          )
        ) {
          removeDeadEntity(figure, entity);
        }
      });

      if (
        (figure instanceof Monster || figure instanceof ObjectiveContainer) &&
        figure.active &&
        figure.entities.every((entity) => !gameManager.entityManager.isAlive(entity))
      ) {
        gameManager.roundManager.toggleFigure(figure);
      }
    } else {
      this.executionError('entity not found');
    }
  }
}
