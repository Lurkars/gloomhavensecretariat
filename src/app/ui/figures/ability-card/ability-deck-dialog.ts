import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, labelManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { AbilityCardComponent } from 'src/app/ui/figures/ability-card/ability-card';
import { applyPlaceholder, GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    GhsLabelDirective,
    PointerInputDirective,
    GhsTooltipDirective,
    TrackUUIDPipe,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    AbilityCardComponent
  ],
  selector: 'ghs-ability-deck-dialog',
  templateUrl: './ability-deck-dialog.html',
  styleUrls: ['./ability-deck-dialog.scss']
})
export class AbilityDeckDialogComponent implements OnInit {
  dialogRef = inject(DialogRef);
  private ghsManager = inject(GhsManager);

  monster: Monster = inject(DIALOG_DATA);

  reveal: number = 0;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  edit: boolean = false;
  bottomActions: boolean = false;
  abilityCards: AbilityCard[] = [];
  upcomingCards: AbilityCard[] = [];
  discardedCards: AbilityCard[] = [];
  deletedCards: AbilityCard[] = [];
  keepRevealed: boolean[] = [];

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.bottomActions = gameManager.monsterAbilityManager.hasBottomActions(this.monster);
    this.dialogRef.closed.subscribe(() => {
      this.abilityCards.forEach((abilityCard, i) => {
        if (abilityCard.revealed && !this.keepRevealed[i]) {
          abilityCard.revealed = false;
        }
      });
    });
    this.update(true);
  }

  toggleEdit() {
    this.edit = !this.edit;
  }

  update(init: boolean = false) {
    const abilityNumber = this.monster.ability;

    this.abilityCards = this.monster.abilities.map((value) => gameManager.editionManager.abilityCards(this.monster)[value]);

    this.upcomingCards = this.abilityCards.filter((value, index) => index > abilityNumber);
    this.discardedCards = this.abilityCards.filter((value, index) => index <= abilityNumber).reverse();
    this.deletedCards = gameManager.editionManager
      .deckData(this.monster)
      .abilities.filter((abilityCard) => !this.abilityCards.includes(abilityCard));

    if (init) {
      this.keepRevealed = [...this.monster.revealedAbilities];
      this.abilityCards.forEach((abilityCard, i) => {
        abilityCard.revealed = this.keepRevealed[i];
      });
    }
  }

  abilityIndex(abilityCard: AbilityCard) {
    return gameManager.editionManager.abilityCards(this.monster).indexOf(abilityCard);
  }

  shuffle(upcoming: boolean = false) {
    gameManager.stateManager.before('shuffleAbilityDeck' + (upcoming ? 'Upcoming' : ''), 'data.monster.' + this.monster.name);
    gameManager.monsterAbilityManager.shuffleAbilities(this.monster, upcoming);
    gameManager.roundManager.sortFigures();
    this.keepRevealed = [];
    gameManager.stateManager.after();
    this.update();
  }

  draw() {
    gameManager.stateManager.before('drawAbility', 'data.monster.' + this.monster.name);
    gameManager.monsterAbilityManager.drawAbility(this.monster);
    gameManager.roundManager.sortFigures();
    gameManager.stateManager.after();
    this.update();
  }

  toggleDrawExtra() {
    const drawExtra = !this.monster.drawExtra;
    if (gameManager.monsterAbilityManager.canSetDrawExtra(this.monster, drawExtra)) {
      gameManager.stateManager.before(drawExtra ? 'setDrawExtraAbility' : 'unsetDrawExtraAbility', 'data.monster.' + this.monster.name);
      gameManager.monsterAbilityManager.setDrawExtra(this.monster, drawExtra);
      gameManager.stateManager.after();
    }
    this.update();
  }

  dropUpcoming(event: CdkDragDrop<AbilityCard[]>) {
    gameManager.stateManager.before('reorderAbilities', 'data.monster.' + this.monster.name);
    gameManager.monsterAbilityManager.moveAbility(
      this.monster,
      event.container === event.previousContainer ? 'upcoming' : 'discarded',
      event.previousIndex,
      'upcoming',
      event.currentIndex
    );
    gameManager.stateManager.after();
    this.update();
    this.keepRevealed = [...this.monster.revealedAbilities];
  }

  dropDiscarded(event: CdkDragDrop<AbilityCard[]>) {
    gameManager.stateManager.before('reorderAbilities', 'data.monster.' + this.monster.name);
    gameManager.monsterAbilityManager.moveAbility(
      this.monster,
      event.container === event.previousContainer ? 'discarded' : 'upcoming',
      event.previousIndex,
      'discarded',
      event.currentIndex
    );
    gameManager.stateManager.after();
    this.update();
    this.keepRevealed = [...this.monster.revealedAbilities];
  }

  restoreDefault(): void {
    gameManager.stateManager.before('restoreDefaultAbilities', 'data.monster.' + this.monster.name);
    gameManager.monsterAbilityManager.restoreDefaultAbilities(this.monster);
    gameManager.stateManager.after();
    this.update();
  }

  remove(index: number) {
    const abilityCard: AbilityCard = gameManager.editionManager.abilityCards(this.monster)[this.monster.abilities[index]];
    gameManager.stateManager.before(
      'removeAbility',
      'data.monster.' + this.monster.name,
      abilityCard.name ? this.abilityLabel(abilityCard) : '' + abilityCard.cardId
    );
    gameManager.monsterAbilityManager.removeAbility(this.monster, index);
    gameManager.stateManager.after();
    this.update();
  }

  restore(abilityCard: AbilityCard) {
    gameManager.stateManager.before(
      'restoreAbility',
      'data.monster.' + this.monster.name,
      abilityCard.name ? this.abilityLabel(abilityCard) : '' + abilityCard.cardId
    );
    gameManager.monsterAbilityManager.restoreAbility(this.monster, abilityCard);
    gameManager.stateManager.after();
    this.update();
  }

  toggleKeepRevealed(index: number) {
    gameManager.stateManager.before('toggleKeepRevealed', 'data.monster.' + this.monster.name, index);
    this.keepRevealed[index] = !this.keepRevealed[index];
    if (this.keepRevealed[index] && !!this.abilityCards[index]) {
      this.abilityCards[index].revealed = true;
    }
    this.monster.revealedAbilities = [...this.keepRevealed];
    gameManager.stateManager.after();
  }

  onRevealedChange(index: number, revealed: boolean) {
    if (!revealed) {
      if (index !== -1 && this.keepRevealed[index]) {
        this.toggleKeepRevealed(index);
      }
    }
  }

  abilityLabel(abilityCard: AbilityCard): string {
    let label = 'data.monster.' + this.monster.name;
    if (abilityCard && abilityCard.name) {
      label = 'data.ability.' + abilityCard.name;
    } else if (this.monster.deck !== this.monster.name) {
      label = 'data.deck.' + this.monster.deck;
      if (label.split('.')[label.split('.').length - 1] === applyPlaceholder(labelManager.getLabel(label)) && this.monster.deck) {
        label = 'data.monster.' + this.monster.deck;
      }
    }

    return applyPlaceholder(labelManager.getLabel(label));
  }

  defaultSort() {
    this.monster.abilities = this.monster.abilities.sort((a, b) => a - b);
    this.update();
  }
}
