import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { CharacterSpecialAction } from 'src/app/game/model/data/CharacterStat';

export class CharacterSpecialActionSlotCommand extends CommandImpl {
  id: string = 'character.specialAction.slot';
  requiredParameters: number = 3;

  specialAction(character: Character | undefined, name: BASE_TYPE): CharacterSpecialAction | undefined {
    return (
      character &&
      character.specialActions &&
      character.specialActions.find((specialAction) => specialAction.name === name && !!specialAction.slots)
    );
  }

  validParameters(number: number, name: string, index: number, force: boolean = false): boolean {
    const character = findCharacter(number);
    const specialAction = this.specialAction(character, name);
    return (
      !!character &&
      !!specialAction &&
      typeof index === 'number' &&
      gameManager.specialActionsManager.slotChangeable(character, specialAction, index, force)
    );
  }

  executeWithParameters(number: number, name: string, index: number, force: boolean = false) {
    const character = findCharacter(number);
    const specialAction = this.specialAction(character, name);
    if (character && specialAction) {
      gameManager.specialActionsManager.setSlot(character, specialAction, index, force);
    } else {
      this.executionError('character or special action not found');
    }
  }
}
