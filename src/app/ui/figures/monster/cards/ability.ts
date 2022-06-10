import { Component, Input } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { Ability } from 'src/app/game/model/Ability';
import { PopupComponent } from 'src/app/ui/popup/popup';

@Component({
  selector: 'ghs-monster-ability',
  templateUrl: './ability.html',
  styleUrls: [ './ability.scss', '../../../popup/popup.scss' ]
})
export class AbilityComponent extends PopupComponent {

  @Input() monster!: Monster;
  @Input() index: number = -1;
  reveal: boolean = false;

  ability: Ability | undefined = undefined;
  gameManager: GameManager = gameManager;
  GameState = GameState;

  flipped(): boolean {
    if (this.index == -1) {
      this.ability = this.monster.ability;
    } else {
      this.ability = gameManager.abilities(this.monster.deck, this.monster.edition)[ this.index ];
    }
    return gameManager.working && gameManager.game.state == GameState.draw || !gameManager.working && (gameManager.game.state == GameState.next && this.ability != undefined);
  }

  override close(): void {
    super.close();
    this.reveal = false;
  }

  upcomingCards(): Ability[] {
    return gameManager.abilities(this.monster.deck, this.monster.edition).filter((value, index: number) => this.monster.availableAbilities.indexOf(index) != -1);
  }

  disgardedCards(): Ability[] {
    return gameManager.abilities(this.monster.deck, this.monster.edition).filter((value, index: number) => this.monster.discardedAbilities.indexOf(index) != -1);
  }

  shuffle() {
    gameManager.monsterManager.shuffleAbilities(this.monster);
  }
}