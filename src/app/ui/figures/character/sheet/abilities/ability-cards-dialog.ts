import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { Character } from 'src/app/game/model/Character';
import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { AbilityCardComponent } from 'src/app/ui/figures/ability-card/ability-card';
import { AbilityCardDialogComponent } from 'src/app/ui/figures/ability-card/ability-card-dialog';
import { EnhancementDialogComponent } from 'src/app/ui/figures/character/sheet/abilities/enhancements/enhancement-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [
    NgClass,
    FormsModule,
    GhsLabelDirective,
    GhsTooltipDirective,
    PointerInputDirective,
    GhsRangePipe,
    TrackUUIDPipe,
    AbilityCardComponent
  ],
  selector: 'ghs-ability-cards-dialog',
  templateUrl: 'ability-cards-dialog.html',
  styleUrls: ['./ability-cards-dialog.scss']
})
export class AbilityCardsDialogComponent implements OnInit {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  character: Character;
  level: number | string;
  exclusiveLevel: number | string | undefined;
  additionalLevels: (number | string)[] = [];
  abilityCards: AbilityCard[] = [];
  visibleAbilityCards: AbilityCard[] = [];
  smallAbilityCards: AbilityCard[] = [];
  cardsToPick: number = 1;
  levelToPick: number = 1;
  sort: 'level-deck' | 'cardId' | 'level-name' | 'name' = 'level-deck';
  sorts: ('level-deck' | 'cardId' | 'level-name' | 'name')[] = ['level-deck', 'cardId', 'level-name', 'name'];
  deck: boolean = true;
  maxLevel: number = 1;
  enhanced: boolean = false;

  data: { character: Character } = inject(DIALOG_DATA);

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
    this.character = this.data.character;
    this.level = this.character.level;
    this.abilityCards = gameManager.deckData(this.character).abilities;
    this.abilityCards
      .filter(
        (abilityCard) =>
          (typeof abilityCard.level === 'string' && abilityCard.level !== 'X') ||
          (typeof abilityCard.level === 'number' && abilityCard.level > 9)
      )
      .forEach((abilityCard) => {
        if (!this.additionalLevels.includes(abilityCard.level)) {
          this.additionalLevels.push(abilityCard.level);
        }
      });
    this.dialogRef.closed.subscribe({
      next: () => {
        this.character.tags = this.character.tags.filter((tag) => tag !== 'edit-abilities');
      }
    });
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.cardsToPick = this.character.level - this.character.progress.deck.length - 1;
    this.character.tags = this.character.tags.filter((tag) => tag !== 'edit-abilities');

    if (this.cardsToPick < 0) {
      this.cardsToPick = 0;
    }
    this.character.progress.deck = this.character.progress.deck || [];
    this.levelToPick = this.deck && this.cardsToPick ? this.character.level - this.cardsToPick + 1 : 0;
    this.maxLevel = Math.max(
      ...this.abilityCards
        .filter((abilityCard, i) => typeof abilityCard.level === 'number' && this.character.progress.deck.includes(i))
        .map((abilityCard) => +abilityCard.level),
      this.character.level
    );
    if (this.levelToPick) {
      this.visibleAbilityCards = this.abilityCards
        .filter(
          (abilityCard, i) =>
            typeof abilityCard.level === 'number' &&
            abilityCard.level > 1 &&
            abilityCard.level <= this.levelToPick &&
            !this.character.progress.deck.includes(i)
        )
        .sort((a, b) => {
          if (typeof a.level === 'number' && typeof b.level === 'number' && a.level !== b.level) {
            return b.level - a.level;
          }
          if (a.cardId && b.cardId) {
            return a.cardId - b.cardId;
          }
          return 0;
        });
      this.smallAbilityCards = this.abilityCards.filter(
        (abilityCard, i) => abilityCard.level === 'X' || abilityCard.level === 1 || this.character.progress.deck.includes(i)
      );
    } else {
      this.visibleAbilityCards = this.abilityCards.filter(
        (abilityCard) =>
          (!this.exclusiveLevel &&
            typeof this.level === 'number' &&
            (typeof abilityCard.level === 'string' || +abilityCard.level <= this.level) &&
            !this.additionalLevels.includes(abilityCard.level)) ||
          (this.exclusiveLevel && abilityCard.level === this.exclusiveLevel) ||
          (this.exclusiveLevel === 1 && abilityCard.level === 'X')
      );
      this.smallAbilityCards = [];

      if (this.deck) {
        this.visibleAbilityCards = this.visibleAbilityCards.filter(
          (abilityCard) =>
            abilityCard.level === 'X' ||
            abilityCard.level === 1 ||
            (typeof abilityCard.level === 'string' && abilityCard.level === this.level) ||
            this.character.progress.deck.indexOf(this.abilityCards.indexOf(abilityCard)) !== -1
        );
        this.character.tags.push('edit-abilities');
      }

      if (this.sort === 'cardId') {
        this.visibleAbilityCards.sort((a, b) => {
          if (a.cardId && b.cardId) {
            return a.cardId - b.cardId;
          }
          return 0;
        });
      } else if (this.sort === 'level-name') {
        this.visibleAbilityCards.sort((a, b) => {
          if (a.level === b.level) {
            if (a.name && b.name) {
              return a.name < b.name ? -1 : 1;
            } else if (a.cardId && b.cardId) {
              return a.cardId - b.cardId;
            }
            return 0;
          } else if (a.level === 1 && b.level === 'X') {
            return -1;
          } else if (a.level === 'X' && b.level === 1) {
            return 1;
          } else if (a.level === 'X') {
            return -1;
          } else if (b.level === 'X') {
            return 1;
          } else if (typeof a.level === 'number' && typeof b.level === 'number') {
            return a.level - b.level;
          }
          return 0;
        });
      } else if (this.sort === 'level-deck') {
        this.visibleAbilityCards.sort((a, b) => {
          if ((a.level === 1 || a.level === 'X') && (b.level === 1 || b.level === 'X')) {
            return 0;
          } else if (a.level === 1 || a.level === 'X') {
            return -1;
          } else if (b.level === 1 || b.level === 'X') {
            return 1;
          } else if (
            this.character.progress.deck.indexOf(this.abilityCards.indexOf(a)) !== -1 &&
            this.character.progress.deck.indexOf(this.abilityCards.indexOf(b)) === -1
          ) {
            return -1;
          } else if (
            this.character.progress.deck.indexOf(this.abilityCards.indexOf(a)) === -1 &&
            this.character.progress.deck.indexOf(this.abilityCards.indexOf(b)) !== -1
          ) {
            return 1;
          }
          return 0;
        });
      } else if (this.sort === 'name') {
        this.visibleAbilityCards.sort((a, b) => {
          if (a.name && b.name) {
            return a.name < b.name ? -1 : 1;
          } else if (a.cardId && b.cardId) {
            return a.cardId - b.cardId;
          }
          return 0;
        });
      }
    }

