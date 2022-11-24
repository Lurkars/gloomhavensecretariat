import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { GameState } from "src/app/game/model/Game";
import { fullLootDeck, Loot, LootDeck, LootDeckConfig, LootType } from "src/app/game/model/Loot";

@Component({
  selector: 'ghs-loot-deck-dialog',
  templateUrl: './loot-deck-dialog.html',
  styleUrls: ['./loot-deck-dialog.scss',]
})
export class LootDeckDialogComponent implements OnInit {


  @ViewChild('menu') menuElement!: ElementRef;
  gameManager: GameManager = gameManager;
  GameState = GameState;
  reveal: number = 0;
  edit: boolean = false;
  maxHeight: string = "";

  types: LootType[] = Object.values(LootType);
  lootDeckConfig: LootDeckConfig = {};
  LootType = LootType;
  type: LootType = LootType.money;
  current: number = -1;
  drawing: boolean = false;
  configuration: boolean = false;


  constructor() { };

  ngOnInit(): void {
    this.currentConfig();
    setTimeout(() => {
      this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
    }, 250);
    if (gameManager.game.lootDeck.cards.length == 0) {
      this.edit = true;
      this.configuration = true;
    }
  }

  toggleEdit() {
    this.edit = !this.edit;
    if (!this.edit) {
      this.configuration = false;
    }
    setTimeout(() => {
      this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
    }, 0);
  }

  maxValue(type: LootType): number {
    return fullLootDeck.filter((loot) => loot.type == type).length;
  }

  currentConfig() {
    this.types.forEach((type) => {
      const count: number = gameManager.game.lootDeck.cards.filter((loot) => loot.type == type).length;
      if (count > 0) {
        this.lootDeckConfig[type] = count;
      } else {
        this.lootDeckConfig[type] = undefined;
      }
    })
  }

  applyConfig() {
    gameManager.stateManager.before('lootDeckChangeConfig');
    const active = gameManager.game.lootDeck.active;
    gameManager.game.lootDeck = new LootDeck(this.lootDeckConfig);
    gameManager.game.lootDeck.active = active;
    gameManager.lootManager.shuffleDeck();
    this.types.forEach((type) => {
      if (this.lootDeckConfig[type] == 0) {
        this.lootDeckConfig[type] = undefined;
      }
    })
    gameManager.stateManager.after();
    this.toggleEdit();
  }

  changeType(type: LootType, value: number) {
    this.lootDeckConfig[type] = (this.lootDeckConfig[type] || 0) + value;
    if (this.lootDeckConfig[type] == 0) {
      this.lootDeckConfig[type] = undefined;
    }
  }

  upcomingCards(): Loot[] {
    return gameManager.game.lootDeck.cards.filter((loot, index) => index > gameManager.game.lootDeck.current);
  }

  disgardedCards(): Loot[] {
    return gameManager.game.lootDeck.cards.filter((loot, index) => index <= gameManager.game.lootDeck.current).reverse();
  }

  shuffle(): void {
    gameManager.stateManager.before('lootDeckShuffle');
    gameManager.lootManager.shuffleDeck();
    gameManager.stateManager.after();
  }


  dropUpcoming(event: CdkDragDrop<Loot[]>) {
    gameManager.stateManager.before('lootDeckReorder');
    if (event.container == event.previousContainer) {
      const offset = gameManager.game.lootDeck.current + 1;
      moveItemInArray(gameManager.game.lootDeck.cards, event.previousIndex + offset, event.currentIndex + offset);
    } else {
      const offset = gameManager.game.lootDeck.current;
      moveItemInArray(gameManager.game.lootDeck.cards, offset - event.previousIndex, event.currentIndex + offset);
      gameManager.game.lootDeck.current = gameManager.game.lootDeck.current - 1;
    }
    gameManager.stateManager.after();
  }

  dropDisgarded(event: CdkDragDrop<Loot[]>) {
    gameManager.stateManager.before('lootDeckReorder');
    if (event.container == event.previousContainer) {
      moveItemInArray(gameManager.game.lootDeck.cards, gameManager.game.lootDeck.current - event.previousIndex, gameManager.game.lootDeck.current - event.currentIndex);
    } else {
      gameManager.game.lootDeck.current = gameManager.game.lootDeck.current + 1;
      const offset = gameManager.game.lootDeck.current;
      moveItemInArray(gameManager.game.lootDeck.cards, event.previousIndex + offset, offset - event.currentIndex);
    }
    gameManager.stateManager.after();
  }

  remove(index: number) {
    gameManager.stateManager.before('lootDeckRemoveCard', "" + index);
    if (index <= gameManager.game.lootDeck.current) {
      gameManager.game.lootDeck.current--;
      this.current = gameManager.game.lootDeck.current;
    }
    gameManager.game.lootDeck.cards.splice(index, 1);
    gameManager.stateManager.after();
  }

  countLoot(type: LootType): number {
    return gameManager.game.lootDeck.cards.filter((loot) => {
      return loot.type == type;
    }).length;
  }

  countDrawnLoot(type: LootType): number {
    return gameManager.game.lootDeck.cards.filter((loot, index) => {
      return loot.type == type && index <= gameManager.game.lootDeck.current;
    }).length;
  }

  countUpcomingLoot(type: LootType): number {
    return gameManager.game.lootDeck.cards.filter((loot, index) => {
      return loot.type == type && index > gameManager.game.lootDeck.current;
    }).length;
  }

}

