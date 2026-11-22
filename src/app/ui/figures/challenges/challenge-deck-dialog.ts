import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { NgClass } from '@angular/common';
import { Component, EventEmitter, inject, OnInit } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ChallengeCard, ChallengeDeck } from 'src/app/game/model/data/Challenges';
import { GameState } from 'src/app/game/model/Game';
import { ChallengeCardComponent } from 'src/app/ui/figures/challenges/challenge-card';
import { ChallengeDeckChange } from 'src/app/ui/figures/challenges/challenge-deck';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [
    NgClass,
    GhsLabelDirective,
    PointerInputDirective,
    GhsTooltipDirective,
    TrackUUIDPipe,
    ChallengeCardComponent,
    CdkDropList,
    CdkDrag,
    CdkDragHandle
  ],
  selector: 'ghs-challenges-dialog',
  templateUrl: './challenge-deck-dialog.html',
  styleUrls: ['./challenge-deck-dialog.scss']
})
export class ChallengeDeckDialogComponent implements OnInit {
  dialogRef = inject(DialogRef);
  private ghsManager = inject(GhsManager);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  reveal: number = 0;
  edit: boolean = false;
  apply: boolean = true;

  deck: ChallengeDeck;
  before: EventEmitter<ChallengeDeckChange>;
  after: EventEmitter<ChallengeDeckChange>;

  current: number = -1;
  drawing: boolean = false;

  disabled: boolean = false;
  drawDisabled: boolean = false;
  drawAvailable: number = 0;
  keepAvailable: number = 0;

  upcomingCards: ChallengeCard[] = [];
  discardedCards: ChallengeCard[] = [];
  finishedCards: ChallengeCard[] = [];
  removedCards: ChallengeCard[] = [];

  data: { deck: ChallengeDeck; before: EventEmitter<ChallengeDeckChange>; after: EventEmitter<ChallengeDeckChange> } = inject(DIALOG_DATA);

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
    this.deck = this.data.deck;
    this.before = this.data.before;
    this.after = this.data.after;
  }

  ngOnInit(): void {
    this.update();
    this.edit = !gameManager.game.scenario;
  }

  update() {
    this.upcomingCards = this.deck.cards.filter((card, index) => index > this.deck.current);
    this.discardedCards = this.deck.cards.filter((card, index) => index <= this.deck.current && index > this.deck.finished).reverse();
    this.finishedCards = this.deck.cards.filter((card, index) => index <= this.deck.finished).reverse();

    this.removedCards = gameManager
      .challengesData(gameManager.game.edition)
      .filter((challengeCard) => this.deck.cards.find((other) => other.cardId === challengeCard.cardId) === undefined);

    const building = gameManager.game.party.buildings.find(
      (buildingModel) => buildingModel.name === 'town-hall' && buildingModel.level && buildingModel.state !== 'wrecked'
    );
    if (building) {
      this.drawAvailable = building.level;
      this.keepAvailable = Math.ceil(building.level / 2);
    }

    this.disabled =
      !gameManager.roundManager.firstRound ||
      gameManager.game.state === GameState.next ||
      !gameManager.game.scenario ||
      !this.deck.cards.length;
    this.drawDisabled = this.disabled || this.deck.current - this.deck.finished >= this.drawAvailable;
  }

  toggleEdit() {
    this.edit = !this.edit;
  }

  shuffle(upcoming: boolean = false): void {
    this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.shuffle' + (upcoming ? 'Upcoming' : '')));
    gameManager.challengesManager.shuffleDeck(this.deck, upcoming);
    this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.shuffle' + (upcoming ? 'Upcoming' : '')));
    this.update();
  }

  clear(keep: boolean = true): void {
    this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.clear'));
    gameManager.challengesManager.clearDrawn(this.deck, keep);
    this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.clear'));
    this.update();
  }

  drawCard() {
    if (!this.disabled && this.deck.cards.length > 0) {
      this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.draw'));
      gameManager.challengesManager.drawCard(this.deck);
      this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.draw'));
    }
  }

  private dropList(event: CdkDragDrop<ChallengeCard[]>, list: string): string {
    if (event.container === event.previousContainer) {
      return list;
    } else if (event.previousContainer.id === 'listFinished') {
      return 'finished';
    } else if (event.previousContainer.id === 'listDiscarded') {
      return 'discarded';
    }
    return 'upcoming';
  }

  private drop(event: CdkDragDrop<ChallengeCard[]>, list: string) {
    this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.reorder'));
    gameManager.challengesManager.moveCard(this.deck, this.dropList(event, list), event.previousIndex, list, event.currentIndex);
    this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.reorder'));
    this.update();
  }

  dropUpcoming(event: CdkDragDrop<ChallengeCard[]>) {
    this.drop(event, 'upcoming');
  }

  dropDiscarded(event: CdkDragDrop<ChallengeCard[]>) {
    this.drop(event, 'discarded');
  }

  dropFinished(event: CdkDragDrop<ChallengeCard[]>) {
    this.drop(event, 'finished');
  }

  toggleKeep(index: number, force: boolean = false) {
    if (
      index <= this.deck.current &&
      (force ||
        (!this.edit && gameManager.game.scenario && gameManager.roundManager.firstRound && gameManager.game.state === GameState.draw))
    ) {
      this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.toggle', index));
      gameManager.challengesManager.toggleKeep(this.deck, index, this.keepAvailable);
      this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.toggle', index));
    }
  }

  remove(index: number) {
    this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.removeCard', index));
    if (index <= this.deck.current) {
      this.deck.current--;
      this.current = this.deck.current;
    }
    this.deck.cards.splice(index, 1);
    this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.removeCard', index));
    this.update();
  }

  restoreCard(index: number) {
    const card = this.removedCards[index];
    if (card) {
      this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.restoreCard', card.cardId));
      gameManager.challengesManager.restoreCard(this.deck, card);
      this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.restoreCard'));
      this.update();
    }
  }
}
