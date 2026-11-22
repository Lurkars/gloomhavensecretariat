import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findMonster, validSeed } from 'src/app/game/commands/CommandHelper';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';

export class MonsterEntityAddCommand extends CommandImpl {
  id: string = 'monster.entity.add';
  requiredParameters: number = 4;

  free(monster: Monster): boolean {
    const max = gameManager.monsterManager.monsterStandeeMax(monster);
    return [...Array(max).keys()].some((n) => !gameManager.monsterManager.monsterStandeeUsed(monster, n + 1));
  }

  validParameters(figureId: string, number: number, type: string, seed: number, summon: boolean = false): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    const monster = findMonster(figureId);
    return (
      !!monster &&
      typeof summon === 'boolean' &&
      Object.values(MonsterType).includes(type as MonsterType) &&
      typeof number === 'number' &&
      number >= -1 &&
      number <= gameManager.monsterManager.monsterStandeeMax(monster) &&
      this.free(monster) &&
      (number <= 0 || !gameManager.monsterManager.monsterStandeeUsed(monster, number))
    );
  }

  executeWithParameters(figureId: string, number: number, type: MonsterType, seed: number, summon: boolean = false) {
    gameManager.game.seed = seed;
    const monster = findMonster(figureId);
    if (monster) {
      if (number === 0) {
        number = gameManager.monsterManager.monsterRandomStandee(monster);
      } else if (number === -1) {
        number = gameManager.monsterManager.nextStandeeNumber(monster);
      }
      if (!gameManager.monsterManager.placeStandee(monster, number, type, summon)) {
        this.executionError('could not add standee');
      }
    } else {
      this.executionError('monster not found');
    }
  }
}
