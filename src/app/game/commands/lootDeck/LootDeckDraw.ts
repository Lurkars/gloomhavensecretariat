import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';

export class LootDeckDrawCommand extends CommandImpl {
  id: string = 'lootDeck.draw';
  requiredParameters: number = 1;

  validParameters(seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return true;
  }

  executeWithParameters(seed: number) {
    gameManager.game.seed = seed;
    if (gameManager.game.state !== GameState.next) {
      this.executionError('invalid game state');
    }
    const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.active) as Character;
    gameManager.lootManager.drawCard(gameManager.game.lootDeck, character);
  }
}
