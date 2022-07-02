import { Component, Input } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { Ability } from 'src/app/game/model/Ability';
import { PopupComponent } from 'src/app/ui/popup/popup';
import { ghsUnit, ghsUnitUnit } from 'src/app/ui/helper/Static';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';

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
      this.ability = gameManager.abilities(this.monster)[ this.index ];
    }
    return gameManager.working && gameManager.game.state == GameState.draw || !gameManager.working && gameManager.game.state == GameState.next && this.ability != undefined && this.monster.entities.filter((monsterEntity: MonsterEntity) => !monsterEntity.dead).length > 0;
  }

  upcomingCards(): Ability[] {
    return this.monster.abilities.filter((value: number, index: number) => index > this.monster.ability).map((value: number) => gameManager.abilities(this.monster)[ value ]);
  }

  disgardedCards(): Ability[] {
    return this.monster.abilities.filter((value: number, index: number) => index <= this.monster.ability).map((value: number) => gameManager.abilities(this.monster)[ value ]).reverse();
  }

  abilityIndex(ability: Ability) {
    return gameManager.abilities(this.monster).indexOf(ability);
  }

  shuffle() {
    gameManager.stateManager.before();
    gameManager.monsterManager.shuffleAbilities(this.monster);
    gameManager.stateManager.after();
  }

  override close(): void {
    super.close();
    this.reveal = 0;
  }

  toggleDrawExtra() {
    if (this.monster.drawExtra) {
      gameManager.stateManager.before();
      this.monster.drawExtra = false;
      gameManager.monsterManager.applySameDeck(this.monster);
      gameManager.stateManager.after();
    } else if (gameManager.monsterManager.applySameDeck(this.monster)) {
      gameManager.stateManager.before();
      this.monster.drawExtra = true;
      gameManager.monsterManager.drawExtra(this.monster);
      gameManager.stateManager.after();
    }
  }

  abilityLabel(ability: Ability): string {
    let label = 'data.monster.' + this.monster.name;
    if (ability?.name) {
      label = 'data.ability.' + ability.name;
    } else if (this.monster.deck != this.monster.name) {
      label = 'data.deck.' + this.monster.deck;
      if (label.split('.')[ label.split('.').length - 1 ] === settingsManager.getLabel(label) && this.monster.deck) {
        label = 'data.monster.' + this.monster.deck;
      }
    }

    return settingsManager.getLabel(label);
  }
}