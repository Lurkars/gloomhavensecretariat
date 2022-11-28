import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { LootDeck } from "src/app/game/model/Loot";

@Component({
  selector: 'ghs-loot-deck-fullscreen',
  templateUrl: './loot-deck-fullscreen.html',
  styleUrls: ['./loot-deck-fullscreen.scss',]
})
export class LootDeckFullscreenComponent implements OnInit {

  configuration: boolean = false;

  constructor(@Inject(DIALOG_DATA) public deck: LootDeck, public dialogRef: DialogRef) { };

  ngOnInit(): void {
    if (this.deck.cards.length == 0) {
      this.configuration = true;
    }
  }

  vertical(): boolean {
    return window.innerWidth < 800;
  }

}

