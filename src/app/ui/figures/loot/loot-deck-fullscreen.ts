import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, inject, OnInit } from '@angular/core';
import { LootDeck } from 'src/app/game/model/data/Loot';
import { LootDeckChange, LootDeckComponent } from 'src/app/ui/figures/loot/loot-deck';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
  imports: [NgClass, forwardRef(() => LootDeckComponent)],
  selector: 'ghs-loot-deck-fullscreen',
  templateUrl: './loot-deck-fullscreen.html',
  styleUrls: ['./loot-deck-fullscreen.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LootDeckFullscreenComponent implements OnInit {
  dialogRef = inject(DialogRef);

  configuration: boolean = false;
  deck: LootDeck;
  before: EventEmitter<LootDeckChange>;
  after: EventEmitter<LootDeckChange>;

  data: { deck: LootDeck; before: EventEmitter<LootDeckChange>; after: EventEmitter<LootDeckChange> } = inject(DIALOG_DATA);

  constructor() {
    this.deck = this.data.deck;
    this.before = this.data.before;
    this.after = this.data.after;
  }

  ngOnInit(): void {
    if (this.deck.cards.length === 0) {
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
