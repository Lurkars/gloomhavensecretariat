import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';

export class CharacterLongRestCommand extends CommandImpl {
  id: string = 'character.longRest';
  requiredParameters: number = 2;

  prismLongRest(character: Character): boolean {
    return character.name === 'prism' && character.tags.includes('long_rest');
  }

  validParameters(number: number, longRest: boolean): boolean {
    return !!findCharacter(number) && typeof longRest === 'boolean';
  }

  executeWithParameters(number: number, longRest: boolean) {
    const character = findCharacter(number);
    if (character) {
      if (character.longRest === longRest) {
        return;
      }
      if (!longRest) {
        character.longRest = false;
      } else {
        if (character.initiative !== 99 && !this.prismLongRest(character)) {
          character.initiative = 99;
          character.initiativeVisible = true;
        }
        character.longRest = true;
      }
      if (gameManager.game.state === GameState.next) {
        gameManager.sortFigures(character);
      }
    } else {
      this.executionError('character not found');
    }
  }
}
