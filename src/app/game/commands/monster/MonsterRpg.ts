import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findMonster } from 'src/app/game/commands/CommandHelper';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';

export class MonsterRpgSpeedCommand extends CommandImpl {
  id: string = 'monster.rpgSpeed';
  requiredParameters: number = 2;

  validParameters(figureId: string, speed: number): boolean {
    const monster = findMonster(figureId);
    return !!monster && typeof speed === 'number' && gameManager.monsterManager.canSetRpgSpeed(monster, speed);
  }

  executeWithParameters(figureId: string, speed: number) {
    const monster = findMonster(figureId);
    if (monster) {
      gameManager.monsterManager.setRpgSpeed(monster, speed);
    } else {
      this.executionError('monster not found');
    }
  }
}

export class MonsterRpgActionCommand extends CommandImpl {
  id: string = 'monster.rpgAction';
  requiredParameters: number = 2;

  entities(monster: Monster): MonsterEntity[] | undefined {
    const numbers = this.parameters.slice(2);
    if (!numbers.length) {
      return monster.entities;
    }
    const entities = numbers.map((number) => monster.entities.find((entity) => entity.number === number));
    return entities.every((entity) => !!entity) ? (entities as MonsterEntity[]) : undefined;
  }

  validParameters(figureId: string, action: number): boolean {
    const monster = findMonster(figureId);
    const entities = monster && this.entities(monster);
    return !!monster && !!entities && typeof action === 'number' && gameManager.monsterManager.canSetRpgAction(monster, action, entities);
  }

  executeWithParameters(figureId: string, action: number) {
    const monster = findMonster(figureId);
    const entities = monster && this.entities(monster);
    if (monster && entities) {
      gameManager.monsterManager.setRpgAction(monster, action, entities);
    } else {
      this.executionError('monster not found');
    }
  }
}
