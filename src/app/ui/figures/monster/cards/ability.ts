import { Component, Input } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { Ability } from 'src/app/game/model/Ability';
import { PopupComponent } from 'src/app/ui/popup/popup';
import { ghsUnit, ghsUnitUnit } from 'src/app/ui/helper/Static';

@Component({
  selector: 'ghs-monster-ability',
  templateUrl: './ability.html',
  styleUrls: [ './ability.scss', '../../../popup/popup.scss' ]
})
export class AbilityComponent extends PopupComponent {

  @Input() monster!: Monster;
  @Input() index: number = -1;
  reveal: number = 0;

  ability: Ability | undefined = undefined;
  gameManager: GameManager = gameManager;
  GameState = GameState;

  flipped(): boolean {
    if (this.index == -1) {
      this.ability = gameManager.monsterManager.getAbility(this.monster);
    } else {
      this.ability = gameManager.abilities(this.monster.deck, this.monster.edition)[ this.index ];
    }
    return gameManager.working && gameManager.game.state == GameState.draw || !gameManager.working && (gameManager.game.state == GameState.next && this.ability != undefined);
  }

  upcomingCards(): Ability[] {
    return this.monster.abilities.filter((value: number, index: number) => index > this.monster.ability).map((value: number) => gameManager.abilities(this.monster.deck, this.monster.edition)[ value ]);
  }

  disgardedCards(): Ability[] {
    return this.monster.abilities.filter((value: number, index: number) => index <= this.monster.ability).map((value: number) => gameManager.abilities(this.monster.deck, this.monster.edition)[ value ]);
  }

  abilityIndex(ability: Ability) {
    return gameManager.abilities(this.monster.deck, this.monster.edition).indexOf(ability);
  }

  shuffle() {
    gameManager.monsterManager.shuffleAbilities(this.monster);
  }

  hexSize(): number {
    let size = ghsUnit();
    if (ghsUnitUnit() == 'vw') {
      size = window.innerWidth / 100 * ghsUnit();
    }
    return size;
  }
}