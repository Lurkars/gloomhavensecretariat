import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, ElementRef, EventEmitter, Inject, OnInit, ViewChild } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { GameState } from "src/app/game/model/Game";
import { enhancableLootTypes, fullLootDeck, Loot, LootDeck, LootDeckConfig, LootType } from "src/app/game/model/Loot";
import { LootDeckChange } from "./loot-deck";

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

  deck: LootDeck;
  before: EventEmitter<LootDeckChange>;
  after: EventEmitter<LootDeckChange>;

  types: LootType[] = Object.values(LootType);
  lootDeckConfig: LootDeckConfig = {};
  LootType = LootType;
  type: LootType = LootType.money;
  current: number = -1;
  drawing: boolean = false;
  configuration: boolean = false;
  enhancements: boolean = false;

  enhancementDeck: Loot[] = [];

  constructor(@Inject(DIALOG_DATA) public data: { deck: LootDeck, before: EventEmitter<LootDeckChange>, after: EventEmitter<LootDeckChange> }, private dialogRef: DialogRef) {
    this.deck = data.deck;
    this.before = data.before;
    this.after = data.after;
  };

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
        gameManager.lootManager.apply(deck, this.lootDeckConfig);
        if (close && deck.cards.length > 0) {
          this.applyConfig();
        }
      }
    })

    this.enhancementDeck = gameManager.lootManager.fullLootDeck().filter((loot) => enhancableLootTypes.indexOf(loot.type) != -1);
  }

  enhanceCard(loot: Loot) {
    this.before.emit(new LootDeckChange(this.deck, 'lootDeckAddEnhancement', loot.type, loot.value));
    loot.enhancements++;
    gameManager.game.lootDeckEnhancements = this.enhancementDeck.filter((loot) => loot.enhancements > 0);
    this.after.emit(new LootDeckChange(this.deck, 'lootDeckAddEnhancement', loot.type, loot.value));
  }

  unenhanceCard(loot: Loot) {
    if (loot.enhancements > 0) {
      this.before.emit(new LootDeckChange(this.deck, 'lootDeckRemoveEnhancement', loot.type, loot.value));
      loot.enhancements--;
      gameManager.game.lootDeckEnhancements = this.enhancementDeck.filter((loot) => loot.enhancements > 0);
      this.after.emit(new LootDeckChange(this.deck, 'lootDeckRemoveEnhancement', loot.type, loot.value));
    }
  }

  toggleEdit() {
    this.edit = !this.edit;
    if (!this.edit) {
      this.configuration = false;
      this.enhancements = false;
    }
    setTimeout(() => {
      this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
    }, 0);
  }

  maxValue(type: LootType): number {
    return gameManager.lootManager.fullLootDeck().filter((loot) => loot.type == type).length;
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
    this.before.emit(new LootDeckChange(this.deck, 'lootDeckChangeConfig'));
    const close = this.deck.cards.length == 0;
    gameManager.lootManager.apply(this.deck, this.lootDeckConfig);
    gameManager.lootManager.shuffleDeck(this.deck);
    this.types.forEach((type) => {
      if (this.lootDeckConfig[type] == 0) {
        this.lootDeckConfig[type] = undefined;
      }
    })
    this.after.emit(new LootDeckChange(this.deck, 'lootDeckChangeConfig'));
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
    this.before.emit(new LootDeckChange(this.deck, 'lootDeckShuffle'));
    gameManager.lootManager.shuffleDeck(this.deck);
    this.after.emit(new LootDeckChange(this.deck, 'lootDeckShuffle'));
  }


  dropUpcoming(event: CdkDragDrop<Loot[]>) {
    this.before.emit(new LootDeckChange(this.deck, 'lootDeckReorder'));
    if (event.container == event.previousContainer) {
      const offset = this.deck.current + 1;
      moveItemInArray(this.deck.cards, event.previousIndex + offset, event.currentIndex + offset);
    } else {
      const offset = this.deck.current;
      moveItemInArray(this.deck.cards, offset - event.previousIndex, event.currentIndex + offset);
      this.deck.current = this.deck.current - 1;
    }
    this.after.emit(new LootDeckChange(this.deck, 'lootDeckReorder'));
  }

  dropDisgarded(event: CdkDragDrop<Loot[]>) {
    this.before.emit(new LootDeckChange(this.deck, 'lootDeckReorder'));
    if (event.container == event.previousContainer) {
      moveItemInArray(this.deck.cards, this.deck.current - event.previousIndex, this.deck.current - event.currentIndex);
    } else {
      this.deck.current = this.deck.current + 1;
      const offset = this.deck.current;
      moveItemInArray(this.deck.cards, event.previousIndex + offset, offset - event.currentIndex);
    }
    this.after.emit(new LootDeckChange(this.deck, 'lootDeckReorder'));
  }

  remove(index: number) {
    this.before.emit(new LootDeckChange(this.deck, 'lootDeckRemoveCard', "" + index));
    if (index <= this.deck.current) {
      this.deck.current--;
      this.current = this.deck.current;
    }
    this.deck.cards.splice(index, 1);
    this.after.emit(new LootDeckChange(this.deck, 'lootDeckRemoveCard', "" + index));
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

