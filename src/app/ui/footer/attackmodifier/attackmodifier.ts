import { Component } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { AttackModifier } from 'src/app/game/model/AttackModifier';
import { GameState } from 'src/app/game/model/Game';
import { PopupComponent } from '../../popup/popup';

@Component({
  selector: 'ghs-attackmodifier',
  templateUrl: './attackmodifier.html',
  styleUrls: [ './attackmodifier.scss', '../../popup/popup.scss' ]
})
export class AttackModifierComponent extends PopupComponent {

  gameManager: GameManager = gameManager;
  GameState = GameState;

  draw() {
    gameManager.stateManager.before();
    gameManager.attackModifierManager.drawModifier();
    gameManager.stateManager.after(1000);
  }

  click(attackModifier: AttackModifier) {
    if (!this.disgarded(attackModifier) && !this.current(attackModifier)) {
      gameManager.stateManager.before();
      gameManager.attackModifierManager.drawModifier();
      gameManager.stateManager.after(1000);
    } else {
      this.open();
    }
  }

  current(attackModifier: AttackModifier): boolean {
    return gameManager.game.attackModifiers.indexOf(attackModifier) == gameManager.game.attackModifier;
  }

  disgarded(attackModifier: AttackModifier): boolean {
    return gameManager.game.attackModifiers.indexOf(attackModifier) < gameManager.game.attackModifier;
  }


  zIndex(attackModifier: AttackModifier): number {
    if (gameManager.game.attackModifiers.indexOf(attackModifier) > gameManager.game.attackModifier) {
      return gameManager.game.attackModifiers.length - gameManager.game.attackModifiers.indexOf(attackModifier) - 1;
    } else {
      return gameManager.game.attackModifiers.length + gameManager.game.attackModifiers.indexOf(attackModifier);
    }
  }

  upcomingCards(): AttackModifier[] {
    return gameManager.game.attackModifiers.filter((AttackModifier: AttackModifier, index: number) => index > gameManager.game.attackModifier);
  }

  disgardedCards(): AttackModifier[] {
    return gameManager.game.attackModifiers.filter((AttackModifier: AttackModifier, index: number) => index <= gameManager.game.attackModifier).reverse();
  }

  shuffle(): void {
    gameManager.stateManager.before();
    gameManager.attackModifierManager.shuffleModifiers();
    this.close();
    gameManager.stateManager.after();
  }

}

