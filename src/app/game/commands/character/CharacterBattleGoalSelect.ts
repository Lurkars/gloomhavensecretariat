import { gameManager } from 'src/app/game/businesslogic/Managers';
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
    return (
      !!character &&
      typeof name === 'string' &&
      (name === '' || this.index(character, edition, name) !== -1) &&
      gameManager.battleGoalManager.canSelectBattleGoal(character, name === '' ? -1 : this.index(character, edition, name))
    );
  }

  executeWithParameters(number: number, edition: string, name: string) {
    const character = findCharacter(number);
    if (character) {
      gameManager.battleGoalManager.selectBattleGoal(character, name === '' ? -1 : this.index(character, edition, name));
    } else {
      this.executionError('character not found');
    }
  }
}
