import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, ElementRef, EventEmitter, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { AttackModifier, AttackModifierDeck, AttackModifierType, additionalTownGuardAttackModifier } from "src/app/game/model/data/AttackModifier";
import { ConditionName } from "src/app/game/model/data/Condition";
import { AttackModiferDeckChange } from "./attackmodifierdeck";

@Component({
  standalone: false,
  selector: 'ghs-attackmodifier-deck-dialog',
  templateUrl: './attackmodifierdeck-dialog.html',
  styleUrls: ['./attackmodifierdeck-dialog.scss',]
})
export class AttackModifierDeckDialogComponent implements OnInit, OnDestroy {

  deck: AttackModifierDeck;
  character: Character;
  numeration: string = "";
  before: EventEmitter<AttackModiferDeckChange>;
  after: EventEmitter<AttackModiferDeckChange>;

  @ViewChild('menu') menuElement!: ElementRef;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  reveal: number = 0;
  edit: boolean = false;
  maxHeight: string = "";
  characterIcon: string = "";
  ally: boolean = false;
  newStyle: boolean = false;
  townGuard: boolean = false;
  bbTable: boolean = false;

  AttackModifierType = AttackModifierType;
  type: AttackModifierType = AttackModifierType.minus1;
  tgAM: AttackModifier = additionalTownGuardAttackModifier[0];
  currentAttackModifier: number = -1;

  drawing: boolean = false;
  upcomingCards: AttackModifier[] = [];
  discardedCards: AttackModifier[] = [];
  deletedCards: AttackModifier[] = [];

  empowerChars: Character[] = [];
  enfeebleChars: Character[] = [];

  constructor(@Inject(DIALOG_DATA) data: { deck: AttackModifierDeck, character: Character, ally: boolean, numeration: string, newStyle: boolean, townGuard: boolean, before: EventEmitter<AttackModiferDeckChange>, after: EventEmitter<AttackModiferDeckChange> }, public dialogRef: DialogRef) {
    this.deck = data.deck;
    this.character = data.character;
    this.ally = data.ally;
    this.numeration = data.numeration;
    this.newStyle = data.newStyle;
    this.townGuard = data.townGuard;
    this.before = data.before;
    this.after = data.after;
    this.dialogRef.closed.subscribe(() => {
      this.upcomingCards.forEach((am) => am.revealed = false);
    })
  };

