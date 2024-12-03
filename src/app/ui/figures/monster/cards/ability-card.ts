import { Dialog } from '@angular/cdk/dialog';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { Ability } from 'src/app/game/model/data/Ability';
import { AbiltiesDialogComponent } from '../../ability/abilities-dialog';
import { AbilityDialogComponent } from '../../ability/ability-dialog';

@Component({
	standalone: false,
  selector: 'ghs-monster-ability-card',
  templateUrl: './ability-card.html',
  styleUrls: ['./ability-card.scss']
})
export class MonsterAbilityCardComponent implements OnInit, OnDestroy {

  @Input() monster!: Monster;
  @Input() index: number = -1;

  ability: Ability | undefined = undefined;
  secondAbility: Ability | undefined = undefined;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  flipped: boolean = false;
  hasBottomActions: boolean = false;
  drawnAbilities: number = 0;

  constructor(private dialog: Dialog) { }

  ngOnInit(): void {
    this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() });
    this.update();
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  update() {
    this.hasBottomActions = gameManager.monsterManager.hasBottomActions(this.monster);
    this.drawnAbilities = gameManager.monsterManager.drawnAbilities(this.monster);
    this.flipped = this.calcFlipped();
  }

  calcFlipped(): boolean {
    if (!settingsManager.settings.abilities || gameManager.game.state == GameState.draw) {
      return false;
    }

    if (this.index == -1) {
      this.ability = gameManager.monsterManager.getAbility(this.monster);
    } else {
      this.ability = gameManager.abilities(this.monster)[this.index];
    }

    if (!this.ability && this.hasBottomActions) {
      this.ability = gameManager.abilities(this.monster)[0];
      this.secondAbility = gameManager.abilities(this.monster)[1];
    }

    if (!this.ability) {
      return false;
    }

    if (gameManager.hasBottomAbility(this.ability)) {
      // Manifestation of Corruption mechanic?!
      this.secondAbility = gameManager.abilities(this.monster)[this.monster.abilities[this.monster.ability + (this.monster.ability < this.monster.abilities.length + 1 ? 1 : -1)]];
    }

    let flipped = !gameManager.roundManager.working && gameManager.game.state == GameState.next && gameManager.gameplayFigure(this.monster);

    let reveal = settingsManager.settings.abilityReveal || this.monster.active || this.monster.off && (gameManager.game.figures.some((figure, index, self) => figure.active && index > self.indexOf(this.monster)) || gameManager.game.figures.every((figure) => !figure.active));

    if (gameManager.game.state == GameState.next && reveal) {
      flipped = flipped || gameManager.game.state == GameState.next && this.monster.lastDraw == gameManager.game.round;
    }

    return flipped && reveal;
  }

  openAbilities(event: any): void {
    if (settingsManager.settings.abilities && (!event.srcEvent || !event.srcEvent.defaultPrevented)) {
      this.dialog.open(AbiltiesDialogComponent, {
        panelClass: ['dialog'], data: this.monster
      });
    }
  }

  openAbility(event: any, second: boolean = false): void {
    if (settingsManager.settings.abilities) {
      if (this.flipped) {
        this.dialog.open(AbilityDialogComponent, {
          panelClass: ['fullscreen-panel'],
          disableClose: true,
          data: { ability: second ? this.secondAbility : this.ability, monster: this.monster, interactive: settingsManager.settings.interactiveAbilities }
        });
      } else {
        this.openAbilities(event);
      }
    }
  }

}