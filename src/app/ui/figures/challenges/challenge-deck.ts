import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, HostListener, inject, input, OnChanges, OnInit, output, SimpleChanges } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ChallengeDeck } from 'src/app/game/model/data/Challenges';
import { GameState } from 'src/app/game/model/Game';
import { ChallengeCardComponent } from 'src/app/ui/figures/challenges/challenge-card';
import { ChallengeDeckDialogComponent } from 'src/app/ui/figures/challenges/challenge-deck-dialog';
import { ChallengeDeckFullscreenComponent } from 'src/app/ui/figures/challenges/challenge-deck-fullscreen';
import { DeckDrawDirective } from 'src/app/ui/helper/deck-draw';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsCompactPortrait } from 'src/app/ui/helper/Static';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

export class ChallengeDeckChange {
  deck: ChallengeDeck;
  type: string;
  values: (string | number | boolean)[];

  constructor(deck: ChallengeDeck, type: string, ...values: (string | number | boolean)[]) {
    this.deck = deck;
    this.type = type;
    this.values = values;
  }
}

@Component({
  imports: [ChallengeCardComponent, GhsLabelDirective, NgClass, PointerInputDirective, TrackUUIDPipe],
  selector: 'ghs-challenge-deck',
  templateUrl: './challenge-deck.html',
  styleUrls: ['./challenge-deck.scss']
})
export class ChallengeDeckComponent extends DeckDrawDirective implements OnInit, OnChanges {
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);
  protected drawingClass: string = 'deck';

  readonly inputChallengeDeck = input.required<ChallengeDeck>({ alias: 'deck' });
  get deck(): ChallengeDeck {
    return this.inputChallengeDeck();
  }

  readonly bottom = input<boolean>(false);
  readonly fullscreen = input<boolean>(true);
  readonly vertical = input<boolean>(false);
  readonly before = output<ChallengeDeckChange>();
  readonly after = output<ChallengeDeckChange>();
  readonly initTimeout = input<number>(1500);
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  internalDraw: number = -99;
  GameState = GameState;
  compact: boolean = false;
  disabled: boolean = false;
  drawDisabled: boolean = false;
  drawAvailable: number = 0;
  keepAvailable: number = 0;

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

  ngOnInit(): void {
    this.internalDraw = -99;
    this.compact = this.deck.cards.length > 0 && ghsCompactPortrait();

    const building = gameManager.game.party.buildings.find(
      (buildingModel) => buildingModel.name === 'town-hall' && buildingModel.level && buildingModel.state !== 'wrecked'
    );
    if (building) {
      this.drawAvailable = building.level;
      this.keepAvailable = Math.ceil(building.level / 2);
    }

    this.disabled =
      !gameManager.roundManager.firstRound ||
      gameManager.game.state === GameState.next ||
      !gameManager.game.scenario ||
      !this.deck.cards.length;
    this.drawDisabled = this.disabled || this.deck.current - this.deck.finished >= this.drawAvailable;

    this.initQueue(this.initTimeout());
  }

  @HostListener('window:resize')
  @HostListener('window:fullscreenchange')
  onWindowResize() {
    this.compact = this.deck.cards.length > 0 && ghsCompactPortrait();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['deck']) {
      this.update();
    }
  }

  update(fromServer: boolean = false) {
    const building = gameManager.game.party.buildings.find(
      (buildingModel) => buildingModel.name === 'town-hall' && buildingModel.level && buildingModel.state !== 'wrecked'
    );
    if (building) {
      this.drawAvailable = building.level;
      this.keepAvailable = Math.ceil(building.level / 2);
    }

    this.disabled =
      !gameManager.roundManager.firstRound ||
      gameManager.game.state === GameState.next ||
      !gameManager.game.scenario ||
      !this.deck.cards.length;
    this.drawDisabled = this.disabled || this.deck.current - this.deck.finished >= this.drawAvailable;

    this.updateQueue(this.deck.active, fromServer);

    this.compact = ghsCompactPortrait();
  }

  draw(event: any) {
    if (this.compact && this.fullscreen()) {
      this.openFullscreen(event);
    } else if (!this.drawDisabled && this.deck.cards.length > 0) {
      if (!this.drawTimeout && this.deck.current < this.deck.cards.length - (this.queue === 0 ? 0 : 1)) {
        this.delayedDraw(() => {
          this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.draw'));
          gameManager.challengesManager.drawCard(this.deck);
          this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.draw'));
        });
      }
    } else {
      this.dialog.open(ChallengeDeckDialogComponent, {
        panelClass: ['dialog'],
        data: {
          deck: this.deck,
          before: this.before,
          after: this.after
        }
      });
    }
  }

  openFullscreen(event: any) {
    if (this.fullscreen()) {
      this.dialog.open(ChallengeDeckFullscreenComponent, {
        panelClass: ['fullscreen-panel'],
        backdropClass: ['fullscreen-backdrop'],
        data: {
          deck: this.deck,
          before: this.before,
          after: this.after
        }
      });

      event.preventDefault();
      event.stopPropagation();
    }
  }

  clickCard(index: number, event: any) {
    if (this.disabled) {
      this.open(event);
    } else if (index <= this.current) {
      this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.toggle', index));
      gameManager.challengesManager.toggleKeep(this.deck, index, this.keepAvailable);
      this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.toggle', index));
    }
  }

  doubleClickCard(index: number, event: any) {
    if (!this.drawing || index > this.current) {
      this.open(event);
    }
  }

  open(event: any) {
    if (this.deck.cards.length > 0 && this.fullscreen() && ghsCompactPortrait()) {
      this.openFullscreen(event);
    } else {
      this.dialog.open(ChallengeDeckDialogComponent, {
        panelClass: ['dialog'],
        data: {
          deck: this.deck,
          before: this.before,
          after: this.after
        }
      });
    }
    event.preventDefault();
    event.stopPropagation();
  }
}