  ngOnInit(): void {
    if (this.character) {
      this.deck = this.character.attackModifierDeck;
      this.numeration = "" + this.character.number;
      this.characterIcon = this.character.iconUrl;
    }
    setTimeout(() => {
      this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
    }, !settingsManager.settings.animations ? 0 : 250);
    this.update();
    this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() });
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  toggleEdit() {
    this.edit = !this.edit;
    this.bbTable = false;
    setTimeout(() => {
      this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
    }, 0);
  }

  toggleBB() {
    this.bbTable = !this.bbTable;
    this.edit = false;
    setTimeout(() => {
      this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
    }, 0);
  }

  update() {
    this.upcomingCards = this.deck.cards.filter((attackModifier, index) => index > this.deck.current);
    this.discardedCards = this.deck.cards.filter((AttackModifier, index) => index <= this.deck.current).reverse();
    let originalDeck: AttackModifierDeck | undefined;
    if (this.character) {
      originalDeck = gameManager.attackModifierManager.buildCharacterAttackModifierDeck(this.character);
    } else if (this.townGuard) {
      originalDeck = gameManager.attackModifierManager.buildTownGuardAttackModifierDeck(gameManager.game.party, gameManager.campaignData());
      gameManager.game.party.townGuardDeck = this.deck.toModel();
    } else {
      originalDeck = new AttackModifierDeck();
    }

    this.deck.cards.forEach((modifier) => {
      if (originalDeck) {
        const card = originalDeck.cards.find((orginalCard) => orginalCard.id == modifier.id);
        if (card) {
          originalDeck.cards.splice(originalDeck.cards.indexOf(card), 1);
        }
      }
    })

    this.deletedCards = originalDeck.cards;

    if (!this.character || !gameManager.entityManager.isImmune(this.character, this.character, ConditionName.empower)) {
      this.empowerChars = gameManager.game.figures.filter((figure) => figure instanceof Character && gameManager.entityManager.isAlive(figure) && figure.additionalModifier && figure.additionalModifier.find((perk) => perk.attackModifier && perk.attackModifier.type == AttackModifierType.empower)).map((figure) => figure as Character);
    }

    if (!this.character || !gameManager.entityManager.isImmune(this.character, this.character, ConditionName.enfeeble)) {
      this.enfeebleChars = gameManager.game.figures.filter((figure) => figure instanceof Character && gameManager.entityManager.isAlive(figure) && !figure.absent && figure.additionalModifier && figure.additionalModifier.find((perk) => perk.attackModifier && perk.attackModifier.type == AttackModifierType.enfeeble)).map((figure) => figure as Character);
    }
  }

  shuffle(upcoming: boolean = false): void {
    this.before.emit(new AttackModiferDeckChange(this.deck, "shuffle" + (upcoming ? "Upcoming" : "")));
    gameManager.attackModifierManager.shuffleModifiers(this.deck, upcoming);
    this.after.emit(new AttackModiferDeckChange(this.deck, "shuffle" + (upcoming ? "Upcoming" : "")));
    this.update();
  }

  removeDrawnDiscards() {
    this.before.emit(new AttackModiferDeckChange(this.deck, "removeDrawnDiscards"));
    gameManager.attackModifierManager.removeDrawnDiscards(this.deck);
    this.after.emit(new AttackModiferDeckChange(this.deck, "removeDrawnDiscards"));
    this.update();
  }

  restoreDefault(): void {
    this.before.emit(new AttackModiferDeckChange(this.deck, "restoreDefault"));
    if (this.character) {
      this.character.mergeAttackModifierDeck(gameManager.attackModifierManager.buildCharacterAttackModifierDeck(this.character));
      gameManager.attackModifierManager.fromModel(this.deck, this.character.attackModifierDeck.toModel())
    } else if (this.townGuard) {
      this.deck = gameManager.attackModifierManager.buildTownGuardAttackModifierDeck(gameManager.game.party, gameManager.campaignData());
      gameManager.game.party.townGuardDeck = this.deck.toModel();
    } else if (!gameManager.bbRules()) {
      this.deck = new AttackModifierDeck();
    } else {
      const editionData = gameManager.editionData.find((editionData) => editionData.edition == 'bb' && editionData.monsterAmTables && editionData.monsterAmTables.length);
      if (editionData) {
        const monsterDifficulty = gameManager.levelManager.bbMonsterDifficutly();
        this.deck = new AttackModifierDeck(editionData.monsterAmTables[monsterDifficulty].map((value) => new AttackModifier(value as AttackModifierType)), settingsManager.settings.bbAm);
      } else {
        this.deck = new AttackModifierDeck();
      }
    }
    this.after.emit(new AttackModiferDeckChange(this.deck, "restoreDefault"));
    this.update();
  }

  hasDrawnDiscards(): boolean {
    return this.deck.cards.some(
      (attackModifier: AttackModifier, index: number) =>
        index <= this.deck.current &&
        (attackModifier.type == AttackModifierType.bless ||
          attackModifier.type == AttackModifierType.curse ||
          attackModifier.type == AttackModifierType.empower ||
          attackModifier.type == AttackModifierType.enfeeble)
    );
  }

  dropUpcoming(event: CdkDragDrop<AttackModifier[]>) {
    this.before.emit(new AttackModiferDeckChange(this.deck, "reorder"));
    if (event.container == event.previousContainer) {
      const offset = this.deck.current + 1;
      moveItemInArray(this.deck.cards, event.previousIndex + offset, event.currentIndex + offset);
    } else {
      const offset = this.deck.current;
      moveItemInArray(this.deck.cards, offset - event.previousIndex, event.currentIndex + offset);
      this.deck.current = this.deck.current - 1;
    }
    this.after.emit(new AttackModiferDeckChange(this.deck, "reorder"));
    this.update();
  }

  dropDiscarded(event: CdkDragDrop<AttackModifier[]>) {
    this.before.emit(new AttackModiferDeckChange(this.deck, "reorder"));
    if (event.container == event.previousContainer) {
      moveItemInArray(this.deck.cards, this.deck.current - event.previousIndex, this.deck.current - event.currentIndex);
    } else {
      this.deck.current = this.deck.current + 1;
      const offset = this.deck.current;
      moveItemInArray(this.deck.cards, event.previousIndex + offset, offset - event.currentIndex);
      this.deck.cards[offset - event.currentIndex].revealed = true;
    }
    this.after.emit(new AttackModiferDeckChange(this.deck, "reorder"));
    this.update();
  }

  remove(index: number) {
    this.before.emit(new AttackModiferDeckChange(this.deck, "removeCard", index));
    if (index <= this.deck.current) {
      this.deck.current--;
      this.currentAttackModifier = this.deck.current;
    }
    this.deck.cards.splice(index, 1);
    this.after.emit(new AttackModiferDeckChange(this.deck, "removeCard", index));
    this.update();
  }

  restore(index: number) {
    this.before.emit(new AttackModiferDeckChange(this.deck, "restoreCard", index));
    this.deck.cards.splice(this.deck.current + 1, 0, this.deletedCards[index]);
    this.after.emit(new AttackModiferDeckChange(this.deck, "restoreCard", index));
    this.update();
  }

  newFirst(type: AttackModifierType) {
    this.before.emit(new AttackModiferDeckChange(this.deck, "addCard", "game.attackModifiers.types." + type));
    let attackModifier = new AttackModifier(type);
    attackModifier.revealed = true;
    this.deck.cards.splice(this.deck.current + 1, 0, attackModifier);
    this.after.emit(new AttackModiferDeckChange(this.deck, "addCard", "game.attackModifiers.types." + type));
    this.update();
  }

  newShuffle(type: AttackModifierType) {
    this.before.emit(new AttackModiferDeckChange(this.deck, "addCardShuffled", "game.attackModifiers.types." + type));
    this.deck.cards.splice(this.deck.current + 1 + Math.random() * (this.deck.cards.length - this.deck.current), 0, new AttackModifier(type));
    this.after.emit(new AttackModiferDeckChange(this.deck, "addCardShuffled", "game.attackModifiers.types." + type));
    this.update();
  }

  addModifier() {
    this.before.emit(new AttackModiferDeckChange(this.deck, "addCard", "game.attackModifiers.types." + this.tgAM.type));
    let attackModifier = this.tgAM.clone();
    attackModifier.revealed = true;
    if (!this.deck.attackModifiers.find((am) => am.id == attackModifier.id)) {
      this.deck.attackModifiers.push(attackModifier);
    }
    this.deck.cards.splice(this.deck.current + 1, 0, attackModifier);
    this.after.emit(new AttackModiferDeckChange(this.deck, "addCard", "game.attackModifiers.types." + this.tgAM.type));
    this.update();
  }

  addModifierShuffle() {
    this.before.emit(new AttackModiferDeckChange(this.deck, "addCard", "game.attackModifiers.types." + this.tgAM.type));
    let attackModifier = this.tgAM.clone();
    this.deck.cards.splice(this.deck.current + 1 + Math.random() * (this.deck.cards.length - this.deck.current), 0, attackModifier);
    if (!this.deck.attackModifiers.find((am) => am.id == attackModifier.id)) {
      this.deck.attackModifiers.push(attackModifier);
    }
    this.after.emit(new AttackModiferDeckChange(this.deck, "addCard", "game.attackModifiers.types." + this.tgAM.type));
    this.update();
  }

  countAttackModifier(type: AttackModifierType): number {
    return this.deck.cards.filter((attackModifier) => {
      return attackModifier.type == type && !attackModifier.character;
    }).length;
  }

  countDrawnAttackModifier(type: AttackModifierType): number {
    return this.deck.cards.filter((attackModifier, index) => {
      return attackModifier.type == type && index <= this.deck.current;
    }).length;
  }

  countUpcomingAttackModifier(type: AttackModifierType, idPrefix: string | undefined = undefined): number {
    return this.deck.cards.filter((attackModifier, index) => {
      return attackModifier.type == type && index > this.deck.current && (!idPrefix || attackModifier.id && attackModifier.id.startsWith(idPrefix));
    }).length;
  }

  changeAttackModifier(type: AttackModifierType, value: number) {
    if (value > 0) {
      if (type == AttackModifierType.bless && gameManager.attackModifierManager.countUpcomingBlesses() >= 10) {
        return;
      } else if (type == AttackModifierType.curse && gameManager.attackModifierManager.countUpcomingCurses((!this.character && !this.ally)) >= 10) {
        return;
      } else if (type == AttackModifierType.minus1 && gameManager.attackModifierManager.countExtraMinus1() >= 15) {
        return;
      }

      gameManager.attackModifierManager.addModifier(this.deck, new AttackModifier(type));
    } else if (value < 0) {
      const card = this.deck.cards.find((attackModifier, index) => {
        return attackModifier.type == type && index > this.deck.current;
      });
      if (card) {
        this.deck.cards.splice(this.deck.cards.indexOf(card), 1);
      }
    }
    this.update();
  }

  changeBless(value: number) {
    this.before.emit(new AttackModiferDeckChange(this.deck, value < 0 ? "removeBless" : "addBless"));
    this.changeAttackModifier(AttackModifierType.bless, value);
    this.after.emit(new AttackModiferDeckChange(this.deck, value < 0 ? "removeBless" : "addBless"));
    this.update();
  }

  changeCurse(value: number) {
    this.before.emit(new AttackModiferDeckChange(this.deck, value < 0 ? "removeCurse" : "addCurse"));
    this.changeAttackModifier(AttackModifierType.curse, value);
    this.after.emit(new AttackModiferDeckChange(this.deck, value < 0 ? "removeCurse" : "addCurse"));
    this.update();
  }

  changeMinus1Extra(value: number) {
    this.before.emit(new AttackModiferDeckChange(this.deck, value < 0 ? "removeMinus1" : "addMinus1"));
    this.changeAttackModifier(AttackModifierType.minus1extra, value);
    this.after.emit(new AttackModiferDeckChange(this.deck, value < 0 ? "removeMinus1" : "addMinus1"));
    this.update();
  }

  onChange(attackModifier: AttackModifier, revealed: boolean) {
    attackModifier.revealed = revealed;
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

      if ([AttackModifierType.plus, AttackModifierType.plus3, AttackModifierType.plus4, AttackModifierType.plusX, AttackModifierType.invalid, AttackModifierType.minus, AttackModifierType.minus1extra, AttackModifierType.empower, AttackModifierType.enfeeble, AttackModifierType.townguard, AttackModifierType.success, AttackModifierType.wreck].indexOf(this.type) != -1) {
        this.changeType(prev);
      }
    }
    this.update();
  }

  countEmpower(index: number, all: boolean = false): number {
    return this.empowerChars[index] ? this.empowerChars[index].additionalModifier.filter((perk) => perk.attackModifier && perk.attackModifier.type == AttackModifierType.empower).map((perk) => perk.count).reduce((a, b) => a + b) - (all ? 0 : gameManager.attackModifierManager.countUpcomingAdditional(this.empowerChars[index], AttackModifierType.empower)) : -1
  }

  countEnfeeble(index: number, all: boolean = false): number {
    return this.enfeebleChars[index] ? this.enfeebleChars[index].additionalModifier.filter((perk) => perk.attackModifier && perk.attackModifier.type == AttackModifierType.enfeeble).map((perk) => perk.count).reduce((a, b) => a + b) - (all ? 0 : gameManager.attackModifierManager.countUpcomingAdditional(this.enfeebleChars[index], AttackModifierType.enfeeble)) : -1
  }

  changeEmpower(index: number, value: number) {
    if (this.empowerChars[index]) {
      this.before.emit(new AttackModiferDeckChange(this.deck, value < 0 ? "removeEmpower" : "addEmpower"));
      const additional = gameManager.attackModifierManager.getAdditional(this.empowerChars[index], AttackModifierType.empower);
      if (value > 0) {
        for (let i = 0; i < Math.min(value, additional.length); i++) {
          gameManager.attackModifierManager.addModifier(this.deck, additional[i]);
        }
      } else {
        for (let i = 0; i < value * -1; i++) {
          const empower = this.deck.cards.find((am, index) => this.empowerChars[index] && index > this.deck.current && am.type == AttackModifierType.empower && am.id && am.id.startsWith("additional-" + this.empowerChars[index].name));
          if (empower) {
            this.deck.cards.splice(this.deck.cards.indexOf(empower), 1);
          }
        }
      }
      this.after.emit(new AttackModiferDeckChange(this.deck, value < 0 ? "removeEmpower" : "addEmpower"));
      this.update();
    }
  }

  changeEnfeeble(index: number, value: number) {
    if (this.enfeebleChars[index]) {
      this.before.emit(new AttackModiferDeckChange(this.deck, value < 0 ? "removeEnfeeble" : "addEnfeeble"));
      const additional = gameManager.attackModifierManager.getAdditional(this.enfeebleChars[index], AttackModifierType.enfeeble);
      if (value > 0) {
        for (let i = 0; i < Math.min(value, additional.length); i++) {
          gameManager.attackModifierManager.addModifier(this.deck, additional[i]);
        }
      } else {
        for (let i = 0; i < value * -1; i++) {
          const enfeeble = this.deck.cards.find((am, index) => this.empowerChars[index] && index > this.deck.current && am.type == AttackModifierType.enfeeble && am.id && am.id.startsWith("additional-" + this.empowerChars[index].name));
          if (enfeeble) {
            this.deck.cards.splice(this.deck.cards.indexOf(enfeeble), 1);
          }
        }
      }
      this.after.emit(new AttackModiferDeckChange(this.deck, value < 0 ? "removeEnfeeble" : "addEnfeeble"));
      this.update();
    }
  }
}

