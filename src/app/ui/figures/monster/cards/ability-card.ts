import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Ability } from 'src/app/game/model/data/Ability';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { AbiltiesDialogComponent } from 'src/app/ui/figures/ability/abilities-dialog';
import { AbilityComponent } from 'src/app/ui/figures/ability/ability';
import { AbilityDialogComponent } from 'src/app/ui/figures/ability/ability-dialog';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

@Component({
  imports: [NgClass, PointerInputDirective, AbilityComponent],
  selector: 'ghs-monster-ability-card',
  templateUrl: './ability-card.html',
  styleUrls: ['./ability-card.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonsterAbilityCardComponent implements OnInit {
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  @Input() monster!: Monster;
  @Input() index: number = -1;

  ability: Ability | undefined = undefined;
  secondAbility: Ability | undefined = undefined;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  flipped: boolean = false;
  hasBottomActions: boolean = false;
  drawnAbilities: number = 0;

  constructor() {
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

    const reveal =
      settingsManager.settings.abilityReveal ||
      this.monster.active ||
      (this.monster.off &&
        (gameManager.game.figures.some((figure, index, self) => figure.active && index > self.indexOf(this.monster)) ||
          gameManager.game.figures.every((figure) => !figure.active)));

    if (gameManager.game.state == GameState.next && reveal) {
      flipped = flipped || (gameManager.game.state == GameState.next && this.monster.lastDraw == gameManager.game.round);
    }

    return flipped && reveal;
  }

  openAbilities(event: any): void {
    if (settingsManager.settings.abilities && (!event.srcEvent || !event.srcEvent.defaultPrevented)) {
      this.dialog.open(AbiltiesDialogComponent, {
        panelClass: ['dialog'],
        data: this.monster
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
