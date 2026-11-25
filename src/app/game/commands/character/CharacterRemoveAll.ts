import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';

export class CharacterRemoveAllCommand extends CommandImpl {
  id: string = 'character.removeAll';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return true;
  }

  executeWithParameters() {
    gameManager.characterManager.removeAllCharacters();
  }
}
