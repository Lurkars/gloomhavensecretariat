import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, ElementRef, EventEmitter, Inject, OnInit, ViewChild } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { enhancableLootTypes, Loot, LootDeck, LootDeckConfig, LootType } from "src/app/game/model/Loot";
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
  characters: boolean = true;

  enhancementDeck: Loot[] = [];

  constructor(@Inject(DIALOG_DATA) public data: { deck: LootDeck, characters: boolean, before: EventEmitter<LootDeckChange>, after: EventEmitter<LootDeckChange> }, public dialogRef: DialogRef) {
    this.deck = data.deck;
    this.characters = data.characters;
    this.before = data.before;
    this.after = data.after;
  };

  ngOnInit(): void {
    this.currentConfig();
    setTimeout(() => {
      this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
    }, settingsManager.settings.disableAnimations ? 0 : 250);
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

    this.enhancementDeck = gameManager.lootManager.fullLootDeck().filter((loot) => enhancableLootTypes.indexOf(loot.type) != -1).sort((a, b) => a.cardId - b.cardId);
  }

  enhanceCard(loot: Loot) {
    this.before.emit(new LootDeckChange(this.deck, 'lootDeckAddEnhancement', loot.type, gameManager.lootManager.valueLabel(loot)));
    loot.enhancements++;
    gameManager.game.lootDeckEnhancements = this.enhancementDeck.filter((loot) => loot.enhancements > 0);
    this.after.emit(new LootDeckChange(this.deck, 'lootDeckAddEnhancement', loot.type, gameManager.lootManager.valueLabel(loot)));
  }

  unenhanceCard(loot: Loot) {
    if (loot.enhancements > 0) {
      this.before.emit(new LootDeckChange(this.deck, 'lootDeckRemoveEnhancement', loot.type, gameManager.lootManager.valueLabel(loot)));
      loot.enhancements--;
      gameManager.game.lootDeckEnhancements = this.enhancementDeck.filter((loot) => loot.enhancements > 0);
      this.after.emit(new LootDeckChange(this.deck, 'lootDeckRemoveEnhancement', loot.type, gameManager.lootManager.valueLabel(loot)));
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
    gameManager.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        figure.lootCards = [];
      }
    })
    this.after.emit(new LootDeckChange(this.deck, 'lootDeckShuffle'));
  }


  dropUpcoming(event: CdkDragDrop<Loot[]>) {
    this.before.emit(new LootDeckChange(this.deck, 'lootDeckReorder'));
    let offset = 0;
    let prev = 0;
    let cur = 0;
    if (event.container == event.previousContainer) {
      offset = this.deck.current + 1;
      prev = event.previousIndex + offset;
      cur = event.currentIndex + offset;
      moveItemInArray(this.deck.cards, prev, cur);
    } else {
      offset = this.deck.current;
      prev = offset - event.previousIndex;
      cur = event.currentIndex + offset;
      moveItemInArray(this.deck.cards, prev, cur);
      this.deck.current = this.deck.current - 1;
    }

    gameManager.game.figures.forEach((figure) => {
      if (figure instanceof Character && figure.lootCards) {
        figure.lootCards = figure.lootCards.map((index) => {
          if (prev < cur && index > prev && index <= cur) {
            index--;
          } else if (prev > cur && index >= cur && index < prev) {
            index++;
          } else if (index == prev) {
            index = cur;
          }
          return index;
        }).sort((a, b) => a - b);
      }
    })

    gameManager.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        figure.lootCards = figure.lootCards.filter((value) => value <= this.deck.current);
      }
    })

    this.after.emit(new LootDeckChange(this.deck, 'lootDeckReorder'));
  }

  dropDisgarded(event: CdkDragDrop<Loot[]>) {
    this.before.emit(new LootDeckChange(this.deck, 'lootDeckReorder'));
    let offset = 0;
    let prev = 0;
    let cur = 0;
    if (event.container == event.previousContainer) {
      offset = this.deck.current;
      prev = offset - event.previousIndex;
      cur = offset - event.currentIndex;
      moveItemInArray(this.deck.cards, prev, cur);
    } else {
      this.deck.current = this.deck.current + 1;
      offset = this.deck.current;
      prev = offset + event.previousIndex;
      cur = offset - event.currentIndex;
      moveItemInArray(this.deck.cards, prev, cur);
    }

    gameManager.game.figures.forEach((figure) => {
      if (figure instanceof Character && figure.lootCards) {
        figure.lootCards = figure.lootCards.map((index) => {
          if (prev < cur && index > prev && index <= cur) {
            index--;
          } else if (prev > cur && index >= cur && index < prev) {
            index++;
          } else if (index == prev) {
            index = cur;
          }
          return index;
        }).sort((a, b) => a - b);
      }
    })
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

  getCharacter(index: number): string {
    if (this.characters) {
      const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.lootCards && figure.lootCards.indexOf(index) != -1);
      if (character) {
        return character.name;
      }
    }
    return "";
  }

}

