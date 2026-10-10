import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { EntityValueFunction } from 'src/app/game/model/Entity';

export class CharacterPersonalQuestProgressCommand extends CommandImpl {
  id: string = 'character.personalQuest.progress';
  requiredParameters: number = 3;

  validParameters(number: number, index: number, value: number): boolean {
    return !!findCharacter(number) && typeof index === 'number' && index >= 0 && typeof value === 'number' && value >= 0;
  }

  executeWithParameters(number: number, index: number, value: number) {
    const character = findCharacter(number);
    if (character) {
      for (let i = 0; i <= index; i++) {
        if (!character.progress.personalQuestProgress[i]) {
          character.progress.personalQuestProgress[i] = 0;
        }
      }
      character.progress.personalQuestProgress[index] = value;

      const personalQuest = gameManager.personalQuestManager.personalQuestByCard(
        gameManager.currentEdition(),
        character.progress.personalQuest
      );
      if (personalQuest) {
        personalQuest.requirements.forEach((requirement, i) => {
          if (
            requirement.requires &&
            requirement.requires.some(
              (j) => character.progress.personalQuestProgress[j - 1] < EntityValueFunction(personalQuest.requirements[j - 1].counter)
            )
          ) {
            character.progress.personalQuestProgress[i] = 0;
          }
        });
      }
    } else {
      this.executionError('character not found');
    }
  }
}
