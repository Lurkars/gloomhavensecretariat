import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { EnhancementAction } from 'src/app/game/model/data/Enhancement';

export class CharacterEnhancementAddCommand extends CommandImpl {
  id: string = 'character.enhancement.add';
  requiredParameters: number = 5;

  validParameters(
    number: number,
    cardId: number,
    actionIndex: string,
    enhancementIndex: number,
    action: string,
    costs: number = 0
  ): boolean {
    const character = findCharacter(number);
    return (
      !!character &&
      typeof cardId === 'number' &&
      typeof actionIndex === 'string' &&
      !!actionIndex &&
      typeof enhancementIndex === 'number' &&
      typeof action === 'string' &&
      !!action &&
      typeof costs === 'number' &&
      costs >= 0 &&
      character.progress.gold >= costs &&
      !(character.progress.enhancements || []).some(
        (enhancement) => enhancement.cardId === cardId && enhancement.actionIndex === actionIndex && enhancement.index === enhancementIndex
      )
    );
  }

  executeWithParameters(number: number, cardId: number, actionIndex: string, enhancementIndex: number, action: string, costs: number = 0) {
    const character = findCharacter(number);
    if (character) {
      gameManager.enhancementsManager.addEnhancement(character, cardId, actionIndex, enhancementIndex, action as EnhancementAction, costs);
    } else {
      this.executionError('character not found');
    }
  }
}
