import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, inject, input, OnInit } from '@angular/core';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { AbilityCardHalf, AbilityCardPlay, CharacterAbilityCards } from 'src/app/game/model/CharacterAbilityCards';
import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { GameState } from 'src/app/game/model/Game';
import { AbilityCardComponent } from 'src/app/ui/figures/ability-card/ability-card';
import { AbilityCardDialogComponent } from 'src/app/ui/figures/ability-card/ability-card-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

@Component({
  imports: [NgClass, NgTemplateOutlet, GhsLabelDirective, GhsTooltipDirective, PointerInputDirective, GhsRangePipe, AbilityCardComponent],
  selector: 'ghs-ability-cards-play',
  templateUrl: 'ability-cards-play.html',
  styleUrls: ['./ability-cards-dialog.scss', './ability-cards-play.scss']
})
export class AbilityCardsPlayComponent implements OnInit {
  private dialog = inject(Dialog);
  private dialogRef = inject(DialogRef);
  private ghsManager = inject(GhsManager);

  readonly character = input.required<Character>();

  abilityCards: AbilityCard[] = [];
  cards: CharacterAbilityCards | undefined;
  chooseHand: boolean = false;
  handSelection: number[] = [];
  handCandidates: number[] = [];
  handSize: number = 0;
  draw: boolean = false;
  handEditable: boolean = false;
  canShortRest: boolean = false;
  canRerollShortRest: boolean = false;
  longRestPending: boolean = false;
  mustRest: boolean = false;
  canDeclareLongRest: boolean = false;
  longResting: boolean = false;
  longRestCard: number | undefined;
  shortRestLost: number | undefined;
  selecting: boolean = false;
  selection: number[] = [];
  selectionDirty: boolean = false;
  selectedView: number[] = [];
  handView: number[] = [];
  emptySlots: number = 0;
  playing: boolean = false;
  plays: AbilityCardPlay[] = [];
  defaultTopActions: Action[] = [new Action(ActionType.attack, 2)];
  defaultBottomActions: Action[] = [new Action(ActionType.move, 2)];
  prompt: string = '';
  promptArgs: (string | number)[] = [];

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    const character = this.character();
    this.chooseHand =
      !character.abilityCards ||
      (gameManager.characterAbilityManager.handEditable(character) && !gameManager.characterAbilityManager.handComplete(character));
    this.handSelection = gameManager.characterAbilityManager.defaultHand(character);
    this.update();
  }

  update() {
    const character = this.character();
    const characterAbilityManager = gameManager.characterAbilityManager;
    this.abilityCards = gameManager.editionManager.deckData(character).abilities;
    this.cards = character.abilityCards;
    this.handSize = characterAbilityManager.handSize(character);
    this.draw = gameManager.game.state === GameState.draw;
    this.handEditable = characterAbilityManager.handEditable(character);
    // without scenario only the hand can be chosen
    const scenario = !!gameManager.game.scenario;
    this.chooseHand = (this.chooseHand || !scenario) && (!this.cards || this.handEditable);
    const available = characterAbilityManager.availableAbilityCards(character);
    this.handCandidates = [...available, ...this.handSelection.filter((index) => !available.includes(index))];
    this.canShortRest = scenario && characterAbilityManager.canShortRest(character);
    this.canRerollShortRest = scenario && characterAbilityManager.canRerollShortRest(character);
    this.canDeclareLongRest = scenario && characterAbilityManager.canDeclareLongRest(character);
    this.longResting = this.longResting && this.canDeclareLongRest;
    // choosing the card to lose, either declaring a long rest now or on the turn of an already declared one
    this.longRestPending =
      scenario &&
      !this.chooseHand &&
      !!this.cards &&
      (this.longResting || (character.longRest && this.cards.discard.length >= 2 && !this.cards.selected.length));
    if (!this.longRestPending || (this.longRestCard !== undefined && !characterAbilityManager.canLongRest(character, this.longRestCard))) {
      this.longRestCard = undefined;
    }
    // not enough cards to play two, resting is required
    this.mustRest =
      scenario &&
      !this.chooseHand &&
      !this.longRestPending &&
      !!this.cards &&
      this.draw &&
      !character.longRest &&
      !character.exhausted &&
      this.cards.hand.length + this.cards.selected.length < 2;
    this.selecting =
      scenario &&
      !this.chooseHand &&
      !this.mustRest &&
      !this.longRestPending &&
      !!this.cards &&
      this.draw &&
      !character.longRest &&
      !character.exhausted &&
      !character.absent;
    if (this.cards && (!this.selecting || !this.selectionDirty)) {
      this.selection = this.selecting ? characterAbilityManager.defaultSelection(character) : [...this.cards.selected];
      this.selectionDirty = false;
    }
    this.playing = scenario && !this.chooseHand && !!this.cards && !this.draw && this.cards.selected.length > 0 && !character.longRest;
    this.plays = this.playing && this.cards ? this.plays.filter((play) => this.cards!.selected.includes(play.index)) : [];
    this.updateSelection();
  }

  updateSelection() {
    const cards = this.cards;
    this.selectedView = cards ? (this.selecting ? this.selection : cards.selected) : [];
    this.handView = cards
      ? this.selecting
        ? [...cards.hand, ...cards.selected].filter((index) => !this.selection.includes(index))
        : cards.hand
      : [];
    this.emptySlots = this.selecting ? Math.max(0, 2 - this.selection.length) : 0;
    this.updatePrompt();
  }

  updatePrompt() {
    const character = this.character();
    this.prompt = '';
    this.promptArgs = [];
    if (this.chooseHand) {
      this.prompt = this.handSelection.length < this.handSize ? 'chooseHand' : 'handComplete';
      this.promptArgs = [this.handSelection.length, this.handSize];
    } else if (!this.cards || character.exhausted) {
      return;
    } else if (this.longRestPending) {
      this.prompt = 'longRest';
    } else if (this.draw && character.longRest) {
      this.prompt = 'longRestDeclared';
    } else if (this.mustRest) {
      this.prompt = 'mustRest';
    } else if (this.selecting && this.emptySlots) {
      this.prompt = this.canDeclareLongRest ? 'selectCardsOrRest' : 'selectCards';
      this.promptArgs = [this.selection.length];
    } else if (this.selecting) {
      this.prompt = 'cardsSelected';
      this.promptArgs = [gameManager.characterAbilityManager.cardInitiative(character, this.selection[0])];
    } else if (this.cards.selected.length) {
      this.prompt = 'playCards';
    }
  }

  characterName(): string {
    return gameManager.characterManager.characterName(this.character(), true, true);
  }

  cardName(index: number): string {
    const abilityCard = this.abilityCards[index];
    return abilityCard ? abilityCard.name || '' + (abilityCard.cardId || '') : '';
  }

  changeHand() {
    this.handSelection = gameManager.characterAbilityManager.defaultHand(this.character());
    this.chooseHand = true;
    this.update();
  }

  canToggleSelection(index: number): boolean {
    return (
      this.handSelection.includes(index) || gameManager.characterAbilityManager.canSetHand(this.character(), [...this.handSelection, index])
    );
  }

  toggleSelection(index: number) {
    if (this.handSelection.includes(index)) {
      this.handSelection = this.handSelection.filter((value) => value !== index);
    } else if (this.canToggleSelection(index)) {
      this.handSelection = [...this.handSelection, index];
    }
    this.updatePrompt();
  }

  canApplyHand(): boolean {
    return this.handSelection.length > 0 && gameManager.characterAbilityManager.canSetHand(this.character(), this.handSelection);
  }

  applyHand() {
    if (!this.canApplyHand()) {
      return;
    }
    const cards = this.cards;
    const unchanged =
      !!cards && cards.hand.length === this.handSelection.length && this.handSelection.every((index) => cards.hand.includes(index));
    if (!unchanged) {
      gameManager.stateManager.before('character.setHand', this.characterName(), this.handSelection.length);
      gameManager.characterAbilityManager.setHand(this.character(), this.handSelection);
      gameManager.stateManager.after();
    }
    this.chooseHand = false;
    this.update();
    // continue with choosing the cards for the round
    if (!this.selecting) {
      this.close();
    }
  }

  canApplySelection(): boolean {
    return (
      this.selecting &&
      !!this.cards &&
      this.selection.join() !== this.cards.selected.join() &&
      gameManager.characterAbilityManager.canSelectCards(this.character(), this.selection)
    );
  }

  applySelection() {
    if (!this.canApplySelection()) {
      return;
    }
    gameManager.stateManager.before(
      'character.selectCards',
      this.characterName(),
      this.selection.map((index) => this.cardName(index)).join(', ')
    );
    gameManager.characterAbilityManager.selectCards(this.character(), this.selection);
    gameManager.stateManager.after();
    this.close();
  }

  startLongRest() {
    this.longResting = true;
    this.shortRestLost = undefined;
    this.update();
  }

  cancelLongRest() {
    if (this.longResting) {
      this.longResting = false;
      this.update();
    } else {
      this.close();
    }
  }

  activeIndices(): number[] {
    return this.cards ? this.cards.active.map((activeCard) => activeCard.index) : [];
  }

  chooseLongRestCard(index: number) {
    this.longRestCard = this.longRestCard === index ? undefined : index;
  }

  canApplyLongRest(): boolean {
    return this.longRestCard !== undefined && gameManager.characterAbilityManager.canLongRest(this.character(), this.longRestCard);
  }

  applyLongRest() {
    if (!this.canApplyLongRest() || this.longRestCard === undefined) {
      return;
    }
    gameManager.stateManager.before('character.longRestCard', this.characterName(), this.cardName(this.longRestCard));
    gameManager.characterAbilityManager.longRest(this.character(), this.longRestCard);
    gameManager.stateManager.after();
    this.longResting = false;
    this.close();
  }

  disable() {
    gameManager.stateManager.before('character.abilityCardsDisable', this.characterName());
    gameManager.characterAbilityManager.enableAbilityCards(this.character(), false);
    gameManager.stateManager.after();
    this.changeHand();
  }

  close() {
    this.dialogRef.close();
  }

  clickHand(index: number) {
    if (this.selecting && this.selection.length < 2) {
      this.selection = [...this.selection, index];
      this.selectionDirty = true;
      this.updateSelection();
    } else {
      this.openDialog(index);
    }
  }

  clickSelected(index: number, event: any = undefined) {
    const container = this.playing && event && event.target && event.target.closest && event.target.closest('.ability-actions-container');
    if (container) {
      this.clickHalf(index, !!container.querySelector('.ability-bottom-actions'));
    } else if (this.selecting) {
      this.selection = this.selection.filter((value) => value !== index);
      this.selectionDirty = true;
      this.updateSelection();
    } else {
      this.openDialog(index);
    }
  }

  switchSelection() {
    this.selection = [...this.selection].reverse();
    this.selectionDirty = true;
    this.updateSelection();
  }

  private sideHalf(bottom: boolean, isDefault: boolean): AbilityCardHalf {
    return bottom ? (isDefault ? 'defaultBottom' : 'bottom') : isDefault ? 'defaultTop' : 'top';
  }

  playedHalf(index: number, bottom: boolean): AbilityCardHalf | undefined {
    const play = this.plays.find((value) => value.index === index);
    return play && (play.half === 'bottom' || play.half === 'defaultBottom') === bottom ? play.half : undefined;
  }

  inactiveHalf(index: number): 'top' | 'bottom' | false {
    return !this.canSelectHalf(index, false) ? 'top' : !this.canSelectHalf(index, true) ? 'bottom' : false;
  }

  activeHalf(index: number): 'top' | 'bottom' | false {
    const play = this.plays.find((value) => value.index === index);
    return play ? (play.half === 'bottom' || play.half === 'defaultBottom' ? 'bottom' : 'top') : false;
  }

  // the other half of a card with a played half is disabled
  canSelectHalf(index: number, bottom: boolean): boolean {
    const active = this.activeHalf(index);
    return (
      (!active || active === (bottom ? 'bottom' : 'top')) &&
      gameManager.characterAbilityManager.canPlayCards(this.character(), [new AbilityCardPlay(index, this.sideHalf(bottom, false))])
    );
  }

  // cycles half, default action of the half and nothing, the other card gets the opposite half
  clickHalf(index: number, bottom: boolean) {
    if (!this.cards || !this.canSelectHalf(index, bottom)) {
      return;
    }
    const half = this.playedHalf(index, bottom);
    if (half === 'defaultTop' || half === 'defaultBottom') {
      this.plays = [];
      return;
    }
    const plays = [new AbilityCardPlay(index, this.sideHalf(bottom, !!half))];
    const other = this.cards.selected.find((value) => value !== index);
    if (other !== undefined) {
      const otherHalf = this.playedHalf(other, !bottom);
      const otherPlay = new AbilityCardPlay(other, this.sideHalf(!bottom, otherHalf === 'defaultTop' || otherHalf === 'defaultBottom'));
      if (gameManager.characterAbilityManager.canPlayCards(this.character(), [...plays, otherPlay])) {
        plays.push(otherPlay);
      }
    }
    this.plays = plays;
  }

  // double click on the disabled half switches sides
  doubleClickSelected(index: number, event: any = undefined) {
    const container = this.playing && event && event.target && event.target.closest && event.target.closest('.ability-actions-container');
    if (container && container.classList.contains('inactive') && this.plays.some((play) => play.index === index)) {
      this.switchSides();
    } else {
      this.openDialog(index);
    }
  }

  // swaps top and bottom of all chosen halves, default actions are reset
  switchSides() {
    const plays = this.plays.map((play) => {
      const bottom = play.half === 'bottom' || play.half === 'defaultBottom';
      return new AbilityCardPlay(play.index, this.sideHalf(!bottom, false));
    });
    if (gameManager.characterAbilityManager.canPlayCards(this.character(), plays)) {
      this.plays = plays;
    }
  }

  canApplyPlays(): boolean {
    return this.playing && gameManager.characterAbilityManager.canPlayCards(this.character(), this.plays);
  }

  applyPlays() {
    if (!this.canApplyPlays()) {
      return;
    }
    gameManager.stateManager.before(
      'character.playCards',
      this.characterName(),
      this.plays.map((play) => this.cardName(play.index) + ' (%character.abilities.cards.half.' + play.half + '%)').join(', ')
    );
    gameManager.characterAbilityManager.playCards(this.character(), this.plays);
    gameManager.stateManager.after();
    this.plays = [];
    if (this.cards && !this.cards.selected.length) {
      this.close();
    }
  }

  removeActiveCard(index: number) {
    if (!gameManager.characterAbilityManager.canRemoveActiveCard(this.character(), index)) {
      return;
    }
    gameManager.stateManager.before('character.removeActiveCard', this.characterName(), this.cardName(index));
    gameManager.characterAbilityManager.removeActiveCard(this.character(), index);
    gameManager.stateManager.after();
  }

  shortRest() {
    if (!this.canShortRest) {
      return;
    }
    gameManager.stateManager.before('character.shortRest', this.characterName());
    this.shortRestLost = gameManager.characterAbilityManager.shortRest(this.character());
    gameManager.stateManager.after();
  }

  continueShortRest() {
    this.shortRestLost = undefined;
    if (this.character().exhausted) {
      this.close();
    }
  }

  rerollShortRest() {
    if (!this.canRerollShortRest) {
      return;
    }
    gameManager.stateManager.before('character.rerollShortRest', this.characterName());
    this.shortRestLost = gameManager.characterAbilityManager.rerollShortRest(this.character());
    gameManager.stateManager.after();
  }

  openDialog(index: number) {
    const abilityCard = this.abilityCards[index];
    if (abilityCard) {
      this.dialog.open(AbilityCardDialogComponent, {
        panelClass: ['fullscreen-panel'],
        disableClose: true,
        data: { abilityCard: abilityCard, character: this.character() }
      });
    }
  }
}
