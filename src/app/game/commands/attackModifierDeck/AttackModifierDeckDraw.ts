import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { AttackModifierDeck } from 'src/app/game/model/data/AttackModifier';
import { GameState } from 'src/app/game/model/Game';

export class AttackModifierDeckDrawCommand extends CommandImpl {
  id: string = 'attackModifierDeck.draw';
  requiredParameters: number = 2;

  validParameters(id: string | number, seed: number, state: string): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return (
      (id === 'm' ||
        id === 'a' ||
        gameManager.game.figures.find((figure) => figure instanceof Character && figure.number === id) !== undefined ||
        false) &&
      (!state || state === 'advantage' || state === 'disadvantage')
    );
  }

  executeWithParameters(id: string | number, seed: number, state: string) {
    gameManager.game.seed = seed;
    if (gameManager.game.state !== GameState.next) {
      this.executionError('invalid game state');
    }
    let deck: AttackModifierDeck | undefined = undefined;
    let character: Character | undefined = undefined;
    switch (id) {
      case 'm':
        deck = gameManager.game.monsterAttackModifierDeck;
        break;
      case 'a':
        deck = gameManager.game.allyAttackModifierDeck;
        break;
      default:
        character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.number === id) as Character;
        if (character) {
          deck = character.attackModifierDeck;
        }
    }
    if (deck) {
      gameManager.attackModifierManager.drawModifier(
        deck,
        state === 'advantage' || state === 'disadvantage' ? state : undefined,
        character
      );
    } else {
      this.executionError('deck not found');
    }
  }
}
