import { Dialog } from '@angular/cdk/dialog';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { AttackModifier, AttackModifierDeck, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { GameState } from 'src/app/game/model/Game';
import { CharacterBattleGoalsDialog } from '../battlegoal/dialog/battlegoal-dialog';
import { AttackModifierDeckDialogComponent } from './attackmodifierdeck-dialog';
import { AttackModifierDeckFullscreenComponent } from './attackmodifierdeck-fullscreen';

export class AttackModiferDeckChange {

  deck: AttackModifierDeck;
  type: string;
  values: (string | number | boolean)[];

  constructor(deck: AttackModifierDeck,
    type: string, ...values: (string | number | boolean)[]) {
    this.deck = deck;
    this.type = type;
    this.values = values;
  }

}

@Component({
  standalone: false,
  selector: 'ghs-attackmodifier-deck',
  templateUrl: './attackmodifierdeck.html',
  styleUrls: ['./attackmodifierdeck.scss']
})
export class AttackModifierDeckComponent implements OnInit, OnDestroy, OnChanges {

  @Input('deck') deck!: AttackModifierDeck;
  @Input('character') character: Character | undefined;
  @Input() ally: boolean = false;
  @Input('numeration') numeration: string = "";
  @Input('bottom') bottom: boolean = false;
  @Output('before') before: EventEmitter<AttackModiferDeckChange> = new EventEmitter<AttackModiferDeckChange>();
  @Output('after') after: EventEmitter<AttackModiferDeckChange> = new EventEmitter<AttackModiferDeckChange>();
  @ViewChild('menu') menuElement!: ElementRef;
  @Input('fullscreen') fullscreen: boolean = true;
  @Input('vertical') vertical: boolean = false;
  @Input() townGuard: boolean = false;
  @Input() battleGoals: boolean = true;
  @Input() standalone: boolean = false;
  @Input() edition!: string;
  @Input() initTimeout: number = 1500;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  GameState = GameState;
  reveal: number = 0;
  edit: boolean = false;
  maxHeight: string = "";
  characterIcon: string = "";

  AttackModifierType = AttackModifierType;
  type: AttackModifierType = AttackModifierType.minus1;
  current: number = -1;
  lastVisible: number = 0;
  drawing: boolean = false;
  drawTimeout: any = null;
  queue: number = 0;
  queueTimeout: any = null;
  newStyle: boolean = false;
  init: boolean = false;
  disabled: boolean = false;

  compact: boolean = false;
  initServer: boolean = false;

  bbCurrent: number = 0;
  bbRows: number = 0;
  activeAMs: AttackModifier[] = [];

  @ViewChild('drawCard') drawCard!: ElementRef;

  constructor(public element: ElementRef, private dialog: Dialog) {
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
    } else {
      this.battleGoals = false;
      this.characterIcon = "";
    }
    this.current = this.deck.current;
    this.lastVisible = this.deck.lastVisible;
    this.compact = !this.drawing && this.fullscreen && settingsManager.settings.automaticAttackModifierFullscreen && settingsManager.settings.portraitMode && (window.innerWidth < 800 || window.innerHeight < 400);

    if (this.deck.bb) {
      this.bbCurrent = Math.ceil((this.deck.current + 1) / 3);
      this.bbRows = Math.ceil(this.deck.cards.length / 3);
    }

    if (!this.init) {
      this.drawTimeout = setTimeout(() => {
        this.current = this.deck.current;
        this.lastVisible = this.deck.lastVisible;
        this.drawTimeout = null;
        this.init = true;
      }, !settingsManager.settings.animations ? 0 : this.initTimeout)
    }

    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: (fromServer: boolean) => { this.update(fromServer); }
    })

    if (this.edition && !this.newStyle) {
      this.newStyle = gameManager.newAmStyle(this.edition);
    }

    if (settingsManager.settings.fhStyle) {
      this.newStyle = true;
    }

    this.disabled = !this.standalone && (!this.townGuard && gameManager.game.state == GameState.draw || this.townGuard && gameManager.game.scenario != undefined);

    window.addEventListener('resize', (event) => {
      this.compact = settingsManager.settings.automaticAttackModifierFullscreen && settingsManager.settings.portraitMode && (window.innerWidth < 800 || window.innerHeight < 400);
    });

    window.addEventListener('fullscreenchange', (event) => {
      this.compact = settingsManager.settings.automaticAttackModifierFullscreen && settingsManager.settings.portraitMode && (window.innerWidth < 800 || window.innerHeight < 400);
    });
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['deck']) {
      this.update()
    }
  }

  update(fromServer: boolean = false) {
    if (this.character) {
      this.deck = this.character.attackModifierDeck;
      this.edition = this.character.edition;
      this.numeration = "" + this.character.number;
      this.characterIcon = this.character.iconUrl;
    } else {
      this.battleGoals = false;
      this.characterIcon = "";
    }
    this.disabled = !this.standalone && (!this.townGuard && gameManager.game.state == GameState.draw || this.townGuard && gameManager.game.scenario != undefined);

    if (this.character && this.deck != this.character.attackModifierDeck) {
      this.deck = this.character.attackModifierDeck;
    }

    if (this.initServer && gameManager.stateManager.wsState() != WebSocket.OPEN) {
      this.initServer = false;
    }

    if (!this.deck.active) {
      if (this.queueTimeout) {
        clearTimeout(this.queueTimeout);
        this.queueTimeout = null;
      }
      this.queue = 0;
      this.drawing = false;
      this.current = this.deck.current;
      this.lastVisible = this.deck.lastVisible;
      this.initServer = gameManager.stateManager.wsState() == WebSocket.OPEN;
    } else if (this.init && (!fromServer || this.initServer)) {
      if (this.current < this.deck.current) {
        this.queue = Math.max(0, this.deck.current - this.current);
        if (!this.queueTimeout) {
          if (this.deck.bb) {
            this.queue = 0;
            this.current = this.deck.current;
            this.lastVisible = this.deck.lastVisible;
            this.drawQueue();
          } else {
            this.queue--;
            this.current++;
            this.lastVisible = this.deck.lastVisible;
            this.drawQueue();
          }
        }
      } else if (!this.queueTimeout || this.deck.current < this.current + this.queue) {
        if (this.queueTimeout) {
          clearTimeout(this.queueTimeout);
          this.queueTimeout = null;
        }
        this.queue = 0;
        this.drawing = false;
        this.current = this.deck.current;
        this.lastVisible = this.deck.lastVisible;
      }
    } else {
      this.current = this.deck.current;
      this.lastVisible = this.deck.lastVisible;
      if (fromServer && !this.initServer) {
        this.initServer = true;
      }
    }

    if (settingsManager.settings.fhStyle) {
      this.newStyle = true;
    }

    if (this.deck.bb) {
      this.bbCurrent = Math.ceil((this.current + 1) / 3);
      this.bbRows = Math.ceil(this.deck.cards.length / 3);
    }

    this.compact = settingsManager.settings.automaticAttackModifierFullscreen && settingsManager.settings.portraitMode && (window.innerWidth < 800 || window.innerHeight < 400);

    this.activeAMs = this.deck.cards.filter((am, i) => am.active && i < this.deck.lastVisible && this.deck.discarded.indexOf(i) == -1);
  }

  drawQueue() {
    this.drawing = true;
    this.element.nativeElement.getElementsByClassName('attack-modifiers')[0].classList.add('drawing');
    this.queueTimeout = setTimeout(() => {
      this.drawing = false;
      this.queueTimeout = null;
      if (this.queue > 0) {
        this.queue--;
        this.current++;
        this.drawQueue();
      } else {
        this.element.nativeElement.getElementsByClassName('attack-modifiers')[0].classList.remove('drawing');
        if (this.queue < 0) {
          this.queue = 0;
        }
      }
    }, !settingsManager.settings.animations ? 0 : (this.vertical ? 1050 : 1850));
  }

  draw(event: any, state: 'advantage' | 'disadvantage' | undefined = undefined) {
    if (this.compact && this.fullscreen) {
      this.openFullscreen(event);
    } else if (!this.disabled) {
      if (!this.drawTimeout && this.deck.current < (this.deck.cards.length - (this.queue == 0 ? 0 : 1))) {
        this.drawTimeout = setTimeout(() => {
          this.before.emit(new AttackModiferDeckChange(this.deck, "draw" + (state ? state : '')));
          gameManager.attackModifierManager.drawModifier(this.deck, state);
          this.after.emit(new AttackModiferDeckChange(this.deck, "draw" + (state ? state : '')));
          this.drawTimeout = null;
        }, !settingsManager.settings.animations ? 0 : 150)
      } else if (!this.drawTimeout && this.deck.current >= this.deck.cards.length) {
        this.before.emit(new AttackModiferDeckChange(this.deck, "shuffle"));
        gameManager.attackModifierManager.shuffleModifiers(this.deck);
        this.after.emit(new AttackModiferDeckChange(this.deck, "shuffle"));
      }
    } else {
      this.dialog.open(AttackModifierDeckDialogComponent, {
        panelClass: ['dialog'], data: {
          deck: this.deck,
          character: this.character,
          ally: this.ally,
          numeration: this.numeration,
          newStyle: this.newStyle,
          townGuard: this.townGuard,
          before: this.before,
          after: this.after
        }
      });
    }
  }

  openFullscreen(event: any) {
    this.dialog.open(AttackModifierDeckFullscreenComponent, {
      panelClass: ['fullscreen-panel'],
      backdropClass: ['fullscreen-backdrop'],
      data: {
        deck: this.deck,
        character: this.character,
        ally: this.ally,
        numeration: this.numeration,
        newStyle: this.newStyle,
        townGuard: this.townGuard,
        before: this.before,
        after: this.after
      }
    });
    event.preventDefault();
    event.stopPropagation();
  }

  openBattleGoals(event: any): void {
    if (this.character) {
      this.dialog.open(CharacterBattleGoalsDialog, {
        panelClass: ['dialog'],
        data: { character: this.character, draw: !this.character.battleGoals || this.character.battleGoals.length == 0 }
      });
      event.preventDefault();
      event.stopPropagation();
    }
  }

  clickCard(index: number, event: any) {
    if (!this.drawing || index > this.current) {
      const am: AttackModifier = this.deck.cards[index];
      if (am.active && this.deck.discarded.indexOf(index) == -1) {
        this.before.emit(new AttackModiferDeckChange(this.deck, "discard", index));
        this.deck.discarded.push(index);
        this.after.emit(new AttackModiferDeckChange(this.deck, "discard", index));
      } else {
        this.open(event);
      }
    }
  }

  open(event: any) {
    if (gameManager.game.state == GameState.next && this.fullscreen && settingsManager.settings.automaticAttackModifierFullscreen && settingsManager.settings.portraitMode && (window.innerWidth < 800 || window.innerHeight < 400)) {
      this.openFullscreen(event);
    } else {
      this.dialog.open(AttackModifierDeckDialogComponent, {
        panelClass: ['dialog'], data: {
          deck: this.deck,
          character: this.character,
          ally: this.ally,
          numeration: this.numeration,
          newStyle: this.newStyle,
          townGuard: this.townGuard,
          before: this.before,
          after: this.after
        }
      });
      event.preventDefault();
      event.stopPropagation();
    }
  }

}
