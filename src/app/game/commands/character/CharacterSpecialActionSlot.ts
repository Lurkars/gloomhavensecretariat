import { gameManager } from 'src/app/game/businesslogic/GameManager';
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

  current(character: Character, specialAction: CharacterSpecialAction): number {
    return (specialAction.slots || []).length - character.tags.filter((tag) => tag === specialAction.name).length;
  }

  validParameters(number: number, name: string, index: number, force: boolean = false): boolean {
    const character = findCharacter(number);
    const specialAction = this.specialAction(character, name);
    if (!character || !specialAction || !specialAction.slots || typeof index !== 'number' || index < 0) {
      return false;
    }
    const current = this.current(character, specialAction);
    return (
      index <= specialAction.slots.length &&
      (((current !== index || index === specialAction.slots.length) && specialAction.slotTrigger === 'manual') || force)
    );
  }

  executeWithParameters(number: number, name: string, index: number, force: boolean = false) {
    const character = findCharacter(number);
    const specialAction = this.specialAction(character, name);
    if (character && specialAction) {
      const current = this.current(character, specialAction);
      const revert = index < current;
      for (let i = 0; i < Math.max(1, Math.abs(index - current)); i++) {
        gameManager.specialActionsManager.triggerSlot(
          character,
          force ? specialAction.slotTrigger : 'manual',
          specialAction.name,
          revert,
          force
        );
      }
    } else {
      this.executionError('character or special action not found');
    }
  }
}
