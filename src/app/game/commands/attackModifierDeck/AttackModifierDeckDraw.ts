import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { Character } from 'src/app/game/model/Character';
import { AttackModifierDeck } from 'src/app/game/model/data/AttackModifier';
import { GameState } from 'src/app/game/model/Game';

export class AttackModifierDeckDrawCommand extends CommandImpl {
  id: string = 'attackModifierDeck.draw';
  requiredParameters: number = 1;

  validParameters(id: string | number, state: string): boolean {
    return (
      (id == 'm' ||
        id == 'a' ||
        gameManager.game.figures.find((figure) => figure instanceof Character && figure.number == id) != undefined ||
        false) &&
      (!state || state == 'advantage' || state == 'disadvantage')
    );
  }

  executeWithParameters(id: string | number, state: string) {
    if (gameManager.game.state != GameState.next) {
      this.executionError('invalid game state');
    }
    let deck: AttackModifierDeck | undefined = undefined;
    switch (id) {
      case 'm':
        deck = gameManager.game.monsterAttackModifierDeck;
        break;
      case 'a':
        deck = gameManager.game.allyAttackModifierDeck;
        break;
      default:
        const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.number == id) as Character;
        if (character) {
          deck = character.attackModifierDeck;
        }
    }
    if (deck) {
      gameManager.attackModifierManager.drawModifier(deck, state == 'advantage' || state == 'disadvantage' ? state : undefined);
    } else {
      this.executionError('deck not found');
    }
  }
}