    if (!this.levelToPick && this.enhanced && this.character.progress.enhancements && this.character.progress.enhancements.length) {
      this.visibleAbilityCards = this.visibleAbilityCards.filter(
        (abilityCard) =>
          this.character.progress.enhancements &&
          this.character.progress.enhancements.find((enhancement) => enhancement.cardId === abilityCard.cardId)
      );
    }
  }

  togglePick() {
    this.deck = !this.deck;
    this.ghsManager.triggerUiChange();
  }

  setLevel(level: number | string, exclusive: boolean = false) {
    this.level = level;
    this.exclusiveLevel = exclusive ? level : undefined;
    if (this.additionalLevels.includes(level)) {
      this.exclusiveLevel = level;
    }
    this.update();
  }

  undoLastCard() {
    gameManager.stateManager.before('character.undoLastCard', gameManager.characterManager.characterName(this.character, true, true));
    this.character.progress.deck.splice(-1, 1);
    gameManager.stateManager.after();
    this.update();
  }

  resetDeck() {
    gameManager.stateManager.before('character.resetDeck', gameManager.characterManager.characterName(this.character, true, true));
    this.character.progress.deck = [];
    gameManager.stateManager.after();
    this.update();
  }

  clickAbility(abilityCard: AbilityCard) {
    const level1 = typeof abilityCard.level === 'string' || abilityCard.level === 1;
    if (level1 || !this.levelToPick || !this.deck) {
      this.openDialog(abilityCard);
    } else {
      this.toggleDeck(abilityCard);
    }
  }

  toggleDeck(abilityCard: AbilityCard, force: boolean = false) {
    const inDeck = this.character.progress.deck.indexOf(this.abilityCards.indexOf(abilityCard)) !== -1;
    if (inDeck || force || (this.levelToPick >= +abilityCard.level && this.cardsToPick > 0)) {
      if (inDeck) {
        gameManager.stateManager.before(
          'character.cardFromDeck',
          gameManager.characterManager.characterName(this.character, true, true),
          abilityCard.name || abilityCard.cardId || ''
        );
        this.character.progress.deck = this.character.progress.deck.filter((value) => value !== this.abilityCards.indexOf(abilityCard));
      } else {
        gameManager.stateManager.before(
          'character.cardToDeck',
          gameManager.characterManager.characterName(this.character, true, true),
          abilityCard.name || abilityCard.cardId || ''
        );
        this.character.progress.deck.push(this.abilityCards.indexOf(abilityCard));
      }
      gameManager.stateManager.after();
      this.update();
    }
  }

  openDialog(abilityCard: AbilityCard) {
    this.dialog.open(AbilityCardDialogComponent, {
      panelClass: ['fullscreen-panel'],
      disableClose: true,
      data: { abilityCard: abilityCard, character: this.character }
    });
  }

  toggleEnhanced() {
    if (this.character.progress.enhancements && this.character.progress.enhancements.length) {
      this.enhanced = !this.enhanced;
      this.ghsManager.triggerUiChange();
    } else {
      this.enhanced = false;
      this.openEnhancementDialog();
    }
  }

  openEnhancementDialog() {
    this.dialog.open(EnhancementDialogComponent, {
      panelClass: ['dialog']
    });
  }
}
