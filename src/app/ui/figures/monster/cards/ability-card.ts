import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, OnInit, inject, input } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { AbilityCardComponent } from 'src/app/ui/figures/ability-card/ability-card';
import { AbilityCardDialogComponent } from 'src/app/ui/figures/ability-card/ability-card-dialog';
import { AbilityDeckDialogComponent } from 'src/app/ui/figures/ability-card/ability-deck-dialog';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

@Component({
  imports: [NgClass, PointerInputDirective, AbilityCardComponent],
  selector: 'ghs-monster-ability-card',
  templateUrl: './ability-card.html',
  styleUrls: ['./ability-card.scss']
})
export class MonsterAbilityCardComponent implements OnInit {
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  readonly inputMonster = input.required<Monster>({ alias: 'monster' });
  get monster(): Monster {
    return this.inputMonster();
  }

  readonly index = input<number>(-1);

  abilityCard: AbilityCard | undefined = undefined;
  secondAbilityCard: AbilityCard | undefined = undefined;
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

  get minInitiative(): number {
    let abilityCards = gameManager.editionManager
      .abilityCards(this.monster)
      .filter((abilityCard, i) => this.monster.abilities.indexOf(i) > this.monster.ability);
    if (!abilityCards.length) {
      abilityCards = gameManager.editionManager.abilityCards(this.monster);
    }
    return abilityCards.length ? Math.min(...abilityCards.map((abilityCard) => abilityCard.initiative)) : 0;
  }

  get maxInitiative(): number {
    let abilityCards = gameManager.editionManager
      .abilityCards(this.monster)
      .filter((abilityCard, i) => this.monster.abilities.indexOf(i) > this.monster.ability);
    if (!abilityCards.length) {
      abilityCards = gameManager.editionManager.abilityCards(this.monster);
    }
    return abilityCards.length ? Math.max(...abilityCards.map((abilityCard) => abilityCard.initiative)) : 0;
  }

  update() {
    this.hasBottomActions = gameManager.monsterAbilityManager.hasBottomActions(this.monster);
    this.drawnAbilities = gameManager.monsterAbilityManager.drawnAbilities(this.monster);
    this.flipped = this.calcFlipped();
  }

  calcFlipped(): boolean {
    if (!settingsManager.settings.abilities || gameManager.game.state === GameState.draw) {
      return false;
    }

    const indexValue = this.index();
    if (indexValue === -1) {
      this.abilityCard = gameManager.monsterAbilityManager.getAbilityCard(this.monster);
    } else {
      this.abilityCard = gameManager.editionManager.abilityCards(this.monster)[indexValue];
    }

    if (!this.abilityCard) {
      return false;
    }

    if (gameManager.editionManager.hasBottomAbility(this.abilityCard)) {
      // Manifestation of Corruption mechanic?!
      this.abilityCard = gameManager.monsterAbilityManager.getAbilityCard(this.monster, true);
      this.secondAbilityCard = gameManager.monsterAbilityManager.getAbilityCard(this.monster);
    }

    let flipped =
      !gameManager.roundManager.working &&
      gameManager.game.state === GameState.next &&
      gameManager.entityManager.gameplayFigure(this.monster);

    const reveal =
      settingsManager.settings.abilityReveal ||
      this.monster.active ||
      (this.monster.off &&
        (gameManager.game.figures.some((figure, index, self) => figure.active && index > self.indexOf(this.monster)) ||
          gameManager.game.figures.every((figure) => !figure.active)));

    if (gameManager.game.state === GameState.next && reveal) {
      flipped = flipped || (gameManager.game.state === GameState.next && this.monster.lastDraw === gameManager.game.round);
    }

    return flipped && reveal;
  }

  openAbilities(event: any): void {
    if (settingsManager.settings.abilities && (!event.srcEvent || !event.srcEvent.defaultPrevented)) {
      this.dialog.open(AbilityDeckDialogComponent, {
        panelClass: ['dialog'],
        data: this.monster
      });
    }
  }

  openAbility(event: any): void {
    if (settingsManager.settings.abilities) {
      if (this.flipped) {
        this.dialog.open(AbilityCardDialogComponent, {
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
