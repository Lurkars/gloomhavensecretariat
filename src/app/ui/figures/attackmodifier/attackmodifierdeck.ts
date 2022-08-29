import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { AttackModifier, AttackModifierDeck, AttackModifierType } from 'src/app/game/model/AttackModifier';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';
import { PopupComponent } from '../../popup/popup';

export class AttackModiferDeckChange {

  deck: AttackModifierDeck;
  type: string;
  values: string[];

  constructor(deck: AttackModifierDeck,
    type: string, ...values: string[]) {
    this.deck = deck;
    this.type = type;
    this.values = values;
  }

}


@Component({
  selector: 'ghs-attackmodifier-deck',
  templateUrl: './attackmodifierdeck.html',
  styleUrls: [ './attackmodifierdeck.scss', '../../popup/popup.scss' ]
})
export class AttackModifierDeckComponent extends PopupComponent {

  @Input('deck') deck!: AttackModifierDeck;
  @Input('character') character!: Character;
  @Input('numeration') numeration: string = "";
  @Input('bottom') bottom: boolean = false;
  @Output('before') before: EventEmitter<AttackModiferDeckChange> = new EventEmitter<AttackModiferDeckChange>();
  @Output('after') after: EventEmitter<AttackModiferDeckChange> = new EventEmitter<AttackModiferDeckChange>();
  @ViewChild('menu') menuElement!: ElementRef;
  gameManager: GameManager = gameManager;
  GameState = GameState;
  reveal: number = 0;
  edit: boolean = false;
  maxHeight: string = "";
  characterIcon: string = "";

  AttackModifierType = AttackModifierType;
  type: AttackModifierType = AttackModifierType.minus1;
  currentAttackModifier: number = -1;
  drawing: boolean = false;


  constructor(private element: ElementRef) {
    super();
    this.deck = new AttackModifierDeck();
  };

  override ngOnInit(): void {
    super.ngOnInit();
    if (this.character) {
      this.deck = this.character.attackModifierDeck;
      this.numeration = "" + this.character.number;
      this.characterIcon = gameManager.characterManager.characterIcon(this.character);
      this.update();
    }
    gameManager.uiChange.subscribe({
      next: () => {
        this.update();
      }
    })
  }

  update() {
    if (this.currentAttackModifier != this.deck.current) {
      this.currentAttackModifier = this.deck.current;
      this.drawing = true;
      this.element.nativeElement.getElementsByClassName('attack-modifiers')[ 0 ].classList.add('drawing');
      setTimeout(() => {
        this.element.nativeElement.getElementsByClassName('attack-modifiers')[ 0 ].classList.remove('drawing');
        this.drawing = false;
      }, 1100);
    }
  }

  click(index: number) {
    if (!this.drawing) {
      if (index > this.deck.current && gameManager.game.state == GameState.next) {
        this.before.emit(new AttackModiferDeckChange(this.deck, "draw"));
        gameManager.attackModifierManager.drawModifier(this.deck);
        this.after.emit(new AttackModiferDeckChange(this.deck, "draw"));
      } else {
        this.open();
      }
    }
  }

  toggleEdit() {
    this.edit = !this.edit;
    setTimeout(() => {
      this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
    }, 0);
  }

  upcomingCards(): AttackModifier[] {
    return this.deck.cards.filter((attackModifier, index) => index > this.deck.current);
  }

  disgardedCards(): AttackModifier[] {
    return this.deck.cards.filter((AttackModifier, index) => index <= this.deck.current).reverse();
  }

  rollingIndex(index: number): number {
    if (!this.deck.cards[ index ].rolling) {
      return 0;
    }

    if (index == this.currentAttackModifier - 2) {
      return 2;
    } else if (index < this.currentAttackModifier - 2 && this.deck.cards.slice(index, this.currentAttackModifier - 1).every((attackModifier) => attackModifier.rolling)) {
      return this.currentAttackModifier - index;
    }

    return 0;
  }

  shuffle(): void {
    this.before.emit(new AttackModiferDeckChange(this.deck, "shuffle"));
    gameManager.attackModifierManager.shuffleModifiers(this.deck);
    this.after.emit(new AttackModiferDeckChange(this.deck, "shuffle"));
  }

  removeDrawnDiscards() {
    this.before.emit(new AttackModiferDeckChange(this.deck, "removeDrawnDiscards"));
    gameManager.attackModifierManager.removeDrawnDiscards(this.deck);
    this.after.emit(new AttackModiferDeckChange(this.deck, "removeDrawnDiscards"));
  }

