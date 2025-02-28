import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { Ability } from 'src/app/game/model/data/Ability';
import { applyPlaceholder } from '../../helper/label';

@Component({
  standalone: false,
  selector: 'ghs-abilities-dialog',
  templateUrl: './abilities-dialog.html',
  styleUrls: ['./abilities-dialog.scss']
})
export class AbiltiesDialogComponent implements OnInit, OnDestroy {

  @ViewChild('menu') menuElement!: ElementRef;
  reveal: number = 0;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  edit: boolean = false;
  maxHeight: string = "";
  bottomActions: boolean = false;
  upcomingCards: Ability[] = [];
  discardedCards: Ability[] = [];
  deletedCards: Ability[] = [];

  constructor(@Inject(DIALOG_DATA) public monster: Monster, public dialogRef: DialogRef) { }

  ngOnInit(): void {
    setTimeout(() => {
      if (this.menuElement) {
        this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
      }
    }, !settingsManager.settings.animations ? 0 : 250);

    this.bottomActions = gameManager.monsterManager.hasBottomActions(this.monster);
    this.update();
    this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() });
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  toggleEdit() {
    this.edit = !this.edit;
    setTimeout(() => {
      this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
    }, 0);
  }

  update() {
    let abilityNumber = this.monster.ability;
    if (abilityNumber >= 0 && this.bottomActions) {
      abilityNumber++;
    }
    this.upcomingCards = this.monster.abilities.filter((value, index) => index > abilityNumber).map((value) => gameManager.abilities(this.monster)[value]);
    this.discardedCards = this.monster.abilities.filter((value, index) => index <= abilityNumber).map((value) => gameManager.abilities(this.monster)[value]).reverse();
    this.deletedCards = gameManager.deckData(this.monster).abilities.filter((ability, index) => this.monster.abilities.indexOf(index) == -1);
  }

  abilityIndex(ability: Ability) {
    return gameManager.abilities(this.monster).indexOf(ability);
  }

  shuffle(upcoming: boolean = false) {
    gameManager.stateManager.before("shuffleAbilityDeck" + (upcoming ? "Upcoming" : ""), "data.monster." + this.monster.name);
    gameManager.monsterManager.shuffleAbilities(this.monster, upcoming);
    gameManager.sortFigures();
    gameManager.stateManager.after();
    this.update();
  }

  draw() {
    gameManager.stateManager.before("drawAbility", "data.monster." + this.monster.name);
    gameManager.monsterManager.drawAbility(this.monster);
    gameManager.sortFigures();
    gameManager.stateManager.after();
    this.update();
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
      gameManager.sortFigures();
      gameManager.stateManager.after();
    }
    this.update();
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
    const sameDeckMonster = gameManager.monsterManager.getSameDeckMonster(this.monster);
    if (sameDeckMonster) {
      gameManager.monsterManager.applySameDeck(sameDeckMonster);
    }
    gameManager.stateManager.after();
    this.update();
  }

  dropDiscarded(event: CdkDragDrop<Ability[]>) {
    gameManager.stateManager.before("reorderAbilities", "data.monster." + this.monster.name);
    if (event.container == event.previousContainer) {
      moveItemInArray(this.monster.abilities, this.monster.ability - event.previousIndex, this.monster.ability - event.currentIndex);
    } else {
      this.monster.ability = this.monster.ability + 1;
      const offset = this.monster.ability;
      moveItemInArray(this.monster.abilities, event.previousIndex + offset, offset - event.currentIndex);
    }
    const sameDeckMonster = gameManager.monsterManager.getSameDeckMonster(this.monster);
    if (sameDeckMonster) {
      gameManager.monsterManager.applySameDeck(sameDeckMonster);
    }
    gameManager.sortFigures();
    gameManager.stateManager.after();
    this.update();
  }

  restoreDefault(): void {
    gameManager.stateManager.before("restoreDefaultAbilities", "data.monster." + this.monster.name);
    gameManager.monsterManager.restoreDefaultAbilities(this.monster);
    gameManager.stateManager.after();
    this.update();
  }

  remove(index: number) {
    const ability: Ability = gameManager.abilities(this.monster)[this.monster.abilities[index]];
    gameManager.stateManager.before("removeAbility", "data.monster." + this.monster.name, ability.name ? this.abilityLabel(ability) : '' + ability.cardId);
    gameManager.monsterManager.removeAbility(this.monster, index);
    gameManager.stateManager.after();
    this.update();
  }

  restore(ability: Ability) {
    gameManager.stateManager.before("restoreAbility", "data.monster." + this.monster.name, ability.name ? this.abilityLabel(ability) : '' + ability.cardId);
    gameManager.monsterManager.restoreAbility(this.monster, ability);
    gameManager.stateManager.after();
    this.update();
  }

  abilityLabel(ability: Ability): string {
    let label = 'data.monster.' + this.monster.name;
    if (ability && ability.name) {
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
    this.update();
  }
}