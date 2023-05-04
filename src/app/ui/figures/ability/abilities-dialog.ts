import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { Ability } from 'src/app/game/model/data/Ability';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { applyPlaceholder } from '../../helper/i18n';
import { EntityValueFunction } from 'src/app/game/model/Entity';

@Component({
  selector: 'ghs-abilities-dialog',
  templateUrl: './abilities-dialog.html',
  styleUrls: ['./abilities-dialog.scss']
})
export class AbiltiesDialogComponent implements OnInit {

  @ViewChild('menu') menuElement!: ElementRef;
  reveal: number = 0;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  edit: boolean = false;
  maxHeight: string = "";
  bottomActions: boolean = false;

  constructor(@Inject(DIALOG_DATA) public monster: Monster, public dialogRef: DialogRef) { }

  ngOnInit(): void {
    setTimeout(() => {
      if (this.menuElement) {
        this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
      }
    }, settingsManager.settings.disableAnimations ? 0 : 250);

    this.bottomActions = gameManager.monsterManager.hasBottomActions(this.monster);
  }

  toggleEdit() {
    this.edit = !this.edit;
    setTimeout(() => {
      this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
    }, 0);
  }

  upcomingCards(): Ability[] {
    let abilityNumber = this.monster.ability;
    if (abilityNumber >= 0 && this.bottomActions) {
      abilityNumber++;
    }
    return this.monster.abilities.filter((value, index) => index > abilityNumber).map((value) => gameManager.abilities(this.monster)[value]);
  }

  disgardedCards(): Ability[] {
    let abilityNumber = this.monster.ability;
    if (abilityNumber >= 0 && this.bottomActions) {
      abilityNumber++;
    }
    return [
      ...this.monster.abilities.filter((value, index) => index <= abilityNumber).map((value) => gameManager.abilities(this.monster)[value]).reverse(),
      ...this.monster.abilities.filter((value, index) => index > abilityNumber && index < gameManager.monsterManager.drawnAbilities(this.monster)).map((value) => gameManager.abilities(this.monster)[value])
    ];
  }

  abilityIndex(ability: Ability) {
    return gameManager.abilities(this.monster).indexOf(ability);
  }

  async shuffle() {
    await gameManager.stateManager.before("shuffleAbilityDeck", "data.monster." + this.monster.name);
    gameManager.monsterManager.shuffleAbilities(this.monster);
await gameManager.stateManager.after();
  }

  async draw() {
    await gameManager.stateManager.before("drawAbility", "data.monster." + this.monster.name);
    gameManager.monsterManager.drawAbility(this.monster);
await gameManager.stateManager.after();
  }


  async toggleDrawExtra() {
    if (this.monster.drawExtra) {
      await gameManager.stateManager.before("unsetDrawExtraAbility", "data.monster." + this.monster.name);
      this.monster.drawExtra = false;
      gameManager.monsterManager.applySameDeck(this.monster);
await gameManager.stateManager.after();
    } else if (gameManager.monsterManager.applySameDeck(this.monster)) {
      await gameManager.stateManager.before("setDrawExtraAbility", "data.monster." + this.monster.name);
      this.monster.drawExtra = true;
      if (gameManager.game.state == GameState.next) {
        gameManager.monsterManager.drawExtra(this.monster);
      }
await gameManager.stateManager.after();
    }
  }

  async dropUpcoming(event: CdkDragDrop<Ability[]>) {
    await gameManager.stateManager.before("reorderAbilities", "data.monster." + this.monster.name);
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
await gameManager.stateManager.after();
  }

  async dropDisgarded(event: CdkDragDrop<Ability[]>) {
    await gameManager.stateManager.before("reorderAbilities", "data.monster." + this.monster.name);
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
await gameManager.stateManager.after();
  }

  async restoreDefault() {
    await gameManager.stateManager.before("restoreDefaultAbilities", "data.monster." + this.monster.name);
    const abilities = gameManager.abilities(this.monster);
    this.monster.abilities = abilities.filter((ability) => !ability.level || isNaN(+ability.level) || EntityValueFunction(ability.level) <= this.monster.level).map((ability, index) => index);
    this.monster.ability = -1;
await gameManager.stateManager.after();
  }

  async remove(index: number) {
    const ability: Ability = gameManager.abilities(this.monster)[this.monster.abilities[index + this.monster.ability + 1]];
    await gameManager.stateManager.before("removeAbility", "data.monster." + this.monster.name, this.abilityLabel(ability));
    this.monster.abilities.splice(index + this.monster.ability + 1, 1);
await gameManager.stateManager.after();
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
}