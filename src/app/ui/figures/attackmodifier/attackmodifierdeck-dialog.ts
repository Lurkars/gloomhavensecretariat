import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { NgClass } from '@angular/common';
import { Component, EventEmitter, inject, OnInit } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import {
  additionalTownGuardAttackModifier,
  AttackModifier,
  AttackModifierDeck,
  AttackModifierType,
  Gh2ESealedDeckAttackModifier
} from 'src/app/game/model/data/AttackModifier';
import { ConditionName } from 'src/app/game/model/data/Condition';
import { GameState } from 'src/app/game/model/Game';
import { AttackModifierComponent } from 'src/app/ui/figures/attackmodifier/attackmodifier';
import { AttackModiferDeckChange } from 'src/app/ui/figures/attackmodifier/attackmodifierdeck';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [
    NgClass,
    GhsLabelDirective,
    PointerInputDirective,
    GhsTooltipDirective,
    TrackUUIDPipe,
    AttackModifierComponent,
    CdkDropList,
    CdkDrag,
    CdkDragHandle
  ],
  selector: 'ghs-attackmodifier-deck-dialog',
  templateUrl: './attackmodifierdeck-dialog.html',
  styleUrls: ['./attackmodifierdeck-dialog.scss']
})
export class AttackModifierDeckDialogComponent implements OnInit {
  dialogRef = inject(DialogRef);
  private ghsManager = inject(GhsManager);

  deck: AttackModifierDeck;
  character: Character;
  numeration: string = '';
  before: EventEmitter<AttackModiferDeckChange>;
  after: EventEmitter<AttackModiferDeckChange>;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  reveal: number = 0;
  edit: boolean = false;
  characterIcon: string = '';
  ally: boolean = false;
  newStyle: boolean = false;
  townGuard: boolean = false;
  bbTable: boolean = false;
  bbDrawnIndex: number = 0;

  AttackModifierType = AttackModifierType;
  type: AttackModifierType = AttackModifierType.minus1;
  tgAM: AttackModifier = additionalTownGuardAttackModifier[0];
  currentAttackModifier: number = -1;

  drawing: boolean = false;
  upcomingCards: AttackModifier[] = [];
  discardedCards: AttackModifier[] = [];
  deletedCards: AttackModifier[] = [];
  keepRevealed: boolean[] = [];

  empowerChars: Character[] = [];
  enfeebleChars: Character[] = [];
  activeFaction: string | undefined;
  factionAttackModifier: AttackModifier[] = [];

