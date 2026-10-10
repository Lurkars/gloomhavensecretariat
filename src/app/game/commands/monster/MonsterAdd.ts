import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { MonsterData } from 'src/app/game/model/data/MonsterData';

export class MonsterAddCommand extends CommandImpl {
  id: string = 'monster.add';
  requiredParameters: number = 3;

  monsterData(edition: BASE_TYPE, name: BASE_TYPE): MonsterData | undefined {
    return typeof edition === 'string'
      ? gameManager.monstersData(edition).find((monsterData) => monsterData.name === name && monsterData.edition === edition)
      : undefined;
  }

  validParameters(edition: string, name: string, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return !!this.monsterData(edition, name);
  }

  executeWithParameters(edition: string, name: string, seed: number) {
    gameManager.game.seed = seed;
    const monsterData = this.monsterData(edition, name);
    if (monsterData) {
      const monster = gameManager.monsterManager.addMonster(monsterData, gameManager.game.level);
      if (!monster.tags.includes('addedManually')) {
        monster.tags.push('addedManually');
      }
    } else {
      this.executionError('monster not found');
    }
  }
}
