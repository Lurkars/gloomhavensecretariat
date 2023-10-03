
import { DialogRef } from "@angular/cdk/dialog";
import { Component, OnInit } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { LootType } from "src/app/game/model/data/Loot";

@Component({
  selector: 'ghs-party-resources',
  templateUrl: 'resources.html',
  styleUrls: ['./resources.scss']
})
export class PartyResourcesDialogComponent implements OnInit {

  gameManager: GameManager = gameManager;

  characters: Character[] = [];
  total: Partial<Record<LootType, number>> = {};
  lootColumns: LootType[] = [LootType.lumber, LootType.metal, LootType.hide, LootType.arrowvine, LootType.axenut, LootType.corpsecap, LootType.flamefruit, LootType.rockroot, LootType.snowthistle];;

  constructor(private dialogRef: DialogRef) { }

  ngOnInit(): void {
    this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character);
    this.lootColumns.forEach((type) => {
      this.total[type] = (gameManager.game.party.loot[type] || 0);
      if (this.characters.length > 0) {
        this.total[type] = (this.total[type] || 0) + this.characters.map((character) => character.progress.loot[type] || 0).reduce((a, b) => a + b);
      }
    })
  }

  close() {
    this.dialogRef.close();
  }
}