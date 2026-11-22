import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, HostListener, inject, input, OnChanges, OnInit, output, SimpleChanges } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { LootManager } from 'src/app/game/businesslogic/LootManager';
import { gameManager, settingsManager, soundboardManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { appliableLootTypes, Loot, LootDeck, LootType } from 'src/app/game/model/data/Loot';
import { GameState } from 'src/app/game/model/Game';
import { LootApplyDialogComponent } from 'src/app/ui/figures/loot/loot-apply-dialog';
import { LootComponent } from 'src/app/ui/figures/loot/loot-card';
import { LootDeckDialogComponent } from 'src/app/ui/figures/loot/loot-deck-dialog';
import { LootDeckFullscreenComponent } from 'src/app/ui/figures/loot/loot-deck-fullscreen';
import { openLootRandomItemDialog } from 'src/app/ui/figures/loot/random-item/random-item-dialog';
import { DeckDrawDirective } from 'src/app/ui/helper/deck-draw';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsCompactPortrait } from 'src/app/ui/helper/Static';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

export class LootDeckChange {
  deck: LootDeck;
  type: string;
  values: (string | number | boolean)[];

  constructor(deck: LootDeck, type: string, ...values: (string | number | boolean)[]) {
    this.deck = deck;
    this.type = type;
    this.values = values;
  }
}

@Component({
  imports: [GhsLabelDirective, LootComponent, NgClass, TrackUUIDPipe],
  selector: 'ghs-loot-deck',
  templateUrl: './loot-deck.html',
  styleUrls: ['./loot-deck.scss']
})
export class LootDeckComponent extends DeckDrawDirective implements OnInit, OnChanges {
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);
  protected drawingClass: string = 'deck';

  readonly inputLootDeck = input.required<LootDeck>({ alias: 'deck' });
  get deck(): LootDeck {
    return this.inputLootDeck();
  }

  readonly bottom = input<boolean>(false);
  readonly characters = input<boolean>(true);
  readonly fullscreen = input<boolean>(true);
  readonly vertical = input<boolean>(false);
  readonly standalone = input<boolean>(false);
  readonly before = output<LootDeckChange>();
  readonly after = output<LootDeckChange>();
  readonly initTimeout = input<number>(1500);
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  lootManager: LootManager = gameManager.lootManager;
  internalDraw: number = -99;
  LootType = LootType;
  GameState = GameState;
  compact: boolean = false;
  disabled: boolean = false;

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
    this.disabled = !this.standalone() && gameManager.game.state === GameState.draw;

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
    this.disabled = !this.standalone() && gameManager.game.state === GameState.draw;

    this.updateQueue(this.deck.active || this.standalone(), fromServer);

    this.compact = ghsCompactPortrait();
  }

  protected override drawn(index: number, fromServer: boolean): number {
    const loot = this.deck.cards[index];
    let delay = 0;

    if (settingsManager.settings.animations && gameManager.lootManager.easter && loot) {
      if (loot.type === LootType.metal) {
        soundboardManager.play('metal');
      } else if (loot.type === LootType.lumber) {
        soundboardManager.play('lumber');
        delay = 2600;
      } else if (loot.type === LootType.money || loot.type === LootType.special1 || loot.type === LootType.special2) {
        soundboardManager.play('gold');
        delay = 2200;
      } else {
        soundboardManager.play('loot');
        delay = 4000;
      }
    }

    if (
      !fromServer &&
      loot &&
      appliableLootTypes.indexOf(loot.type) !== null &&
      settingsManager.settings.applyLoot &&
      !this.standalone() &&
      this.fullscreen() &&
      gameManager.game.figures.find((figure) => figure instanceof Character && gameManager.gameplayFigure(figure)) &&
      gameManager.game.figures.every((figure) => !(figure instanceof Character) || !figure.lootCards.includes(index))
    ) {
      const activeCharacter = gameManager.game.figures.find((figure) => figure instanceof Character && figure.active) as Character;
      if (!activeCharacter || settingsManager.settings.alwaysLootApplyDialog) {
        this.dialog
          .open(LootApplyDialogComponent, {
            panelClass: ['dialog'],
            data: { loot: loot }
          })
          .closed.subscribe({
            next: (name) => {
              if (name) {
                const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.name === name);
                if (character instanceof Character) {
                  this.applyLoot(character, loot, index);
                }
              }
            }
          });
      } else if (activeCharacter) {
        this.applyLoot(activeCharacter, loot, index);
      }
    }
    return delay;
  }

  applyLoot(character: Character, loot: Loot, index: number) {
    if (!character.lootCards.includes(index)) {
      gameManager.stateManager.before(
        loot.type === LootType.random_item ? 'lootRandomItem' : 'addResource',
        gameManager.characterManager.characterName(character, true, true),
        'game.loot.' + loot.type,
        this.lootManager.getValue(loot)
      );
      const result = gameManager.lootManager.applyLoot(loot, character, index);
      gameManager.stateManager.after();
      if (result) {
        openLootRandomItemDialog(this.dialog, result, character, index);
      }
    }
  }

  draw(event: any, forceDraw: boolean = false) {
    if (this.compact && this.fullscreen() && !forceDraw) {
      this.openFullscreen(event);
    } else if (!this.disabled && this.deck.cards.length > 0) {
      if (!this.drawTimeout && this.deck.current + 1 < this.deck.cards.length - (this.queue === 0 ? 0 : 1)) {
        const activeCharacter = gameManager.game.figures.find((figure) => figure instanceof Character && figure.active);
        this.delayedDraw(() => {
          this.before.emit(new LootDeckChange(this.deck, 'lootDeckDraw'));
          if (!settingsManager.settings.alwaysLootApplyDialog && activeCharacter instanceof Character) {
            const result = gameManager.lootManager.drawCard(this.deck, activeCharacter);
            if (result) {
              const index = this.deck.current;
              setTimeout(
                () => {
                  openLootRandomItemDialog(this.dialog, result, activeCharacter, index);
                },
                settingsManager.settings.animations ? 1050 * settingsManager.settings.animationSpeed : 0
              );
            }
          } else {
            gameManager.lootManager.drawCard(this.deck, undefined);
          }
          this.after.emit(new LootDeckChange(this.deck, 'lootDeckDraw'));
        });
      }
    } else {
      this.dialog.open(LootDeckDialogComponent, {
        panelClass: ['dialog'],
        data: {
          deck: this.deck,
          characters: this.characters(),
          before: this.before,
          after: this.after,
          apply: !this.standalone()
        }
      });
    }
  }

  openFullscreen(event: any) {
    if (this.fullscreen()) {
      this.dialog.open(LootDeckFullscreenComponent, {
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
    if (!this.drawing || index > this.current) {
      this.open(event);
    }
  }

  getCharacter(index: number): string {
    if (this.characters()) {
      const character = gameManager.game.figures.find(
        (figure) => figure instanceof Character && figure.lootCards && figure.lootCards.includes(index)
      );
      if (character) {
        return character.name;
      }
    }
    return '';
  }

  open(event: any) {
    if (this.deck.cards.length > 0 && gameManager.game.state === GameState.next && this.fullscreen() && ghsCompactPortrait()) {
      this.openFullscreen(event);
    } else {
      this.dialog.open(LootDeckDialogComponent, {
        panelClass: ['dialog'],
        data: {
          deck: this.deck,
          characters: this.characters(),
          before: this.before,
          after: this.after,
          apply: !this.standalone()
        }
      });
    }
    event.preventDefault();
    event.stopPropagation();
  }
}
