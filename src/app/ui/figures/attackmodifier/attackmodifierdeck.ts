import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { AttackModifier, AttackModifierDeck, AttackModifierType } from 'src/app/game/model/AttackModifier';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';
import { PopupComponent } from '../../popup/popup';

@Component({
  selector: 'ghs-attackmodifier-deck',
  templateUrl: './attackmodifierdeck.html',
  styleUrls: [ './attackmodifierdeck.scss', '../../popup/popup.scss' ]
})
export class AttackModifierDeckComponent extends PopupComponent implements OnChanges {

  @Input('deck') deck!: AttackModifierDeck;
  @Input('character') character!: Character;
  @Input('numeration') numeration: string = "";
  @Input('bottom') bottom: boolean = false;
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
        if (this.character) {
          this.deck = this.character.attackModifierDeck;
        }
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes[ 'deck' ] && !changes[ 'deck' ].firstChange) {
      this.update();
    } else {
      this.currentAttackModifier = this.deck.current;
    }
  }


  click(index: number) {
    if (!this.drawing) {
      if (index > this.deck.current && gameManager.game.state == GameState.next) {
        gameManager.stateManager.before();
        gameManager.attackModifierManager.drawModifier(this.deck);
        gameManager.stateManager.after();
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
    gameManager.stateManager.before();
    gameManager.attackModifierManager.shuffleModifiers(this.deck);
    gameManager.stateManager.after();
  }

  removeDrawnDiscards() {
    gameManager.stateManager.before();
    gameManager.attackModifierManager.removeDrawnDiscards(this.deck);
    gameManager.stateManager.after();
  }

  restoreDefault(): void {
    gameManager.stateManager.before();
    if (this.character) {
      this.character.mergeAttackModifierDeck(gameManager.attackModifierManager.buildCharacterAttackModifierDeck(this.character));
      this.deck = this.character.attackModifierDeck;
    } else {
      this.deck = new AttackModifierDeck();
    }
    gameManager.stateManager.after();
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
    gameManager.stateManager.before();
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

  dropDisgarded(event: CdkDragDrop<AttackModifier[]>) {
    gameManager.stateManager.before();
    if (event.container == event.previousContainer) {
      moveItemInArray(this.deck.cards, this.deck.current - event.previousIndex, this.deck.current - event.currentIndex);
    } else {
      this.deck.current = this.deck.current + 1;
      const offset = this.deck.current;
      moveItemInArray(this.deck.cards, event.previousIndex + offset, offset - event.currentIndex);
      this.deck.cards[ offset - event.currentIndex ].revealed = true;
    }
    gameManager.stateManager.after();
  }

  remove(index: number) {
    gameManager.stateManager.before();
    if (index <= this.deck.current) {
      this.deck.current--;
      this.currentAttackModifier = this.deck.current;
    }
    this.deck.cards.splice(index, 1);
    gameManager.stateManager.after();
  }

  newFirst(type: AttackModifierType) {
    gameManager.stateManager.before();
    let attackModifier = new AttackModifier(type);
    attackModifier.revealed = true;
    this.deck.cards.splice(this.deck.current + 1, 0, attackModifier);
    gameManager.stateManager.after();
  }

  newShuffle(type: AttackModifierType) {
    gameManager.stateManager.before();
    this.deck.cards.splice(this.deck.current + 1 + Math.random() * (this.deck.cards.length - this.deck.current), 0, new AttackModifier(type));
    gameManager.stateManager.after();
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

