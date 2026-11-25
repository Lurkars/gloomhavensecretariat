import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterTrialCommand extends CommandImpl {
  id: string = 'character.trial';
  requiredParameters: number = 2;

  cardId(trial: number): number {
    return settingsManager.settings.fhSecondEdition ? gameManager.trialsManager.cardIdSecondPrinting(trial) : trial;
  }

  validParameters(number: number, trial: number): boolean {
    const character = findCharacter(number);
    return !!character && typeof trial === 'number' && gameManager.trialsManager.canSetTrial(character, this.cardId(trial));
  }

  executeWithParameters(number: number, trial: number) {
    const character = findCharacter(number);
    if (character) {
      gameManager.trialsManager.setTrial(character, this.cardId(trial));
    } else {
      this.executionError('character or trials not found');
    }
  }
}