  restoreDefault(): void {
    this.before.emit(new AttackModiferDeckChange(this.deck, "restoreDefault"));
    if (this.character) {
      this.character.mergeAttackModifierDeck(gameManager.attackModifierManager.buildCharacterAttackModifierDeck(this.character));
      this.deck.fromModel(this.character.attackModifierDeck.toModel());
    } else {
      this.deck = new AttackModifierDeck();
    }
    this.after.emit(new AttackModiferDeckChange(this.deck, "restoreDefault"));
  }

  hasDrawnDiscards(): boolean {
    return this.deck.cards.some(
      (attackModifier: AttackModifier, index: number) =>
        index <= this.deck.current &&
        (attackModifier.type == AttackModifierType.bless ||
          attackModifier.type == AttackModifierType.curse)
    );
  }

  dropUpcoming(event: CdkDragDrop<AttackModifier[]>) {
    this.before.emit(new AttackModiferDeckChange(this.deck, "reorder"));
    if (event.container == event.previousContainer) {
      const offset = this.deck.current + 1;
      moveItemInArray(this.deck.cards, event.previousIndex + offset, event.currentIndex + offset);
    } else {
      const offset = this.deck.current;
      moveItemInArray(this.deck.cards, offset - event.previousIndex, event.currentIndex + offset);
      this.deck.current = this.deck.current - 1;
    }
    this.after.emit(new AttackModiferDeckChange(this.deck, "reorder"));
  }

  dropDisgarded(event: CdkDragDrop<AttackModifier[]>) {
    this.before.emit(new AttackModiferDeckChange(this.deck, "reorder"));
    if (event.container == event.previousContainer) {
      moveItemInArray(this.deck.cards, this.deck.current - event.previousIndex, this.deck.current - event.currentIndex);
    } else {
      this.deck.current = this.deck.current + 1;
      const offset = this.deck.current;
      moveItemInArray(this.deck.cards, event.previousIndex + offset, offset - event.currentIndex);
      this.deck.cards[ offset - event.currentIndex ].revealed = true;
    }
    this.after.emit(new AttackModiferDeckChange(this.deck, "reorder"));
  }

  remove(index: number) {
    this.before.emit(new AttackModiferDeckChange(this.deck, "removeCard", "" + index));
    if (index <= this.deck.current) {
      this.deck.current--;
      this.currentAttackModifier = this.deck.current;
    }
    this.deck.cards.splice(index, 1);
    this.after.emit(new AttackModiferDeckChange(this.deck, "removeCard", "" + index));
  }

  newFirst(type: AttackModifierType) {
    this.before.emit(new AttackModiferDeckChange(this.deck, "addCard", "game.attackModifier." + type));
    let attackModifier = new AttackModifier(type);
    attackModifier.revealed = true;
    this.deck.cards.splice(this.deck.current + 1, 0, attackModifier);
    this.after.emit(new AttackModiferDeckChange(this.deck, "addCard", "game.attackModifier." + type));
  }

  newShuffle(type: AttackModifierType) {
    this.before.emit(new AttackModiferDeckChange(this.deck, "addCardShuffled", "game.attackModifier." + type));
    this.deck.cards.splice(this.deck.current + 1 + Math.random() * (this.deck.cards.length - this.deck.current), 0, new AttackModifier(type));
    this.after.emit(new AttackModiferDeckChange(this.deck, "addCardShuffled", "game.attackModifier." + type));
  }

  onChange(attackModifier: AttackModifier, revealed: boolean) {
    attackModifier.revealed = revealed;
  }

  changeType(prev: boolean = false) {
    let index = Object.values(AttackModifierType).indexOf(this.type) + (prev ? -1 : 1);
    if (index < 0) {
      index = Object.values(AttackModifierType).length - 1;
    } else if (index >= Object.values(AttackModifierType).length) {
      index = 0;
    }

    this.type = Object.values(AttackModifierType)[ index ];

    if ([ AttackModifierType.invalid, AttackModifierType.plus3, AttackModifierType.plus4 ].indexOf(this.type) != -1) {
      this.changeType(prev);
    }
  }

  override open(): void {
    super.open();
    this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
  }

  override close(): void {
    super.close();
    this.reveal = 0;
    this.deck.cards.forEach((am) => am.revealed = false);
    this.edit = false;
    this.type = AttackModifierType.minus1;
  }

}

