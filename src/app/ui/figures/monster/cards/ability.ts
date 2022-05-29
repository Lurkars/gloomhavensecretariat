import { Component, Input } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { ActionType } from 'src/app/game/model/Action';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterAbility } from 'src/app/game/model/MonsterAbility';

@Component({
  selector: 'ghs-monster-ability',
  templateUrl: './ability.html',
  styleUrls: [ './ability.scss' ]
})
export class MonsterAbilityComponent {

  @Input() monster!: Monster;
  @Input() index: number = -1;
  reveal: number = 0;

  ability: MonsterAbility | undefined = undefined;
  gameManager: GameManager = gameManager;
  GameState = GameState;

  flipped(): boolean {
    if (this.index == -1) {
      this.ability = this.monster.ability;
    } else {
      this.ability = this.monster.abilities[ this.index ];
    }
    return gameManager.working && gameManager.game.state == GameState.draw || !gameManager.working && (gameManager.game.state == GameState.next && this.ability != undefined || (this.index > -1 && this.reveal > 1));
  }

  toggleReveal() {
    if (this.index > -1) {
      if (this.reveal < 2) {
        this.reveal += 1;
      } else {
        this.reveal = 0;
      }
    }
  }
}