import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, inject } from '@angular/core';
import { ChallengeDeck } from 'src/app/game/model/data/Challenges';
import { ChallengeDeckChange, ChallengeDeckComponent } from 'src/app/ui/figures/challenges/challenge-deck';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
  imports: [NgClass, forwardRef(() => ChallengeDeckComponent)],
  selector: 'ghs-challenge-deck-fullscreen',
  templateUrl: './challenge-deck-fullscreen.html',
  styleUrls: ['./challenge-deck-fullscreen.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallengeDeckFullscreenComponent {
  dialogRef = inject(DialogRef);

  deck: ChallengeDeck;
  before: EventEmitter<ChallengeDeckChange>;
  after: EventEmitter<ChallengeDeckChange>;

  data: { deck: ChallengeDeck; before: EventEmitter<ChallengeDeckChange>; after: EventEmitter<ChallengeDeckChange> } = inject(DIALOG_DATA);

  constructor() {
    this.deck = this.data.deck;
    this.before = this.data.before;
    this.after = this.data.after;
  }

  vertical(): boolean {
    return window.innerWidth < 800;
  }

  beforeChallengeDeck(change: ChallengeDeckChange) {
    this.before.emit(change);
  }

  afterChallengeDeck(change: ChallengeDeckChange) {
    this.after.emit(change);
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }
}
