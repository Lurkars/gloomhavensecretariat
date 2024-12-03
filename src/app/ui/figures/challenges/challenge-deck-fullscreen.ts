import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, EventEmitter, Inject } from "@angular/core";
import { ChallengeDeck } from "src/app/game/model/data/Challenges";
import { ghsDialogClosingHelper } from "../../helper/Static";
import { ChallengeDeckChange } from "./challenge-deck";

@Component({
	standalone: false,
  selector: 'ghs-challenge-deck-fullscreen',
  templateUrl: './challenge-deck-fullscreen.html',
  styleUrls: ['./challenge-deck-fullscreen.scss',]
})
export class ChallengeDeckFullscreenComponent {

  deck: ChallengeDeck;
  before: EventEmitter<ChallengeDeckChange>;
  after: EventEmitter<ChallengeDeckChange>;

  constructor(@Inject(DIALOG_DATA) public data: { deck: ChallengeDeck, before: EventEmitter<ChallengeDeckChange>, after: EventEmitter<ChallengeDeckChange> }, public dialogRef: DialogRef) {
    this.deck = data.deck;
    this.before = data.before;
    this.after = data.after;
  };

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

