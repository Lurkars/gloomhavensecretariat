import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, EventEmitter, Inject } from "@angular/core";
import { AttackModifierDeck } from "src/app/game/model/AttackModifier";
import { Character } from "src/app/game/model/Character";
import { AttackModiferDeckChange } from "./attackmodifierdeck";

@Component({
  selector: 'ghs-attackmodifier-deck-fullscreen',
  templateUrl: './attackmodifierdeck-fullscreen.html',
  styleUrls: [ './attackmodifierdeck-fullscreen.scss', ]
})
export class AttackModifierDeckFullscreenComponent {

  deck: AttackModifierDeck;
  character: Character;
  numeration: string = "";
  before: EventEmitter<AttackModiferDeckChange>;
  after: EventEmitter<AttackModiferDeckChange>;

  constructor(@Inject(DIALOG_DATA) private data: { deck: AttackModifierDeck, character: Character, numeration: string, before: EventEmitter<AttackModiferDeckChange>, after: EventEmitter<AttackModiferDeckChange> }, public dialogRef: DialogRef) {
    this.deck = data.deck;
    this.character = data.character;
    this.numeration = data.numeration;
    this.before = data.before;
    this.after = data.after;
  };

  beforeAttackModifierDeck(change: AttackModiferDeckChange) {
    this.before.emit(change);
  }

  afterAttackModifierDeck(change: AttackModiferDeckChange) {
    this.after.emit(change);
  }
}

