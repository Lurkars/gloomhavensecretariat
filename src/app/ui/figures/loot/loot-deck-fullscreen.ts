import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, EventEmitter, Inject, OnInit } from "@angular/core";
import { LootDeck } from "src/app/game/model/data/Loot";
import { LootDeckChange } from "./loot-deck";
import { ghsDialogClosingHelper } from "../../helper/Static";

@Component({
	standalone: false,
  selector: 'ghs-loot-deck-fullscreen',
  templateUrl: './loot-deck-fullscreen.html',
  styleUrls: ['./loot-deck-fullscreen.scss',]
})
export class LootDeckFullscreenComponent implements OnInit {

  configuration: boolean = false;
  deck: LootDeck;
  before: EventEmitter<LootDeckChange>;
  after: EventEmitter<LootDeckChange>;

  constructor(@Inject(DIALOG_DATA) public data: { deck: LootDeck, before: EventEmitter<LootDeckChange>, after: EventEmitter<LootDeckChange> }, public dialogRef: DialogRef) {
    this.deck = data.deck;
    this.before = data.before;
    this.after = data.after;
  };

  ngOnInit(): void {
    if (this.deck.cards.length == 0) {
      this.configuration = true;
    }
  }

  vertical(): boolean {
    return window.innerWidth < 800;
  }


  beforeLootDeck(change: LootDeckChange) {
    this.before.emit(change);
  }

  afterLootDeck(change: LootDeckChange) {
    this.after.emit(change);
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }

}

