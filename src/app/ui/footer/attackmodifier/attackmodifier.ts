import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { AttackModifier, AttackModifierType, defaultAttackModifier } from 'src/app/game/model/AttackModifier';
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
  reveal: number = 0;
  edit: boolean = false;

  AttackModifierType = AttackModifierType;
  type: AttackModifierType = Object.values(AttackModifierType)[ 0 ];

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

  toggleEdit() {
    this.edit = !this.edit;
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
    gameManager.stateManager.after();
  }

  removeDrawnDiscards() {
    gameManager.stateManager.before();
    gameManager.attackModifierManager.removeDrawnDiscards();
    gameManager.stateManager.after();
  }

  restoreDefault(): void {
    gameManager.stateManager.before();
    gameManager.game.attackModifiers = defaultAttackModifier;
    gameManager.attackModifierManager.shuffleModifiers();
    gameManager.stateManager.after();
  }

  hasDrawnDiscards(): boolean {
    return gameManager.game.attackModifiers.some(
      (attackModifier: AttackModifier, index: number) =>
        index <= gameManager.game.attackModifier &&
        (attackModifier.type == AttackModifierType.bless ||
          attackModifier.type == AttackModifierType.curse)
    );
  }

  dropUpcoming(event: CdkDragDrop<AttackModifier[]>) {
    gameManager.stateManager.before();
    if (event.container == event.previousContainer) {
      const offset = gameManager.game.attackModifier + 1;
      moveItemInArray(gameManager.game.attackModifiers, event.previousIndex + offset, event.currentIndex + offset);
    } else {
      const offset = gameManager.game.attackModifier;
      moveItemInArray(gameManager.game.attackModifiers, offset - event.previousIndex, event.currentIndex + offset);
      gameManager.game.attackModifier = gameManager.game.attackModifier - 1;
    }
    gameManager.stateManager.after();
  }

  dropDisgarded(event: CdkDragDrop<AttackModifier[]>) {
    gameManager.stateManager.before();
    if (event.container == event.previousContainer) {
      moveItemInArray(gameManager.game.attackModifiers, gameManager.game.attackModifier - event.previousIndex, gameManager.game.attackModifier - event.currentIndex);
    } else {
      gameManager.game.attackModifier = gameManager.game.attackModifier + 1;
      const offset = gameManager.game.attackModifier;
      moveItemInArray(gameManager.game.attackModifiers, event.previousIndex + offset, offset - event.currentIndex);
      gameManager.game.attackModifiers[ offset - event.currentIndex ].revealed = true;
    }
    gameManager.stateManager.after();
  }

  remove(index: number) {
    gameManager.stateManager.before();
    gameManager.game.attackModifiers.splice(index + gameManager.game.attackModifier + 1, 1);
    gameManager.stateManager.after();
  }

  newFirst(type: AttackModifierType) {
    gameManager.stateManager.before();
    gameManager.game.attackModifiers.splice(gameManager.game.attackModifier + 1, 0, new AttackModifier(type, [], true));
    gameManager.stateManager.after();
  }

  newShuffle(type: AttackModifierType) {
    gameManager.stateManager.before();
    gameManager.game.attackModifiers.splice(gameManager.game.attackModifier + 1 + Math.random() * (gameManager.game.attackModifiers.length - gameManager.game.attackModifier), 0, new AttackModifier(type));
    gameManager.stateManager.after();
  }

  onChange(attackModifier: AttackModifier, revealed: boolean) {
    attackModifier.revealed = revealed;
  }

  changeType(prev: boolean = false) {
    let index = Object.values(AttackModifierType).indexOf(this.type) + (prev ? -1 : 1);
    if (index < 0) {
      index = Object.values(AttackModifierType).length - 1;
    } else if (index >= Object.values(AttackModifierType).length) {
      index = 0;
    }

    this.type = Object.values(AttackModifierType)[ index ];
  }

  override close(): void {
    super.close();
    this.reveal = 0;
    gameManager.game.attackModifiers.forEach((am: AttackModifier) => am.revealed = false);
    this.edit = false;
  }

}

