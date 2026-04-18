import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { AttackModifierDeck } from 'src/app/game/model/data/AttackModifier';
import { AttackModiferDeckChange, AttackModifierDeckComponent } from 'src/app/ui/figures/attackmodifier/attackmodifierdeck';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
  imports: [NgClass, GhsLabelDirective, forwardRef(() => AttackModifierDeckComponent)],
  selector: 'ghs-attackmodifier-deck-fullscreen',
  templateUrl: './attackmodifierdeck-fullscreen.html',
  styleUrls: ['./attackmodifierdeck-fullscreen.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttackModifierDeckFullscreenComponent {
  dialogRef = inject(DialogRef);

  deck: AttackModifierDeck;
  character: Character;
  ally: boolean;
  numeration: string = '';
  newStyle: boolean = false;
  townGuard: boolean = false;
  before: EventEmitter<AttackModiferDeckChange>;
  after: EventEmitter<AttackModiferDeckChange>;

  gameManager: GameManager = gameManager;

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
    this.deck = this.data.deck;
    this.character = this.data.character;
    this.ally = this.data.ally;
    this.numeration = this.data.numeration;
    this.newStyle = this.data.newStyle;
    this.townGuard = this.data.townGuard;
    this.before = this.data.before;
    this.after = this.data.after;
  }

  beforeAttackModifierDeck(change: AttackModiferDeckChange) {
    this.before.emit(change);
  }

  afterAttackModifierDeck(change: AttackModiferDeckChange) {
    this.after.emit(change);
  }

  vertical(): boolean {
    return window.innerWidth < 800;
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }
}
