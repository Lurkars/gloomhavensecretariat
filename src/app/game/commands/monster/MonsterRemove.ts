import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findMonster } from 'src/app/game/commands/CommandHelper';
import { Monster } from 'src/app/game/model/Monster';

export class MonsterRemoveCommand extends CommandImpl {
  id: string = 'monster.remove';
  requiredParameters: number = 1;

  validParameters(figureId: string): boolean {
    return !!findMonster(figureId);
  }

  executeWithParameters(figureId: string) {
    const monster = findMonster(figureId);
    if (monster) {
      gameManager.monsterManager.removeMonster(monster);
    } else {
      this.executionError('monster not found');
    }
  }
}

export class MonsterRemoveAllCommand extends CommandImpl {
  id: string = 'monster.removeAll';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return true;
  }

  executeWithParameters(unused: boolean = false) {
    gameManager.game.figures = gameManager.game.figures.filter(
      (figure) =>
        !(figure instanceof Monster) ||
        (unused && figure.entities.some((monsterEntity) => gameManager.entityManager.isAlive(monsterEntity)))
    );
  }
}