  data: {
    deck: AttackModifierDeck;
    character: Character;
    ally: boolean;
    numeration: string;
    newStyle: boolean;
    townGuard: boolean;
    before: EventEmitter<AttackModiferDeckChange>;
    after: EventEmitter<AttackModiferDeckChange>;
  } = inject(DIALOG_DATA);

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
    this.deck = this.data.deck;
    this.character = this.data.character;
    this.ally = this.data.ally;
    this.numeration = this.data.numeration;
    this.newStyle = this.data.newStyle;
    this.townGuard = this.data.townGuard;
    this.before = this.data.before;
    this.after = this.data.after;
    this.dialogRef.closed.subscribe(() => {
      this.deck.cards.forEach((am, i) => {
        if (am.revealed && !this.keepRevealed[i]) {
          am.revealed = false;
        }
      });
    });
  }

  ngOnInit(): void {
    if (this.character) {
      this.deck = this.character.attackModifierDeck;
      this.numeration = '' + this.character.number;
      this.characterIcon = this.character.iconUrl;
      gameManager.campaignManager.gh2eFactionUnlocks().forEach((faction) => {
        if (this.deck.cards.some((am) => am.id && am.id.includes(faction))) {
          this.toggleFaction(faction);
          return;
        }
      });
    }
    if (gameManager.bbRules() && settingsManager.settings.bbAm) {
      this.bbTable = true;
    }

    this.deck.cards.forEach((am, i) => {
      this.keepRevealed[i] = am.revealed;
    });

    this.update();
  }

  toggleEdit() {
    this.edit = !this.edit;
    this.bbTable = false;
  }

  toggleBB() {
    this.bbTable = !this.bbTable;
    this.edit = false;
  }

  update() {
    this.upcomingCards = this.deck.cards.filter((attackModifier, index) => index > this.deck.current);
    this.discardedCards = this.deck.cards.filter((AttackModifier, index) => index <= this.deck.current).reverse();
    this.deletedCards = gameManager.attackModifierManager.deletedModifiers(this.deck, this.character, this.townGuard);

    if (!this.character || !gameManager.conditionManager.isImmune(this.character, this.character, ConditionName.empower)) {
      this.empowerChars = gameManager.game.figures
        .filter(
          (figure) =>
            figure instanceof Character &&
            gameManager.entityManager.isAlive(figure) &&
            figure.additionalModifier &&
            figure.additionalModifier.find((perk) => perk.attackModifier && perk.attackModifier.type === AttackModifierType.empower)
        )
        .map((figure) => figure as Character);
    }

    if (!this.character || !gameManager.conditionManager.isImmune(this.character, this.character, ConditionName.enfeeble)) {
      this.enfeebleChars = gameManager.game.figures
        .filter(
          (figure) =>
            figure instanceof Character &&
            gameManager.entityManager.isAlive(figure) &&
            !figure.absent &&
            figure.additionalModifier &&
            figure.additionalModifier.find((perk) => perk.attackModifier && perk.attackModifier.type === AttackModifierType.enfeeble)
        )
        .map((figure) => figure as Character);
    }

    this.bbDrawnIndex = Math.floor(this.deck.current / 3) * 3;
  }

  shuffle(upcoming: boolean = false): void {
    this.before.emit(new AttackModiferDeckChange(this.deck, 'shuffle' + (upcoming ? 'Upcoming' : '')));
    gameManager.attackModifierManager.shuffleModifiers(this.deck, upcoming);
    this.keepRevealed = [];
    this.after.emit(new AttackModiferDeckChange(this.deck, 'shuffle' + (upcoming ? 'Upcoming' : '')));
    this.update();
  }

  removeDrawnDiscards() {
    this.before.emit(new AttackModiferDeckChange(this.deck, 'removeDrawnDiscards'));
    gameManager.attackModifierManager.removeDrawnDiscards(this.deck);
    this.after.emit(new AttackModiferDeckChange(this.deck, 'removeDrawnDiscards'));
    this.update();
  }

  restoreDefault(): void {
    this.before.emit(new AttackModiferDeckChange(this.deck, 'restoreDefault'));
    if (this.character) {
      gameManager.attackModifierBuildManager.mergeAttackModifierDeck(
        this.character.attackModifierDeck,
        gameManager.attackModifierBuildManager.buildCharacterAttackModifierDeck(this.character)
      );
      gameManager.attackModifierBuildManager.fromModel(this.deck, this.character.attackModifierDeck.toModel());
    } else if (this.townGuard) {
      this.deck = gameManager.attackModifierBuildManager.buildTownGuardAttackModifierDeck(
        gameManager.game.party,
        gameManager.campaignManager.campaignData()
      );
    } else {
      this.deck = gameManager.attackModifierBuildManager.defaultMonsterAttackModifierDeck(this.ally);
    }
    this.after.emit(new AttackModiferDeckChange(this.deck, 'restoreDefault'));
    this.update();
  }

  hasDrawnDiscards(): boolean {
    return this.deck.cards.some(
      (attackModifier: AttackModifier, index: number) =>
        index <= this.deck.current &&
        (attackModifier.type === AttackModifierType.bless ||
          attackModifier.type === AttackModifierType.curse ||
          attackModifier.type === AttackModifierType.empower ||
          attackModifier.type === AttackModifierType.enfeeble)
    );
  }

  dropUpcoming(event: CdkDragDrop<AttackModifier[]>) {
    this.moveCard(
      event.container === event.previousContainer ? 'upcoming' : 'discarded',
      event.previousIndex,
      'upcoming',
      event.currentIndex
    );
  }

  dropDiscarded(event: CdkDragDrop<AttackModifier[]>) {
    this.moveCard(
      event.container === event.previousContainer ? 'discarded' : 'upcoming',
      event.previousIndex,
      'discarded',
      event.currentIndex
    );
  }

  private moveCard(fromList: string, fromIndex: number, toList: string, toIndex: number) {
    if (gameManager.attackModifierManager.canMoveCard(this.deck, fromList, fromIndex, toList, toIndex)) {
      this.before.emit(new AttackModiferDeckChange(this.deck, 'reorder'));
      gameManager.attackModifierManager.moveCard(this.deck, fromList, fromIndex, toList, toIndex, this.keepRevealed);
      this.after.emit(new AttackModiferDeckChange(this.deck, 'reorder'));
      this.update();
    }
  }

  toggleKeepRevealed(index: number) {
    this.before.emit(new AttackModiferDeckChange(this.deck, 'toggleKeepRevealed', index));
    this.keepRevealed[index] = !this.keepRevealed[index];
    if (this.keepRevealed[index] && !!this.deck.cards[index]) {
      this.deck.cards[index].revealed = true;
    }
    this.after.emit(new AttackModiferDeckChange(this.deck, 'toggleKeepRevealed', index));
  }

  remove(index: number) {
    if (!gameManager.attackModifierManager.canRemoveCard(this.deck, index)) {
      return;
    }
    this.before.emit(new AttackModiferDeckChange(this.deck, 'removeCard', index));
    gameManager.attackModifierManager.removeCard(this.deck, index);
    this.currentAttackModifier = this.deck.current;
    this.after.emit(new AttackModiferDeckChange(this.deck, 'removeCard', index));
    this.update();
  }

  restore(index: number) {
    const attackModifier = this.deletedCards[index];
    if (!attackModifier || !gameManager.attackModifierManager.canRestoreCard(this.deck, attackModifier, this.character, this.townGuard)) {
      return;
    }
    this.before.emit(new AttackModiferDeckChange(this.deck, 'restoreCard', index));
    gameManager.attackModifierManager.restoreCard(this.deck, attackModifier, this.character, this.townGuard);
    this.after.emit(new AttackModiferDeckChange(this.deck, 'restoreCard', index));
    this.update();
  }

  newFirst(type: AttackModifierType) {
    this.before.emit(new AttackModiferDeckChange(this.deck, 'addCard', 'game.attackModifiers.types.' + type));
    gameManager.attackModifierManager.insertModifier(this.deck, new AttackModifier(type), false);
    this.after.emit(new AttackModiferDeckChange(this.deck, 'addCard', 'game.attackModifiers.types.' + type));
    this.update();
  }

  newShuffle(type: AttackModifierType) {
    this.before.emit(new AttackModiferDeckChange(this.deck, 'addCardShuffled', 'game.attackModifiers.types.' + type));
    gameManager.attackModifierManager.insertModifier(this.deck, new AttackModifier(type), true);
    this.after.emit(new AttackModiferDeckChange(this.deck, 'addCardShuffled', 'game.attackModifiers.types.' + type));
    this.update();
  }

  addModifier() {
    this.before.emit(new AttackModiferDeckChange(this.deck, 'addCard', 'game.attackModifiers.types.' + this.tgAM.type));
    const attackModifier = Object.assign(new AttackModifier(this.tgAM.type), this.tgAM);
    gameManager.attackModifierManager.insertModifier(this.deck, attackModifier, false, true);
    this.after.emit(new AttackModiferDeckChange(this.deck, 'addCard', 'game.attackModifiers.types.' + this.tgAM.type));
    this.update();
  }

  addModifierShuffle() {
    this.before.emit(new AttackModiferDeckChange(this.deck, 'addCard', 'game.attackModifiers.types.' + this.tgAM.type));
    const attackModifier = Object.assign(new AttackModifier(this.tgAM.type), this.tgAM);
    gameManager.attackModifierManager.insertModifier(this.deck, attackModifier, true, true);
    this.after.emit(new AttackModiferDeckChange(this.deck, 'addCard', 'game.attackModifiers.types.' + this.tgAM.type));
    this.update();
  }

  countAttackModifier(type: AttackModifierType): number {
    return this.deck.cards.filter((attackModifier) => {
      return attackModifier.type === type && !attackModifier.character;
    }).length;
  }

  countDrawnAttackModifier(type: AttackModifierType): number {
    return this.deck.cards.filter((attackModifier, index) => {
      return attackModifier.type === type && index <= this.deck.current;
    }).length;
  }

  countUpcomingAdditional(type: AttackModifierType, character: Character): number {
    return gameManager.attackModifierManager.countUpcomingAdditionalModifiers(this.deck, type, character);
  }

  countUpcomingAttackModifier(type: AttackModifierType): number {
    return this.deck.cards.filter((attackModifier, index) => {
      return attackModifier.type === type && index > this.deck.current;
    }).length;
  }

  canChangeAttackModifier(type: AttackModifierType, value: number): boolean {
    return gameManager.attackModifierManager.canChangeModifierCount(this.deck, type, value, !this.character && !this.ally);
  }

  changeAttackModifier(type: AttackModifierType, value: number, label: string) {
    if (this.canChangeAttackModifier(type, value)) {
      this.before.emit(new AttackModiferDeckChange(this.deck, (value < 0 ? 'remove' : 'add') + label));
      gameManager.attackModifierManager.changeModifierCount(this.deck, type, value, !this.character && !this.ally);
      this.after.emit(new AttackModiferDeckChange(this.deck, (value < 0 ? 'remove' : 'add') + label));
      this.update();
    }
  }

  changeBless(value: number) {
    this.changeAttackModifier(AttackModifierType.bless, value, 'Bless');
  }

  changeCurse(value: number) {
    this.changeAttackModifier(AttackModifierType.curse, value, 'Curse');
  }

  changeMinus1Extra(value: number) {
    this.changeAttackModifier(AttackModifierType.minus1extra, value, 'Minus1');
  }

  onRevealedChange(attackModifier: AttackModifier, revealed: boolean) {
    attackModifier.revealed = revealed;
    if (!revealed) {
      const index = this.deck.cards.indexOf(attackModifier);
      if (index !== -1 && this.keepRevealed[index]) {
        this.toggleKeepRevealed(index);
      }
    }
  }

  changeType(prev: boolean = false) {
    if (this.townGuard) {
      let index = additionalTownGuardAttackModifier.indexOf(this.tgAM) + (prev ? -1 : 1);
      if (index < 0) {
        index = additionalTownGuardAttackModifier.length - 1;
      } else if (index >= additionalTownGuardAttackModifier.length) {
        index = 0;
      }
      this.tgAM = additionalTownGuardAttackModifier[index];
    } else {
      let index = Object.values(AttackModifierType).indexOf(this.type) + (prev ? -1 : 1);
      if (index < 0) {
        index = Object.values(AttackModifierType).length - 1;
      } else if (index >= Object.values(AttackModifierType).length) {
        index = 0;
      }

      this.type = Object.values(AttackModifierType)[index];

      if (
        [
          AttackModifierType.plus,
          AttackModifierType.plus3,
          AttackModifierType.plus4,
          AttackModifierType.plusX,
          AttackModifierType.invalid,
          AttackModifierType.minus,
          AttackModifierType.minus1extra,
          AttackModifierType.empower,
          AttackModifierType.enfeeble,
          AttackModifierType.townguard,
          AttackModifierType.success,
          AttackModifierType.wreck,
          AttackModifierType.imbue,
          AttackModifierType.advancedImbue
        ].includes(this.type)
      ) {
        this.changeType(prev);
      }
    }
    this.update();
  }

  private countAdditional(character: Character | undefined, type: AttackModifierType, all: boolean): number {
    if (!character) {
      return -1;
    }
    const available = gameManager.attackModifierManager.additionalAvailable(character, type);
    return all ? available + gameManager.attackModifierManager.countUpcomingAdditional(character, type) : available;
  }

  countEmpower(index: number, all: boolean = false): number {
    return this.countAdditional(this.empowerChars[index], AttackModifierType.empower, all);
  }

  countEnfeeble(index: number, all: boolean = false): number {
    return this.countAdditional(this.enfeebleChars[index], AttackModifierType.enfeeble, all);
  }

  private changeAdditional(character: Character | undefined, type: AttackModifierType, value: number, label: string) {
    if (gameManager.attackModifierManager.canChangeAdditionalCount(this.deck, character, type, value, this.character)) {
      this.before.emit(new AttackModiferDeckChange(this.deck, (value < 0 ? 'remove' : 'add') + label));
      gameManager.attackModifierManager.changeAdditionalCount(this.deck, character, type, value, this.character);
      this.after.emit(new AttackModiferDeckChange(this.deck, (value < 0 ? 'remove' : 'add') + label));
      this.update();
    }
  }

  changeEmpower(index: number, value: number) {
    this.changeAdditional(this.empowerChars[index], AttackModifierType.empower, value, 'Empower');
  }

  changeEnfeeble(index: number, value: number) {
    this.changeAdditional(this.enfeebleChars[index], AttackModifierType.enfeeble, value, 'Enfeeble');
  }

  toggleFaction(faction: string) {
    this.factionAttackModifier = [];
    if (this.activeFaction === faction) {
      this.activeFaction = undefined;
    } else {
      this.activeFaction = faction;
      this.factionAttackModifier = Gh2ESealedDeckAttackModifier.filter((am) => am.id && am.id.startsWith('gh2e-' + faction));
    }
  }

  toggleFactionAm(attackModifier: AttackModifier, force: boolean = false) {
    const value = !this.hasFactionModifier(attackModifier);
    if (
      this.character &&
      gameManager.attackModifierManager.canSetFactionModifier(this.deck, this.character, attackModifier, value, force)
    ) {
      const type = value ? 'addFactionModifier' : 'removeFactionModifier';
      this.before.emit(new AttackModiferDeckChange(this.deck, type, attackModifier.id));
      gameManager.attackModifierManager.setFactionModifier(this.deck, this.character, attackModifier, value, force);
      this.after.emit(new AttackModiferDeckChange(this.deck, type, attackModifier.id));
    }
  }

  hasFactionModifier(attackModifier: AttackModifier): boolean {
    return this.deck.cards.some((am) => am.id === attackModifier.id);
  }

  anyHasFactionModifier(attackModifier: AttackModifier): boolean {
    return gameManager.attackModifierManager.factionModifierInUse(this.character, attackModifier.id);
  }
}
