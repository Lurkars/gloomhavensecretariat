import { DialogRef } from "@angular/cdk/dialog";
import { Component, OnInit } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { fullLootDeck, LootDeck, LootDeckConfig, LootType } from "src/app/game/model/Loot";

@Component({
  selector: 'ghs-loot-deck-fullscreen',
  templateUrl: './loot-deck-fullscreen.html',
  styleUrls: ['./loot-deck-fullscreen.scss',]
})
export class LootDeckFullscreenComponent implements OnInit {


  configuration: boolean = false;

  constructor(public dialogRef: DialogRef) { };

  ngOnInit(): void {
    if (gameManager.game.lootDeck.cards.length == 0) {
      this.configuration = true;
    }
  }

  vertical(): boolean {
    return window.innerWidth < 800;
  }

}

