import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterDonateCommand extends CommandImpl {
  id: string = 'character.donate';
  requiredParameters: number = 1;

  costs(): number {
    if (
      gameManager.fhRules(false) &&
      gameManager.game.party.buildings.some(
        (buildingModel) => buildingModel.name === 'temple' && buildingModel.level > 0 && buildingModel.state !== 'wrecked'
      )
    ) {
      return 5;
    }
    return 10;
  }

  available(): boolean {
    return (
      (!gameManager.fhRules(false) && !gameManager.editionRules('jotl')) ||
      (gameManager.fhRules(false) &&
        gameManager.game.party.buildings.some(
          (buildingModel) => buildingModel.name === 'temple' && buildingModel.level > 0 && buildingModel.state !== 'wrecked'
        ))
    );
  }

  validParameters(number: number): boolean {
    const character = findCharacter(number);
    return !!character && gameManager.game.round < 1 && this.available() && character.progress.gold >= this.costs();
  }

  executeWithParameters(number: number) {
    const character = findCharacter(number);
    if (character) {
      character.progress.donations += 1;
      character.donations += 1;
      gameManager.game.party.donations += 1;
      character.progress.gold -= this.costs();
    } else {
      this.executionError('character not found');
    }
  }
}
