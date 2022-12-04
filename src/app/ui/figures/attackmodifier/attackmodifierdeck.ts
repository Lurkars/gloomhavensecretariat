import { Dialog } from '@angular/cdk/dialog';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
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
  @Input('vertical') vertical: boolean = false;
  @Input() standalone: boolean = false;

  gameManager: GameManager = gameManager;
  GameState = GameState;
  reveal: number = 0;
  edit: boolean = false;
  maxHeight: string = "";
  characterIcon: string = "";

  AttackModifierType = AttackModifierType;
  type: AttackModifierType = AttackModifierType.minus1;
  current: number = -1;
  drawing: boolean = false;
  drawTimeout: any = null;
  queue: number = 0;
  queueTimeout: any = null;

  @ViewChild('drawCard') drawCard!: ElementRef;

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
    this.current = this.deck.current;
    gameManager.uiChange.subscribe({
      next: () => {
        if (!this.queueTimeout || this.deck.current < this.current + this.queue) {
          if (this.queueTimeout) {
            clearTimeout(this.queueTimeout);
            this.queueTimeout = null;
          }
          this.queue = 0;
          this.drawing = false;
          this.current = this.deck.current;
        }
      }
    })
  }

  update() {
    this.drawing = true;
    this.element.nativeElement.getElementsByClassName('attack-modifiers')[0].classList.add('drawing');
    this.queueTimeout = setTimeout(() => {
      this.element.nativeElement.getElementsByClassName('attack-modifiers')[0].classList.remove('drawing');
      this.drawing = false;
      this.queueTimeout = null;
      if (this.queue > 0) {
        this.queue--;
        this.current++;
        this.update();
      }
    }, 1850);
  }

  draw(event: any) {
    if (!this.drawing && this.fullscreen && settingsManager.settings.automaticAttackModifierFullscreen && (window.innerWidth < 800 || window.innerHeight < 400)) {
      this.openFullscreen(event);
    } else if (this.standalone || gameManager.game.state == GameState.next) {
      if (!this.drawTimeout && this.deck.current + this.queue <= this.deck.cards.length - 1) {
        this.drawTimeout = setTimeout(() => {
          this.before.emit(new AttackModiferDeckChange(this.deck, "draw"));
          gameManager.attackModifierManager.drawModifier(this.deck);
          this.after.emit(new AttackModiferDeckChange(this.deck, "draw"));
          if (this.drawing) {
            this.queue++;
          }
          if (!this.queueTimeout) {
            this.update();
          }
          this.drawTimeout = null;
        }, 150)
      }
    } else if (!this.drawing) {
      this.open(event);
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

    if (index == this.current - 2) {
      return 2;
    } else if (index < this.current - 2 && this.deck.cards.slice(index, this.current - 1).every((attackModifier) => attackModifier.rolling)) {
      return this.current - index;
    }

    return 0;
  }


  clickCard(index: number, event: any) {
    if (!this.drawing || index > this.current) {
      this.open(event);
    }
  }

  open(event: any) {
    if (gameManager.game.state == GameState.next && this.fullscreen && settingsManager.settings.automaticAttackModifierFullscreen && (window.innerWidth < 800 || window.innerHeight < 400)) {
      this.openFullscreen(event);
    } else {
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

}
