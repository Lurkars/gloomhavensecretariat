import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntity, findFigure } from 'src/app/game/commands/CommandHelper';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';

export class EntityNumberCommand extends CommandImpl {
  id: string = 'entity.number';
  requiredParameters: number = 3;

  validParameters(figureId: string | number, entityId: string | number, number: number): boolean {
    const figure = findFigure(figureId);
    const entity = findEntity(figure, entityId);
    if (typeof number !== 'number') {
      return false;
    }
    if (figure instanceof Monster && entity instanceof MonsterEntity) {
      return number === 0 || (number > 0 && number <= gameManager.monsterManager.monsterStandeeMax(figure));
    } else if (figure instanceof ObjectiveContainer && entity instanceof ObjectiveEntity) {
      return number > 0 && number <= 12 && !figure.entities.some((other) => other !== entity && other.number === number);
    }
    return false;
  }

  newNumber(figure: Monster, number: number): number {
    return number === 0 ? gameManager.monsterManager.monsterRandomStandee(figure) : number;
  }

  executeWithParameters(figureId: string | number, entityId: string | number, number: number) {
    const figure = findFigure(figureId);
    const entity = findEntity(figure, entityId);
    if (figure instanceof Monster && entity instanceof MonsterEntity) {
      const newNumber = this.newNumber(figure, number);
      const existing = gameManager.monsterManager.monsterStandeeUsed(figure, newNumber);
      if (existing && existing !== entity) {
        let otherNumber = -1;
        while (gameManager.monsterManager.monsterStandeeUsed(figure, otherNumber)) {
          otherNumber -= 1;
        }
        existing.number = otherNumber;
      }
      if (entity.number < 0) {
        entity.revealed = false;
      }
      entity.number = newNumber;
    } else if (entity instanceof ObjectiveEntity) {
      entity.number = number;
    } else {
      this.executionError('entity not found');
    }
  }
}
