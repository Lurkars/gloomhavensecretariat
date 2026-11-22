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
    if (!findCharacter(number) || typeof trial !== 'number') {
      return false;
    }
    const cardId = this.cardId(trial);
    return gameManager.trialsManager.trialCardExists(cardId) && !gameManager.trialsManager.trialAssigned(cardId);
  }

  executeWithParameters(number: number, trial: number) {
    const character = findCharacter(number);
    if (character && gameManager.trialsManager.trialsEditionData()) {
      gameManager.trialsManager.setTrial(character, this.cardId(trial));
    } else {
      this.executionError('character or trials not found');
    }
  }
}
