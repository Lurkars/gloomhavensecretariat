import { moveItemInArray } from '@angular/cdk/drag-drop';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';

export class CharacterBattleGoalSelectCommand extends CommandImpl {
  id: string = 'character.battleGoal.select';
  requiredParameters: number = 3;

  index(character: Character, edition: BASE_TYPE, name: BASE_TYPE): number {
    return character.battleGoals.findIndex((identifier) => identifier.edition === edition && identifier.name === name);
  }

  validParameters(number: number, edition: string, name: string): boolean {
    const character = findCharacter(number);
    return !!character && (name === '' || this.index(character, edition, name) !== -1);
  }

  executeWithParameters(number: number, edition: string, name: string) {
    const character = findCharacter(number);
    if (character) {
      if (name === '') {
        character.battleGoal = false;
      } else {
        character.battleGoal = true;
        moveItemInArray(character.battleGoals, this.index(character, edition, name), 0);
      }
    } else {
      this.executionError('character not found');
    }
  }
}
