import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, validSeed } from 'src/app/game/commands/CommandHelper';

export class CharacterRetireCommand extends CommandImpl {
  id: string = 'character.retire';
  requiredParameters: number = 2;

  validParameters(number: number, seed: number, additionalPQ: string = ''): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    const character = findCharacter(number);
    return (
      !!character &&
      !character.progress.retired &&
      typeof additionalPQ === 'string' &&
      (!additionalPQ || !!gameManager.personalQuestManager.personalQuestByCard(gameManager.editionManager.currentEdition(), additionalPQ))
    );
  }

  executeWithParameters(number: number, seed: number, additionalPQ: string = '') {
    gameManager.game.seed = seed;
    const character = findCharacter(number);
    if (character) {
      if (settingsManager.settings.applyRetirement && gameManager.game.party.campaignMode) {
        const retirement = gameManager.retirementManager.retirement(character);
        if (additionalPQ) {
          gameManager.retirementManager.setAdditionalQuest(retirement, additionalPQ);
        }
        gameManager.retirementManager.retire(retirement, !!additionalPQ);
      } else {
        gameManager.retirementManager.retireCharacter(character);
      }
    } else {
      this.executionError('character not found');
    }
  }
}
