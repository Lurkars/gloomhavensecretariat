import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, HostListener, inject, input, OnChanges, OnInit, output, SimpleChanges } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager, soundboardManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { AttackModifier, AttackModifierDeck, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { GameState } from 'src/app/game/model/Game';
import { AttackModifierComponent } from 'src/app/ui/figures/attackmodifier/attackmodifier';
import { AttackModifierDeckDialogComponent } from 'src/app/ui/figures/attackmodifier/attackmodifierdeck-dialog';
import { AttackModifierDeckFullscreenComponent } from 'src/app/ui/figures/attackmodifier/attackmodifierdeck-fullscreen';
import { CharacterBattleGoalsDialog } from 'src/app/ui/figures/battlegoal/dialog/battlegoal-dialog';
import { DeckDrawDirective } from 'src/app/ui/helper/deck-draw';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsCompactPortrait } from 'src/app/ui/helper/Static';
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
export class AttackModifierDeckComponent extends DeckDrawDirective implements OnInit, OnChanges {
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);
  protected drawingClass: string = 'attack-modifiers';

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
  lastVisible: number = 0;
  deckLength: number = 0;
  newStyle: boolean = false;
  disabled: boolean = false;
  bbRules: boolean = false;

  compact: boolean = false;

  bbCurrent: number = 0;
  bbRows: number = 0;
  activeAMs: AttackModifier[] = [];

  constructor() {
    super();
    this.ghsManager.uiChangeEffect((fromServer: boolean) => {
      this.update(fromServer);
    });
    this.clickThrough();
  }

  protected deckCurrent(): number {
    return this.deck.current;
  }

  protected override drawAll(): boolean {
    return this.deck.bb;
  }

  protected override synced() {
    this.lastVisible = this.deck.lastVisible;
  }

  protected override queueFinished() {
    if (
      gameManager.lootManager.easter &&
      !!this.character &&
      this.deck.state !== 'advantage' &&
      this.deck.cards
        .slice(this.deck.state === 'disadvantage' ? this.deck.lastVisible : this.deck.current, this.deck.current + 1)
        .some((am) => am.type === AttackModifierType.null)
    ) {
      soundboardManager.play('null');
    }
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
    this.compact = !this.drawing && this.isCompact();

    if (this.deck.bb) {
      this.bbCurrent = Math.ceil((this.deck.current + 1) / 3);
      this.bbRows = Math.ceil(this.deck.cards.length / 3);
    }

    this.initQueue(this.initTimeout());

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
  }

  @HostListener('window:resize')
  @HostListener('window:fullscreenchange')
  onWindowResize() {
    this.compact = this.isCompact();
  }

  isCompact(): boolean {
    return this.fullscreen() && ghsCompactPortrait();
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
      this.resetQueue();
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

    this.bbRules = gameManager.bbRules();

    this.updateQueue(this.deck.active, fromServer);

    if (settingsManager.settings.fhStyle) {
      this.newStyle = true;
    }

    if (this.deck.bb) {
      this.bbCurrent = Math.ceil((this.current + 1) / 3);
      this.bbRows = Math.ceil(this.deck.cards.length / 3);
    }

    this.compact = this.isCompact();

    this.activeAMs = this.deck.cards.filter((am, i) => am.active && i < this.deck.lastVisible && !this.deck.discarded.includes(i));

    this.deckLength = this.deck.cards.length;
  }

  draw(event: any, state: 'advantage' | 'disadvantage' | undefined = undefined) {
    if (this.compact && this.fullscreen()) {
      this.openFullscreen(event);
    } else if (!this.disabled) {
      if (!this.drawTimeout && this.deck.current < this.deck.cards.length - (this.queue === 0 ? 0 : 1)) {
        this.delayedDraw(() => {
          this.before.emit(new AttackModiferDeckChange(this.deck, 'draw' + (state ? state : '')));
          gameManager.attackModifierManager.drawModifier(this.deck, state, this.character);
          this.after.emit(new AttackModiferDeckChange(this.deck, 'draw' + (state ? state : '')));
        });
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
        gameManager.attackModifierManager.setDiscarded(this.deck, index, true);
        this.after.emit(new AttackModiferDeckChange(this.deck, 'discardFromActive', index));
      } else if (am.active && this.deck.discarded.includes(index) && force) {
        this.before.emit(new AttackModiferDeckChange(this.deck, 'restoreToActive', index));
        gameManager.attackModifierManager.setDiscarded(this.deck, index, false);
        this.after.emit(new AttackModiferDeckChange(this.deck, 'restoreToActive', index));
      } else {
        this.open(event);
      }
    }
  }

  open(event: any) {
    if (gameManager.game.state === GameState.next && this.fullscreen() && ghsCompactPortrait()) {
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
