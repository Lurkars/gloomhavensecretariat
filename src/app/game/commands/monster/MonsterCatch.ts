import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntity, findMonster } from 'src/app/game/commands/CommandHelper';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';

export class MonsterCatchCommand extends CommandImpl {
  id: string = 'monster.catch';
  requiredParameters: number = 2;

  validParameters(figureId: string, number: number, force: boolean = false): boolean {
    const monster = findMonster(figureId);
    return (
      gameManager.buildingsManager.petsEnabled &&
      !!monster &&
      !!monster.pet &&
      findEntity(monster, number) instanceof MonsterEntity &&
      (force || !!gameManager.monsterManager.petCaptureCharacter())
    );
  }

  executeWithParameters(figureId: string, number: number, force: boolean = false) {
    const monster = findMonster(figureId);
    const entity = findEntity(monster, number);
    if (monster && entity instanceof MonsterEntity) {
      gameManager.monsterManager.catchMonster(monster, entity, force);
      gameManager.monsterManager.removeMonsterEntity(monster, entity);
    } else {
      this.executionError('monster standee not found');
    }
  }
}
