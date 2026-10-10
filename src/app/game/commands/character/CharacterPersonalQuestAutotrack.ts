import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterPersonalQuestAutotrackCommand extends CommandImpl {
  id: string = 'character.personalQuest.autotrack';
  requiredParameters: number = 2;

  validParameters(number: number, autotrack: boolean): boolean {
    return !!findCharacter(number) && typeof autotrack === 'boolean';
  }

  executeWithParameters(number: number, autotrack: boolean) {
    const character = findCharacter(number);
    if (character) {
      character.progress.personalQuestAutotrack = autotrack;
    } else {
      this.executionError('character not found');
    }
  }
}
