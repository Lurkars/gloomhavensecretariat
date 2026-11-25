import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, findEntity, findFigure } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { Summon } from 'src/app/game/model/Summon';

export class SummonTrapCommand extends CommandImpl {
  id: string = 'summon.trap';
  requiredParameters: number = 4;

  trap(character: Character | undefined, uuid: BASE_TYPE): Summon | undefined {
    return character && character.summons.find((summon) => summon.uuid === uuid && summon.trap);
  }

  validParameters(number: number, uuid: string, targetFigureId: string | number, targetEntityId: string | number): boolean {
    const character = findCharacter(number);
    const trap = this.trap(character, uuid);
    const targetFigure = findFigure(targetFigureId);
    const target = findEntity(targetFigure, targetEntityId);
    return (
      !!character && !!trap && !!targetFigure && !!target && gameManager.summonManager.canApplyTrap(character, trap, target, targetFigure)
    );
  }

  executeWithParameters(number: number, uuid: string, targetFigureId: string | number, targetEntityId: string | number) {
    const character = findCharacter(number);
    const trap = this.trap(character, uuid);
    const targetFigure = findFigure(targetFigureId);
    const target = findEntity(targetFigure, targetEntityId);
    if (character && trap && targetFigure && target && gameManager.summonManager.applyTrap(character, trap, target, targetFigure)) {
      gameManager.entityManager.removeDeadEntities([{ entity: trap, figure: character }]);
    } else {
      this.executionError('trap or target not found');
    }
  }
}
