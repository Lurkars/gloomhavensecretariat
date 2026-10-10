import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findMonster, validSeed } from 'src/app/game/commands/CommandHelper';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { GameState } from 'src/app/game/model/Game';
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
        number = 1;
        while (gameManager.monsterManager.monsterStandeeUsed(monster, number)) {
          number += 1;
        }
      }

      const dead = monster.entities.find((monsterEntity) => monsterEntity.number === number);
      if (dead) {
        gameManager.monsterManager.removeMonsterEntity(monster, dead);
      }

      const entity = gameManager.monsterManager.addMonsterEntity(
        monster,
        number,
        monster.bb && monster.tags.includes('bb-elite') ? MonsterType.elite : type,
        summon
      );

      if (!entity) {
        this.executionError('could not add standee');
      } else if (gameManager.game.state === GameState.next) {
        monster.active = !gameManager.game.figures.some((figure) => figure.active);
        if (monster.active) {
          gameManager.sortFigures(monster);
          entity.active = true;
        }
      }
    } else {
      this.executionError('monster not found');
    }
  }
}
