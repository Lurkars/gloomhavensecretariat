import { Dialog } from '@angular/cdk/dialog';
import { Component, Input, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
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
export class MonsterAbilityCardComponent implements OnInit {

  @Input() monster!: Monster;
  @Input() index: number = -1;

  ability: Ability | undefined = undefined;
  secondAbility: Ability | undefined = undefined;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  flipped: boolean = false;
  hasBottomActions: boolean = false;
  drawnAbilities: number = 0;

  constructor(private dialog: Dialog, private ghsManager: GhsManager) {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
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

    if (!this.ability) {
      return false;
    }

    if (gameManager.hasBottomAbility(this.ability)) {
      // Manifestation of Corruption mechanic?!
      this.ability = gameManager.monsterManager.getAbility(this.monster, true);
      this.secondAbility = gameManager.monsterManager.getAbility(this.monster);
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

  openAbility(event: any): void {
    if (settingsManager.settings.abilities) {
      if (this.flipped) {
        this.dialog.open(AbilityDialogComponent, {
          panelClass: ['fullscreen-panel'],
          disableClose: true,
          data: { monster: this.monster, interactive: settingsManager.settings.interactiveAbilities }
        });
      } else {
        this.openAbilities(event);
      }
    }
  }

}