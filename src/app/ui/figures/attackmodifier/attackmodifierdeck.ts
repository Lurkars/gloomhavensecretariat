import { Dialog } from '@angular/cdk/dialog';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { AttackModifierDeck, AttackModifierType } from 'src/app/game/model/AttackModifier';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';
import { AttackModifierDeckDialogComponent } from './attackmodifierdeck-dialog';
import { AttackModifierDeckFullscreenComponent } from './attackmodifierdeck-fullscreen';

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
  styleUrls: ['./attackmodifierdeck.scss']
})
export class AttackModifierDeckComponent implements OnInit {

  @Input('deck') deck!: AttackModifierDeck;
  @Input('character') character!: Character;
  @Input('numeration') numeration: string = "";
  @Input('bottom') bottom: boolean = false;
  @Output('before') before: EventEmitter<AttackModiferDeckChange> = new EventEmitter<AttackModiferDeckChange>();
  @Output('after') after: EventEmitter<AttackModiferDeckChange> = new EventEmitter<AttackModiferDeckChange>();
  @ViewChild('menu') menuElement!: ElementRef;
  @Input('fullscreen') fullscreen: boolean = true;
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


  constructor(private element: ElementRef, private dialog: Dialog) {
    this.deck = new AttackModifierDeck();
    this.element.nativeElement.addEventListener('click', (event: any) => {
      let elements = document.elementsFromPoint(event.clientX, event.clientY);
      if (elements[0].classList.contains('attack-modifiers') && elements.length > 2) {
        (elements[2] as HTMLElement).click();
      }
    })
  };

  ngOnInit(): void {
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
      this.element.nativeElement.getElementsByClassName('attack-modifiers')[0].classList.add('drawing');
      setTimeout(() => {
        this.element.nativeElement.getElementsByClassName('attack-modifiers')[0].classList.remove('drawing');
        this.drawing = false;
      }, 1100);
    }
  }

  draw() {
    if (!this.drawing && gameManager.game.state == GameState.next) {
      this.before.emit(new AttackModiferDeckChange(this.deck, "draw"));
      gameManager.attackModifierManager.drawModifier(this.deck);
      this.after.emit(new AttackModiferDeckChange(this.deck, "draw"));
    }
  }

  openFullscreen(event: any) {
    this.dialog.open(AttackModifierDeckFullscreenComponent, {
      backdropClass: 'fullscreen-backdrop',
      data: {
        deck: this.deck,
        character: this.character,
        numeration: this.numeration,
        before: this.before,
        after: this.after
      }
    });
    event.preventDefault();
    event.stopPropagation();
  }

  rollingIndex(index: number): number {
    if (!this.deck.cards[index].rolling) {
      return 0;
    }

    if (index == this.currentAttackModifier - 2) {
      return 2;
    } else if (index < this.currentAttackModifier - 2 && this.deck.cards.slice(index, this.currentAttackModifier - 1).every((attackModifier) => attackModifier.rolling)) {
      return this.currentAttackModifier - index;
    }

    return 0;
  }


  open(event : any) {
    this.dialog.open(AttackModifierDeckDialogComponent, {
      panelClass: 'dialog', data: {
        deck: this.deck,
        character: this.character,
        numeration: this.numeration,
        before: this.before,
        after: this.after
      }
    });
    event.preventDefault();
    event.stopPropagation();
  }

}
