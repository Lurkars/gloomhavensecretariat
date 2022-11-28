import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, ElementRef, Inject, OnInit, ViewChild } from "@angular/core";
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

  constructor(@Inject(DIALOG_DATA) public deck: LootDeck, private dialogRef: DialogRef) { };

  ngOnInit(): void {
    this.currentConfig();
    setTimeout(() => {
      this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
    }, 250);
    if (this.deck.cards.length == 0) {
      this.edit = true;
      this.configuration = true;
    }

    this.dialogRef.closed.subscribe({
      next: () => {
        const close = this.deck.cards.length == 0;
        let deck = new LootDeck();
        deck.apply(this.lootDeckConfig);
        if (close && deck.cards.length > 0) {
          this.deck.apply(this.lootDeckConfig);
        }
      }
    })
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
      const count: number = this.deck.cards.filter((loot) => loot.type == type).length;
      if (count > 0) {
        this.lootDeckConfig[type] = count;
      } else {
        this.lootDeckConfig[type] = undefined;
      }
    })
  }

  applyConfig() {
    gameManager.stateManager.before('lootDeckChangeConfig');
    const close = this.deck.cards.length == 0;
    this.deck.apply(this.lootDeckConfig);
    gameManager.lootManager.shuffleDeck(this.deck);
    this.types.forEach((type) => {
      if (this.lootDeckConfig[type] == 0) {
        this.lootDeckConfig[type] = undefined;
      }
    })
    gameManager.stateManager.after();
    if (close && this.deck.cards.length > 0) {
      this.dialogRef.close();
    } else {
      this.toggleEdit();
    }
  }

  changeType(type: LootType, value: number) {
    this.lootDeckConfig[type] = (this.lootDeckConfig[type] || 0) + value;
    if (this.lootDeckConfig[type] == 0) {
      this.lootDeckConfig[type] = undefined;
    }
  }

  upcomingCards(): Loot[] {
    return this.deck.cards.filter((loot, index) => index > this.deck.current);
  }

  disgardedCards(): Loot[] {
    return this.deck.cards.filter((loot, index) => index <= this.deck.current).reverse();
  }

  shuffle(): void {
    gameManager.stateManager.before('lootDeckShuffle');
    gameManager.lootManager.shuffleDeck(this.deck);
    gameManager.stateManager.after();
  }


  dropUpcoming(event: CdkDragDrop<Loot[]>) {
    gameManager.stateManager.before('lootDeckReorder');
    if (event.container == event.previousContainer) {
      const offset = this.deck.current + 1;
      moveItemInArray(this.deck.cards, event.previousIndex + offset, event.currentIndex + offset);
    } else {
      const offset = this.deck.current;
      moveItemInArray(this.deck.cards, offset - event.previousIndex, event.currentIndex + offset);
      this.deck.current = this.deck.current - 1;
    }
    gameManager.stateManager.after();
  }

  dropDisgarded(event: CdkDragDrop<Loot[]>) {
    gameManager.stateManager.before('lootDeckReorder');
    if (event.container == event.previousContainer) {
      moveItemInArray(this.deck.cards, this.deck.current - event.previousIndex, this.deck.current - event.currentIndex);
    } else {
      this.deck.current = this.deck.current + 1;
      const offset = this.deck.current;
      moveItemInArray(this.deck.cards, event.previousIndex + offset, offset - event.currentIndex);
    }
    gameManager.stateManager.after();
  }

  remove(index: number) {
    gameManager.stateManager.before('lootDeckRemoveCard', "" + index);
    if (index <= this.deck.current) {
      this.deck.current--;
      this.current = this.deck.current;
    }
    this.deck.cards.splice(index, 1);
    gameManager.stateManager.after();
  }

  countLoot(type: LootType): number {
    return this.deck.cards.filter((loot) => {
      return loot.type == type;
    }).length;
  }

  countDrawnLoot(type: LootType): number {
    return this.deck.cards.filter((loot, index) => {
      return loot.type == type && index <= this.deck.current;
    }).length;
  }

  countUpcomingLoot(type: LootType): number {
    return this.deck.cards.filter((loot, index) => {
      return loot.type == type && index > this.deck.current;
    }).length;
  }

}

