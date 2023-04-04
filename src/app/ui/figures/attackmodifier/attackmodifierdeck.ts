import { Dialog } from '@angular/cdk/dialog';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifier, AttackModifierDeck, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
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
  @Input() ally: boolean = false;
  @Input('numeration') numeration: string = "";
  @Input('bottom') bottom: boolean = false;
  @Output('before') before: EventEmitter<AttackModiferDeckChange> = new EventEmitter<AttackModiferDeckChange>();
  @Output('after') after: EventEmitter<AttackModiferDeckChange> = new EventEmitter<AttackModiferDeckChange>();
  @ViewChild('menu') menuElement!: ElementRef;
  @Input('fullscreen') fullscreen: boolean = true;
  @Input('vertical') vertical: boolean = false;
  @Input() standalone: boolean = false;
  @Input() edition!: string;

  gameManager: GameManager = gameManager;
  GameState = GameState;
  reveal: number = 0;
  edit: boolean = false;
  maxHeight: string = "";
  characterIcon: string = "";

  AttackModifierType = AttackModifierType;
  type: AttackModifierType = AttackModifierType.minus1;
  current: number = -1;
  internalDraw: number = -99;
  drawing: boolean = false;
  drawTimeout: any = null;
  queue: number = 0;
  queueTimeout: any = null;
  newStyle: boolean = false;

  rollingIndex: number[] = [];
  rollingIndexPrev: number[] = [];
  compact: boolean = false;

  @ViewChild('drawCard') drawCard!: ElementRef;

  constructor(public element: ElementRef, private dialog: Dialog) {
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
      this.edition = this.character.edition;
      this.numeration = "" + this.character.number;
      this.characterIcon = this.character.iconUrl;
    }
    this.current = this.deck.current;
    this.internalDraw = -99;
    this.compact = !this.drawing && this.fullscreen && settingsManager.settings.automaticAttackModifierFullscreen && (window.innerWidth < 800 || window.innerHeight < 400);

    this.deck.cards.forEach((card, index) => {
      this.rollingIndex[index] = this.calcRollingIndex(index, this.current);
      this.rollingIndexPrev[index] = this.calcRollingIndex(index, this.current - 1);
    });
    gameManager.uiChange.subscribe({
      next: (fromServer: boolean) => {
        if (this.internalDraw == -99 && this.current < this.deck.current) {
          this.current = this.deck.current;
          this.internalDraw = this.deck.current;
          if (!this.queueTimeout && fromServer) {
            this.drawAnimation();
          }
        } else if (this.internalDraw != -99) {
          if (this.internalDraw < this.deck.current) {
            if (!this.queueTimeout) {
              this.current++;
              this.drawAnimation();
            } else {
              this.queue = this.queue + Math.max(0, this.deck.current - this.internalDraw);
            }
            this.internalDraw = this.deck.current;
          } else if (!this.queueTimeout || this.deck.current < this.current + this.queue) {
            if (this.queueTimeout) {
              clearTimeout(this.queueTimeout);
              this.queueTimeout = null;
            }
            this.queue = 0;
            this.drawing = false;
            this.current = this.deck.current;
            this.internalDraw = this.deck.current;
          }
        }

        if (settingsManager.settings.fhStyle) {
          this.newStyle = true;
        }

        this.deck.cards.forEach((card, index) => {
          this.rollingIndex[index] = this.calcRollingIndex(index, this.current);
          this.rollingIndexPrev[index] = this.calcRollingIndex(index, this.current - 1);
        });


        this.compact = !this.drawing && this.fullscreen && settingsManager.settings.automaticAttackModifierFullscreen && (window.innerWidth < 800 || window.innerHeight < 400);
      }
    })

    if (this.edition && !this.newStyle) {
      this.newStyle = gameManager.newAmStyle(this.edition);
    }

    if (settingsManager.settings.fhStyle) {
      this.newStyle = true;
    }

    window.addEventListener('resize', (event) => {
      this.compact = !this.drawing && this.fullscreen && settingsManager.settings.automaticAttackModifierFullscreen && (window.innerWidth < 800 || window.innerHeight < 400);
    });

    window.addEventListener('fullscreenchange', (event) => {
      this.compact = !this.drawing && this.fullscreen && settingsManager.settings.automaticAttackModifierFullscreen && (window.innerWidth < 800 || window.innerHeight < 400);
    });
  }

  drawAnimation() {
    this.drawing = true;
    this.element.nativeElement.getElementsByClassName('attack-modifiers')[0].classList.add('drawing');
    this.queueTimeout = setTimeout(() => {
      this.drawing = false;
      this.queueTimeout = null;
      if (this.queue > 0) {
        this.queue--;
        this.current++;
        this.drawAnimation();
      } else {
        this.element.nativeElement.getElementsByClassName('attack-modifiers')[0].classList.remove('drawing');
      }
    }, settingsManager.settings.disableAnimations ? 0 : 1850);
  }

  draw(event: any) {
    if (this.compact) {
      this.openFullscreen(event);
    } else if (this.standalone || gameManager.game.state == GameState.next) {
      if (!this.drawTimeout && this.deck.current < (this.deck.cards.length - (this.queue == 0 ? 0 : 1))) {
        this.drawTimeout = setTimeout(() => {
          this.before.emit(new AttackModiferDeckChange(this.deck, "draw"));
          gameManager.attackModifierManager.drawModifier(this.deck);
          this.internalDraw = this.deck.current;
          this.after.emit(new AttackModiferDeckChange(this.deck, "draw"));
          if (this.drawing && this.deck.current + this.queue < this.deck.cards.length) {
            this.queue++;
          }
          if (!this.queueTimeout) {
            this.drawAnimation();
          }
          this.drawTimeout = null;
        }, settingsManager.settings.disableAnimations ? 0 : 150)
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
        ally: this.ally,
        numeration: this.numeration,
        newStyle: this.newStyle,
        before: this.before,
        after: this.after
      }
    });
    event.preventDefault();
    event.stopPropagation();
  }

  calcRollingIndex(index: number, current: number): number {
    const am: AttackModifier = this.deck.cards[index];
    if (!am.rolling || am.active && this.deck.disgarded.indexOf(index) != -1 || current < 0) {
      return 0;
    }

    if (index == current - 2) {
      return 2;
    } else if (index < current - 2 && !am.active && this.deck.cards.slice(index, current - 1).every((attackModifier) => attackModifier.rolling)) {
      return current - index;
    } else if (index < current && am.active) {
      let rolling = 0;
      let rollingIndex = current - 2;
      while (rollingIndex > -1 && this.deck.cards[rollingIndex].rolling && !this.deck.cards[rollingIndex].active) {
        rollingIndex--;
        rolling++;
      }
      return 1 + this.deck.cards.slice(index, current - 1).filter((attackModifier) => attackModifier.active && this.deck.disgarded.indexOf(this.deck.cards.indexOf(attackModifier)) == -1).length + rolling;
    }

    return 0;
  }


  clickCard(index: number, event: any) {
    if (!this.drawing || index > this.current) {
      const am: AttackModifier = this.deck.cards[index];
      if (am.active && this.deck.disgarded.indexOf(index) == -1) {
        this.before.emit(new AttackModiferDeckChange(this.deck, "disgard", "" + index));
        this.deck.disgarded.push(index);
        this.after.emit(new AttackModiferDeckChange(this.deck, "disgard", "" + index));
      } else {
        this.open(event);
      }
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
          ally: this.ally,
          numeration: this.numeration,
          newStyle: this.newStyle,
          before: this.before,
          after: this.after
        }
      });
      event.preventDefault();
      event.stopPropagation();
    }
  }

}
