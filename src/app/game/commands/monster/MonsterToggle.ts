import { CommandImpl } from 'src/app/game/commands/Command';
import { findMonster } from 'src/app/game/commands/CommandHelper';
import { Monster } from 'src/app/game/model/Monster';

abstract class MonsterFlagCommandImpl extends CommandImpl {
  requiredParameters: number = 2;

  abstract set(monster: Monster, value: boolean): void;

  validParameters(figureId: string, value: boolean): boolean {
    return !!findMonster(figureId) && typeof value === 'boolean';
  }

  executeWithParameters(figureId: string, value: boolean) {
    const monster = findMonster(figureId);
    if (monster) {
      this.set(monster, value);
    } else {
      this.executionError('monster not found');
    }
  }
}

export class MonsterAllyCommand extends MonsterFlagCommandImpl {
  id: string = 'monster.ally';

  set(monster: Monster, value: boolean) {
    monster.isAlly = value;
  }
}

export class MonsterAlliedCommand extends MonsterFlagCommandImpl {
  id: string = 'monster.allied';

  set(monster: Monster, value: boolean) {
    monster.isAllied = value;
  }
}

export class MonsterDormantCommand extends MonsterFlagCommandImpl {
  id: string = 'monster.dormant';

  set(monster: Monster, value: boolean) {
    monster.entities.forEach((entity) => (entity.dormant = value));
  }
}
