import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, ElementRef, EventEmitter, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { enhancableLootTypes, Loot, LootDeck, LootDeckConfig, LootType } from "src/app/game/model/data/Loot";
import { ghsDialogClosingHelper } from "../../helper/Static";
import { LootDeckChange } from "./loot-deck";

@Component({
  standalone: false,
  selector: 'ghs-loot-deck-dialog',
  templateUrl: './loot-deck-dialog.html',
  styleUrls: ['./loot-deck-dialog.scss',]
})
export class LootDeckDialogComponent implements OnInit, OnDestroy {

  @ViewChild('menu') menuElement!: ElementRef;
  gameManager: GameManager = gameManager;
  GameState = GameState;
  reveal: number = 0;
  edit: boolean = false;
  apply: boolean = true;
  maxHeight: string = "";

  deck: LootDeck;
  before: EventEmitter<LootDeckChange>;
  after: EventEmitter<LootDeckChange>;

  types: LootType[] = Object.values(LootType);
  lootDeckConfig: LootDeckConfig = {};
  startlootDeckConfig: LootDeckConfig = {};
  LootType = LootType;
  type: LootType = LootType.money;
  current: number = -1;
  drawing: boolean = false;
  configuration: boolean = false;
  enhancements: boolean = false;
  characters: boolean = true;

  upcomingCards: Loot[] = [];
  discardedCards: Loot[] = [];
  enhancementDeck: Loot[] = [];

  constructor(@Inject(DIALOG_DATA) public data: { deck: LootDeck, characters: boolean, before: EventEmitter<LootDeckChange>, after: EventEmitter<LootDeckChange>, apply: boolean }, public dialogRef: DialogRef) {
    this.deck = data.deck;
    this.characters = data.characters;
    this.before = data.before;
    this.after = data.after;
    this.apply = data.apply;
  };

  ngOnInit(): void {
    this.currentConfig();
    setTimeout(() => {
      this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
    }, !settingsManager.settings.animations ? 0 : 250);
    if (this.deck.cards.length == 0) {
      this.edit = true;
      this.configuration = true;
    }

    if (!gameManager.game.scenario) {
      this.enhancements = true;
      this.configuration = false;
    }

    this.dialogRef.closed.subscribe({
      next: () => {
        let deck = new LootDeck();
        if (JSON.stringify(this.startlootDeckConfig) != JSON.stringify(this.lootDeckConfig)) {
          gameManager.lootManager.apply(deck, this.lootDeckConfig);
          this.applyConfig();
        }
      }
    })

    this.enhancementDeck = gameManager.lootManager.fullLootDeck().filter((loot) => enhancableLootTypes.indexOf(loot.type) != -1).sort((a, b) => a.cardId - b.cardId);
    this.update();
    this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() });
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  update() {
    this.upcomingCards = this.deck.cards.filter((loot, index) => index > this.deck.current);
    this.discardedCards = this.deck.cards.filter((loot, index) => index <= this.deck.current).reverse();
  }

  enhanceCard(loot: Loot) {
    this.before.emit(new LootDeckChange(this.deck, 'lootDeckAddEnhancement', loot.type, gameManager.lootManager.valueLabel(loot)));
    loot.enhancements++;
    gameManager.game.lootDeckEnhancements = this.enhancementDeck.filter((loot) => loot.enhancements > 0);
    this.after.emit(new LootDeckChange(this.deck, 'lootDeckAddEnhancement', loot.type, gameManager.lootManager.valueLabel(loot)));
    this.update();
  }

  unenhanceCard(loot: Loot) {
    if (loot.enhancements > 0) {
      this.before.emit(new LootDeckChange(this.deck, 'lootDeckRemoveEnhancement', loot.type, gameManager.lootManager.valueLabel(loot)));
      loot.enhancements--;
      gameManager.game.lootDeckEnhancements = this.enhancementDeck.filter((loot) => loot.enhancements > 0);
      this.after.emit(new LootDeckChange(this.deck, 'lootDeckRemoveEnhancement', loot.type, gameManager.lootManager.valueLabel(loot)));
    }
    this.update();
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

  toggleEnhancements() {
    this.enhancements = !this.enhancements;
    this.edit = false;
    this.configuration = false;
    if (!this.enhancements && this.deck.cards.length == 0) {
      this.edit = true;
      this.configuration = true;
    }
  }

  toggleSpecial(lootType: LootType) {
    const index = gameManager.game.lootDeckFixed.indexOf(lootType);
    const config = this.deck.cards.length != 0;
    this.before.emit(new LootDeckChange(this.deck, 'lootDeckChangeConfig'));
    if (index == -1) {
      gameManager.game.lootDeckFixed.push(lootType);
      if (config) {
        this.lootDeckConfig[lootType] = 1;
      }
    } else {
      gameManager.game.lootDeckFixed.splice(index, 1);
      if (config) {
        this.lootDeckConfig[lootType] = 0;
      }
    }
    this.after.emit(new LootDeckChange(this.deck, 'lootDeckChangeConfig'));
    this.update();
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

    this.startlootDeckConfig = JSON.parse(JSON.stringify(this.lootDeckConfig));
  }

  applyConfig() {
    const empty = this.deck.cards.length == 0;
    if (Object.values(this.lootDeckConfig).reduce((a, b) => (a || 0) + (b || 0)) > 0 || !empty) {
      this.before.emit(new LootDeckChange(this.deck, 'lootDeckChangeConfig'));
      gameManager.lootManager.apply(this.deck, this.lootDeckConfig);
      gameManager.lootManager.shuffleDeck(this.deck);
      this.types.forEach((type) => {
        if (this.lootDeckConfig[type] == 0) {
          this.lootDeckConfig[type] = undefined;
        }
      })
      this.after.emit(new LootDeckChange(this.deck, 'lootDeckChangeConfig'));
      if (this.deck.cards.length > 0) {
        if (empty) {
          ghsDialogClosingHelper(this.dialogRef);
        } else {
          this.toggleEdit();
        }
      }
    }
    this.update();
  }

  changeType(type: LootType, value: number) {
    this.lootDeckConfig[type] = (this.lootDeckConfig[type] || 0) + value;
    if (this.lootDeckConfig[type] == 0) {
      this.lootDeckConfig[type] = undefined;
    }
    this.update();
  }

  shuffle(upcoming: boolean = false): void {
    this.before.emit(new LootDeckChange(this.deck, 'lootDeckShuffle' + (upcoming ? "Upcoming" : "")));
    gameManager.lootManager.shuffleDeck(this.deck, upcoming);
    gameManager.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        figure.lootCards = figure.lootCards.filter((number) => number <= this.deck.current);
      }
    })
    this.after.emit(new LootDeckChange(this.deck, 'lootDeckShuffle' + (upcoming ? "Upcoming" : "")));
    this.update();
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
    this.update();
  }

  dropDiscarded(event: CdkDragDrop<Loot[]>) {
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
    this.update();
  }

  remove(index: number) {
    this.before.emit(new LootDeckChange(this.deck, 'lootDeckRemoveCard', index));
    if (index <= this.deck.current) {
      this.deck.current--;
      this.current = this.deck.current;
    }
    this.deck.cards.splice(index, 1);
    this.after.emit(new LootDeckChange(this.deck, 'lootDeckRemoveCard', index));
    this.update();
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

