import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { Identifier } from 'src/app/game/model/data/Identifier';

export class CharacterTrialCommand extends CommandImpl {
  id: string = 'character.trial';
  requiredParameters: number = 2;

  editionData(): EditionData | undefined {
    return gameManager.editionData.find(
      (editionData) => editionData.edition === gameManager.currentEdition() && editionData.trials && editionData.trials.length
    );
  }

  cardId(trial: number): number {
    return settingsManager.settings.fhSecondEdition ? gameManager.trialsManager.cardIdSecondPrinting(trial) : trial;
  }

  validParameters(number: number, trial: number): boolean {
    const character = findCharacter(number);
    const editionData = this.editionData();
    if (!character || !editionData || typeof trial !== 'number') {
      return false;
    }
    const cardId = this.cardId(trial);
    return (
      editionData.trials.some((trialCard) => trialCard.cardId === cardId && trialCard.edition === gameManager.currentEdition()) &&
      !gameManager.game.figures.some(
        (figure) =>
          figure instanceof Character &&
          figure.progress.trial &&
          figure.progress.trial.edition === gameManager.currentEdition() &&
          figure.progress.trial.name === '' + cardId
      )
    );
  }

  executeWithParameters(number: number, trial: number) {
    const character = findCharacter(number);
    const editionData = this.editionData();
    if (character && editionData) {
      character.progress.trial = new Identifier(this.cardId(trial), gameManager.currentEdition());
      const currentTrialIndex = Math.max(
        ...gameManager.game.figures
          .filter((figure) => figure instanceof Character)
          .map((figure) =>
            editionData.trials.find(
              (trialCard) =>
                figure.progress.trial &&
                trialCard.cardId === +figure.progress.trial.name &&
                trialCard.edition === figure.progress.trial.edition
            )
          )
          .map((trialCard) => (trialCard ? editionData.trials.indexOf(trialCard) : -1))
      );
      if (!gameManager.game.party.trials || gameManager.game.party.trials !== currentTrialIndex) {
        gameManager.game.party.trials = currentTrialIndex;
      }
    } else {
      this.executionError('character or trials not found');
    }
  }
}
