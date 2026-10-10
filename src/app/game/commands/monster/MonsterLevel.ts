import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findMonster } from 'src/app/game/commands/CommandHelper';

export class MonsterLevelCommand extends CommandImpl {
  id: string = 'monster.level';
  requiredParameters: number = 2;

  validParameters(figureId: string, level: number): boolean {
    return !!findMonster(figureId) && typeof level === 'number' && level >= 0 && level <= 7;
  }

  executeWithParameters(figureId: string, level: number) {
    const monster = findMonster(figureId);
    if (monster) {
      gameManager.monsterManager.setLevel(monster, level);
    } else {
      this.executionError('monster not found');
    }
  }
}
