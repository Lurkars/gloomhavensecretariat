import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { Character } from 'src/app/game/model/Character';

export class CharacterRemoveAllCommand extends CommandImpl {
  id: string = 'character.removeAll';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return true;
  }

  executeWithParameters() {
    gameManager.game.figures = gameManager.game.figures.filter((figure) => !(figure instanceof Character));
  }
}
