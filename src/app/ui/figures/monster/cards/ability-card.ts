import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { Ability } from 'src/app/game/model/Ability';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Dialog } from '@angular/cdk/dialog';
import { AbiltiesDialogComponent } from '../../ability/abilities-dialog';
import { AbilityDialogComponent } from '../../ability/ability-dialog';
import { applyPlaceholder } from 'src/app/ui/helper/i18n';

@Component({
  selector: 'ghs-monster-ability-card',
  templateUrl: './ability-card.html',
  styleUrls: ['./ability-card.scss']
})
export class MonsterAbilityCardComponent {

  @Input() monster!: Monster;
  @Input() index: number = -1;
  @ViewChild('menu') menuElement!: ElementRef;
  reveal: number = 0;

  ability: Ability | undefined = undefined;
  secondAbility: Ability | undefined = undefined;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  edit: boolean = false;
  cardPopup: boolean = false;
  maxHeight: string = "";
  lastReveal: number = 0;

  doubleClick: any = null;

  constructor(private dialog: Dialog) { }

  flipped(): boolean {
    if (this.index == -1) {
      this.ability = gameManager.monsterManager.getAbility(this.monster);
      if (this.ability && this.ability.bottomActions && this.ability.bottomActions.length > 0) {
        // Manifestation of Corruption mechanic?!
        // this.secondAbility = gameManager.abilities(this.monster)[this.monster.ability + 1];
      }
    } else {
      this.ability = gameManager.abilities(this.monster)[this.index];
    }

    let flipped = gameManager.roundManager.working && gameManager.game.state == GameState.draw || !gameManager.roundManager.working && gameManager.game.state == GameState.next && this.ability != undefined && this.monster.entities.filter((monsterEntity) => !monsterEntity.dead).length > 0;

    if (flipped) {
      this.lastReveal = gameManager.game.round;
    }

    let reveal = settingsManager.settings.abilityReveal || this.monster.active || this.monster.off && (gameManager.game.figures.some((figure, index, self) => figure.active && index > self.indexOf(this.monster)) || gameManager.game.figures.every((figure) => !figure.active));

    if (gameManager.game.state == GameState.next && reveal) {
      flipped = flipped || gameManager.game.state == GameState.next && this.lastReveal == gameManager.game.round;
    }

    return flipped && reveal;
  }

  toggleEdit() {
    this.edit = !this.edit;
    setTimeout(() => {
      this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
    }, 0);
  }

  upcomingCards(): Ability[] {
    return this.monster.abilities.filter((value, index) => index > this.monster.ability).map((value) => gameManager.abilities(this.monster)[value]);
  }

  disgardedCards(): Ability[] {
    return this.monster.abilities.filter((value, index) => index <= this.monster.ability).map((value) => gameManager.abilities(this.monster)[value]).reverse();
  }

  abilityIndex(ability: Ability) {
    return gameManager.abilities(this.monster).indexOf(ability);
  }

  shuffle() {
    gameManager.stateManager.before("shuffleAbilityDeck", "data.monster." + this.monster.name);
    gameManager.monsterManager.shuffleAbilities(this.monster);
    gameManager.stateManager.after();
  }

  draw() {
    gameManager.stateManager.before("drawAbility", "data.monster." + this.monster.name);
    gameManager.monsterManager.drawAbility(this.monster);
    gameManager.stateManager.after();
  }


  toggleDrawExtra() {
    if (this.monster.drawExtra) {
      gameManager.stateManager.before("unsetDrawExtraAbility", "data.monster." + this.monster.name);
      this.monster.drawExtra = false;
      gameManager.monsterManager.applySameDeck(this.monster);
      gameManager.stateManager.after();
    } else if (gameManager.monsterManager.applySameDeck(this.monster)) {
      gameManager.stateManager.before("setDrawExtraAbility", "data.monster." + this.monster.name);
      this.monster.drawExtra = true;
      if (gameManager.game.state == GameState.next) {
        gameManager.monsterManager.drawExtra(this.monster);
      }
      gameManager.stateManager.after();
    }
  }

  dropUpcoming(event: CdkDragDrop<Ability[]>) {
    gameManager.stateManager.before("reorderAbilities", "data.monster." + this.monster.name);
    if (event.container == event.previousContainer) {
      const offset = this.monster.ability + 1;
      moveItemInArray(this.monster.abilities, event.previousIndex + offset, event.currentIndex + offset);
    } else {
      const offset = this.monster.ability;
      moveItemInArray(this.monster.abilities, offset - event.previousIndex, event.currentIndex + offset);
      this.monster.ability = this.monster.ability - 1;
    }
    gameManager.stateManager.after();
  }

  dropDisgarded(event: CdkDragDrop<Ability[]>) {
    gameManager.stateManager.before("reorderAbilities", "data.monster." + this.monster.name);
    if (event.container == event.previousContainer) {
      moveItemInArray(this.monster.abilities, this.monster.ability - event.previousIndex, this.monster.ability - event.currentIndex);
    } else {
      this.monster.ability = this.monster.ability + 1;
      const offset = this.monster.ability;
      moveItemInArray(this.monster.abilities, event.previousIndex + offset, offset - event.currentIndex);
    }
    gameManager.stateManager.after();
  }

  restoreDefault(): void {
    gameManager.stateManager.before("restoreDefaultAbilities", "data.monster." + this.monster.name);
    const abilities = gameManager.abilities(this.monster);
    this.monster.abilities = abilities.filter((ability) => !ability.level || isNaN(+ability.level) || ability.level <= this.monster.level).map((ability, index) => index);
    this.monster.ability = -1;
    gameManager.stateManager.after();
  }

  remove(index: number) {
    const ability: Ability = gameManager.abilities(this.monster)[this.monster.abilities[index + this.monster.ability + 1]];
    gameManager.stateManager.before("removeAbility", "data.monster." + this.monster.name, this.abilityLabel(ability));
    this.monster.abilities.splice(index + this.monster.ability + 1, 1);
    gameManager.stateManager.after();
  }

  abilityLabel(ability: Ability): string {
    let label = 'data.monster.' + this.monster.name;
    if (ability?.name) {
      label = 'data.ability.' + ability.name;
    } else if (this.monster.deck != this.monster.name) {
      label = 'data.deck.' + this.monster.deck;
      if (label.split('.')[label.split('.').length - 1] === applyPlaceholder(settingsManager.getLabel(label)) && this.monster.deck) {
        label = 'data.monster.' + this.monster.deck;
      }
    }

    return applyPlaceholder(settingsManager.getLabel(label));
  }

  defaultSort() {
    this.monster.abilities = this.monster.abilities.sort((a, b) => a - b);
  }

  openAbilities(): void {
    this.dialog.open(AbiltiesDialogComponent, {
      panelClass: 'dialog', data: this.monster
    });
  }

  openAbility(): void {
    if (this.flipped()) {
      this.dialog.open(AbilityDialogComponent, {
        data: { ability: this.ability, monster: this.monster }
      });
    }
  }

  click(): void {
    if (this.doubleClick) {
      clearTimeout(this.doubleClick);
      this.doubleClick = null;
      this.openAbility();
    } else {
      this.doubleClick = setTimeout(() => {
        if (this.doubleClick) {
          this.openAbilities();
          this.doubleClick = null;
        }
      }, 200)
    }
  }
}