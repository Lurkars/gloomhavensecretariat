import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, inject, input, OnChanges, OnInit, output, SimpleChanges } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { AttackModifier, AttackModifierDeck, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { GameState } from 'src/app/game/model/Game';
import { AttackModifierComponent } from 'src/app/ui/figures/attackmodifier/attackmodifier';
import { AttackModifierDeckDialogComponent } from 'src/app/ui/figures/attackmodifier/attackmodifierdeck-dialog';
import { AttackModifierDeckFullscreenComponent } from 'src/app/ui/figures/attackmodifier/attackmodifierdeck-fullscreen';
import { CharacterBattleGoalsDialog } from 'src/app/ui/figures/battlegoal/dialog/battlegoal-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

export class AttackModiferDeckChange {
  deck: AttackModifierDeck;
  type: string;
  values: (string | number | boolean)[];

  constructor(deck: AttackModifierDeck, type: string, ...values: (string | number | boolean)[]) {
    this.deck = deck;
    this.type = type;
    this.values = values;
  }
}

@Component({
  imports: [AttackModifierComponent, GhsLabelDirective, NgClass, TrackUUIDPipe, PointerInputDirective],
  selector: 'ghs-attackmodifier-deck',
  templateUrl: './attackmodifierdeck.html',
  styleUrls: ['./attackmodifierdeck.scss']
})
export class AttackModifierDeckComponent implements OnInit, OnChanges {
  element = inject(ElementRef);
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  private cdr = inject(ChangeDetectorRef);

  readonly inputDeck = input.required<AttackModifierDeck>({ alias: 'deck' });

  get deck(): AttackModifierDeck {
    return this.inputDeck();
  }

  readonly inputCharacter = input<Character>(undefined, { alias: 'character' });
  get character(): Character | undefined {
    return this.inputCharacter();
  }

  readonly inputEdition = input<string>('', { alias: 'edition' });

  readonly ally = input<boolean>(false);
  readonly inputNumeration = input<string>('', { alias: 'numeration' });
  readonly bottom = input<boolean>(false);
  readonly before = output<AttackModiferDeckChange>();
  readonly after = output<AttackModiferDeckChange>();
  readonly fullscreen = input<boolean>(true);
  readonly vertical = input<boolean>(false);
  readonly townGuard = input<boolean>(false);
  readonly inputBattleGoals = input<boolean>(true, { alias: 'battleGoals' });
  readonly standalone = input<boolean>(false);
  readonly initTimeout = input<number>(1500);

  numeration: string = '';
  edition: string = '';
  battleGoals: boolean = true;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  GameState = GameState;
  reveal: number = 0;
  edit: boolean = false;
  maxHeight: string = '';
  characterIcon: string = '';

  AttackModifierType = AttackModifierType;
  type: AttackModifierType = AttackModifierType.minus1;
  current: number = -1;
  lastVisible: number = 0;
  deckLength: number = 0;
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

  constructor() {
    this.ghsManager.uiChangeEffect((fromServer: boolean) => {
      this.update(fromServer);
    });
    this.element.nativeElement.addEventListener('pointerdown', (event: any) => {
      const elements = document.elementsFromPoint(event.clientX, event.clientY);
      if (elements[0].classList.contains('attack-modifiers') && elements.length > 2) {
        (elements[2] as HTMLElement).click();
      }
    });
  }

  ngOnInit(): void {
    this.edition = this.inputEdition();
    this.numeration = this.inputNumeration();
    this.battleGoals = this.inputBattleGoals();
    if (this.character) {
      this.edition = this.character.edition;
      this.numeration = '' + this.character.number;
      this.characterIcon = this.character.iconUrl;
    } else {
      this.battleGoals = false;
      this.characterIcon = '';
    }
    this.current = this.deck.current;
    this.lastVisible = this.deck.lastVisible;
    this.compact =
      !this.drawing &&
      this.fullscreen() &&
      settingsManager.settings.automaticAttackModifierFullscreen &&
      settingsManager.settings.portraitMode &&
      (window.innerWidth < 800 || window.innerHeight < 400);

    if (this.deck.bb) {
      this.bbCurrent = Math.ceil((this.deck.current + 1) / 3);
      this.bbRows = Math.ceil(this.deck.cards.length / 3);
    }

    if (!this.init) {
      this.drawTimeout = setTimeout(
        () => {
          this.current = this.deck.current;
          this.lastVisible = this.deck.lastVisible;
          this.drawTimeout = null;
          this.init = true;
          this.cdr.markForCheck();
        },
        settingsManager.settings.animations ? this.initTimeout() * settingsManager.settings.animationSpeed : 0
      );
    }

    if (this.edition && !this.newStyle) {
      this.newStyle = gameManager.newAmStyle(this.edition);
    }

    if (settingsManager.settings.fhStyle) {
      this.newStyle = true;
    }

    const townGuard = this.townGuard();
    this.disabled =
      !this.standalone() &&
      ((!townGuard && gameManager.game.state === GameState.draw) || (townGuard && gameManager.game.scenario !== undefined));

    window.addEventListener('resize', () => {
      this.compact =
        settingsManager.settings.automaticAttackModifierFullscreen &&
        settingsManager.settings.portraitMode &&
        (window.innerWidth < 800 || window.innerHeight < 400);
    });

    window.addEventListener('fullscreenchange', () => {
      this.compact =
        settingsManager.settings.automaticAttackModifierFullscreen &&
        settingsManager.settings.portraitMode &&
        (window.innerWidth < 800 || window.innerHeight < 400);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inputCharacter']) {
      this.initCharacter();
    } else if (changes['inputDeck']) {
      this.update();
    }
  }

  initCharacter() {
    if (this.character) {
      this.edition = this.character.edition;
      this.numeration = '' + this.character.number;
      this.characterIcon = this.character.iconUrl;
      this.queue = 0;
      this.drawing = false;
      this.current = this.deck.current;
      this.lastVisible = this.deck.lastVisible;
    }
  }

  update(fromServer: boolean = false) {
    this.edition = this.inputEdition();
    this.numeration = this.inputNumeration();
    this.battleGoals = this.inputBattleGoals();
    if (this.character) {
      this.edition = this.character.edition;
      this.numeration = '' + this.character.number;
      this.characterIcon = this.character.iconUrl;
    } else {
      this.battleGoals = false;
      this.characterIcon = '';
    }
    const townGuard = this.townGuard();
    this.disabled =
      !this.standalone() &&
      ((!townGuard && gameManager.game.state === GameState.draw) || (townGuard && gameManager.game.scenario !== undefined));

    if (this.initServer && gameManager.stateManager.wsState() !== WebSocket.OPEN) {
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
      this.initServer = gameManager.stateManager.wsState() === WebSocket.OPEN;
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

    this.compact =
      settingsManager.settings.automaticAttackModifierFullscreen &&
      settingsManager.settings.portraitMode &&
      (window.innerWidth < 800 || window.innerHeight < 400);

    this.activeAMs = this.deck.cards.filter((am, i) => am.active && i < this.deck.lastVisible && !this.deck.discarded.includes(i));

    this.deckLength = this.deck.cards.length;
  }

  drawQueue() {
    this.drawing = true;
    this.element.nativeElement.getElementsByClassName('attack-modifiers')[0].classList.add('drawing');
    this.queueTimeout = setTimeout(
      () => {
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

          if (
            gameManager.lootManager.easter &&
            !!this.character &&
            this.deck.state !== 'advantage' &&
            this.deck.cards
              .slice(this.deck.state === 'disadvantage' ? this.deck.lastVisible : this.deck.current, this.deck.current + 1)
              .some((am) => am.type === AttackModifierType.null)
          ) {
            new Audio('assets/media/null.ogg').play();
          }
        }
        this.cdr.markForCheck();
      },
      settingsManager.settings.animations ? 1050 * settingsManager.settings.animationSpeed : 0
    );
  }

  attackResolveBlocksDeckDraw(): boolean {
    if (!settingsManager.settings.attackResolveGuided || !gameManager.game.scenario || gameManager.game.state !== GameState.next) {
      return false;
    }
    if (this.townGuard() || this.standalone()) {
      return false;
    }

    const mgr = gameManager.attackResolveManager;
    const character = this.character;

    if (character) {
      return (
        !this.ally() &&
        character.active &&
        (mgr.phase === 'idle' || mgr.character === character)
      );
    }

    const monster = mgr.footerAttackMonster();
    if (!monster || !monster.active) {
      return false;
    }

    const usesAllyDeck = mgr.monsterUsesAllyDeck(monster);
    if (this.ally() !== usesAllyDeck) {
      return false;
    }

    return mgr.phase === 'idle' || mgr.monster === monster;
  }

  attackResolveGuided(): boolean {
    return this.attackResolveBlocksDeckDraw() && gameManager.attackResolveManager.phase === 'idle';
  }

  draw(event: any, state: 'advantage' | 'disadvantage' | undefined = undefined) {
    if (this.attackResolveBlocksDeckDraw()) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }
    if (this.compact && this.fullscreen()) {
      this.openFullscreen(event);
    } else if (!this.disabled) {
      if (!this.drawTimeout && this.deck.current < this.deck.cards.length - (this.queue === 0 ? 0 : 1)) {
        this.drawTimeout = setTimeout(
          () => {
            this.before.emit(new AttackModiferDeckChange(this.deck, 'draw' + (state ? state : '')));
            gameManager.attackModifierManager.drawModifier(this.deck, state);
            this.after.emit(new AttackModiferDeckChange(this.deck, 'draw' + (state ? state : '')));
            this.drawTimeout = null;
          },
          settingsManager.settings.animations ? 150 * settingsManager.settings.animationSpeed : 0
        );
      } else if (!this.drawTimeout && this.deck.current >= this.deck.cards.length) {
        this.before.emit(new AttackModiferDeckChange(this.deck, 'shuffle'));
        gameManager.attackModifierManager.shuffleModifiers(this.deck);
        this.after.emit(new AttackModiferDeckChange(this.deck, 'shuffle'));
      }
    } else {
      this.dialog.open(AttackModifierDeckDialogComponent, {
        panelClass: ['dialog'],
        data: {
          deck: this.deck,
          character: this.character,
          ally: this.ally(),
          numeration: this.numeration,
          newStyle: this.newStyle,
          townGuard: this.townGuard(),
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
        ally: this.ally(),
        numeration: this.numeration,
        newStyle: this.newStyle,
        townGuard: this.townGuard(),
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
        data: { character: this.character, draw: !this.character.battleGoals || this.character.battleGoals.length === 0 }
      });
      event.preventDefault();
      event.stopPropagation();
    }
  }

  clickCard(index: number, event: any, force: boolean = false) {
    if (!this.drawing || index > this.current) {
      const am: AttackModifier = this.deck.cards[index];
      if (am.active && !this.deck.discarded.includes(index)) {
        this.before.emit(new AttackModiferDeckChange(this.deck, 'discardFromActive', index));
        this.deck.discarded.push(index);
        this.after.emit(new AttackModiferDeckChange(this.deck, 'discardFromActive', index));
      } else if (am.active && this.deck.discarded.includes(index) && force) {
        this.before.emit(new AttackModiferDeckChange(this.deck, 'restoreToActive', index));
        this.deck.discarded = this.deck.discarded.filter((i) => i !== index);
        this.after.emit(new AttackModiferDeckChange(this.deck, 'restoreToActive', index));
      } else {
        this.open(event);
      }
    }
  }

  open(event: any) {
    if (
      gameManager.game.state === GameState.next &&
      this.fullscreen() &&
      settingsManager.settings.automaticAttackModifierFullscreen &&
      settingsManager.settings.portraitMode &&
      (window.innerWidth < 800 || window.innerHeight < 400)
    ) {
      this.openFullscreen(event);
    } else {
      this.dialog.open(AttackModifierDeckDialogComponent, {
        panelClass: ['dialog'],
        data: {
          deck: this.deck,
          character: this.character,
          ally: this.ally(),
          numeration: this.numeration,
          newStyle: this.newStyle,
          townGuard: this.townGuard(),
          before: this.before,
          after: this.after
        }
      });
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
