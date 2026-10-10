import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { Enhancement } from 'src/app/game/model/data/Enhancement';

export class CharacterEnhancementRemoveCommand extends CommandImpl {
  id: string = 'character.enhancement.remove';
  requiredParameters: number = 4;

  enhancement(character: Character | undefined, cardId: BASE_TYPE, actionIndex: BASE_TYPE, index: BASE_TYPE): Enhancement | undefined {
    return (
      character &&
      (character.progress.enhancements || []).find(
        (enhancement) =>
          enhancement.cardId === cardId && enhancement.actionIndex === actionIndex && enhancement.index === index && !enhancement.inherited
      )
    );
  }

  validParameters(number: number, cardId: number, actionIndex: string, index: number): boolean {
    return !!this.enhancement(findCharacter(number), cardId, actionIndex, index);
  }

  executeWithParameters(number: number, cardId: number, actionIndex: string, index: number) {
    const character = findCharacter(number);
    const enhancement = this.enhancement(character, cardId, actionIndex, index);
    if (character && enhancement) {
      character.progress.enhancements = character.progress.enhancements.filter((other) => other !== enhancement);
    } else {
      this.executionError('enhancement not found');
    }
  }
}
