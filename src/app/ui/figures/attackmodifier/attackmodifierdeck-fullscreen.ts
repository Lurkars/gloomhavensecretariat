import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, EventEmitter, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { AttackModifierDeck } from "src/app/game/model/data/AttackModifier";
import { Character } from "src/app/game/model/Character";
import { AttackModiferDeckChange } from "./attackmodifierdeck";
import { ghsDialogClosingHelper } from "../../helper/Static";

@Component({
	standalone: false,
  selector: 'ghs-attackmodifier-deck-fullscreen',
  templateUrl: './attackmodifierdeck-fullscreen.html',
  styleUrls: ['./attackmodifierdeck-fullscreen.scss',]
})
export class AttackModifierDeckFullscreenComponent {

  deck: AttackModifierDeck;
  character: Character;
  ally: boolean;
  numeration: string = "";
  newStyle: boolean = false;
  townGuard: boolean = false;
  before: EventEmitter<AttackModiferDeckChange>;
  after: EventEmitter<AttackModiferDeckChange>;

  gameManager: GameManager = gameManager;

  constructor(@Inject(DIALOG_DATA) data: { deck: AttackModifierDeck, character: Character, ally: boolean, numeration: string, newStyle: boolean, townGuard: boolean, before: EventEmitter<AttackModiferDeckChange>, after: EventEmitter<AttackModiferDeckChange> }, public dialogRef: DialogRef) {
    this.deck = data.deck;
    this.character = data.character;
    this.ally = data.ally;
    this.numeration = data.numeration;
    this.newStyle = data.newStyle;
    this.townGuard = data.townGuard;
    this.before = data.before;
    this.after = data.after;
  };

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

