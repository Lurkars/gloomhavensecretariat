import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Component, ElementRef, EventEmitter, Input, ViewChild } from '@angular/core';
import { CharacterManager } from 'src/app/game/businesslogic/CharacterManager';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifierType } from 'src/app/game/model/AttackModifier';
import { Character } from 'src/app/game/model/Character';
import { ConditionType } from 'src/app/game/model/Condition';
import { GameState } from 'src/app/game/model/Game';
import { ghsDefaultDialogPositions, ghsValueSign } from '../../helper/Static';
import { AttackModiferDeckChange } from '../attackmodifier/attackmodifierdeck';
import { AttackModifierDeckFullscreenComponent } from '../attackmodifier/attackmodifierdeck-fullscreen';
import { EntityMenuDialogComponent } from '../entity-menu/entity-menu-dialog';
import { CharacterInitiativeDialogComponent } from './cards/initiative';
import { CharacterSheetDialog } from './dialogs/character-sheet';
import { CharacterSummonDialog } from './dialogs/summondialog';

@Component({
  selector: 'ghs-character',
  templateUrl: './character.html',
  styleUrls: ['./character.scss']
})
export class CharacterComponent {

  @Input() character!: Character;

  @ViewChild('charactertitle', { static: false }) titleInput!: ElementRef;
  @ViewChild('characterName') characterName!: ElementRef;
  @ViewChild('summonButton') summonButton!: ElementRef;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  characterManager: CharacterManager = gameManager.characterManager;

  GameState = GameState;
  ConditionType = ConditionType;
  AttackModifierType = AttackModifierType;
  levelDialog: boolean = false;

  initiative: number = -1;
  health: number = 0;
  experience: number = 0;
  loot: number = 0;
  maxHp: number = 0;

  constructor(private element: ElementRef, private dialog: Dialog, private overlay: Overlay) { }

  emptySummons(): boolean {
    return this.character.summons.length == 0 || this.character.summons.every((summon) => summon.dead);
  }

  beforeAttackModifierDeck(change: AttackModiferDeckChange) {
    gameManager.stateManager.before("updateAttackModifierDeck." + change.type, "data.character." + this.character.name, ...change.values);
  }

  afterAttackModifierDeck(change: AttackModiferDeckChange) {
    this.character.attackModifierDeck = change.deck;
    gameManager.stateManager.after();
  }

  exhausted() {
    this.character.exhausted = !this.character.exhausted;
    if (this.character.exhausted) {
      this.character.off = true;
      this.character.active = false;
    } else {
      this.character.off = false;
    }
    gameManager.sortFigures();
  }

  dragInitiativeMove(value: number) {

    if (value > 99) {
      value = 99;
    } else if (value < 0) {
      value = 0;
    }

    if (gameManager.game.state == GameState.next && value == 0 && settingsManager.settings.initiativeRequired) {
      value = 1;
    }

    if (this.initiative == -1) {
      this.initiative = this.character.initiative;
    }

    this.character.initiative = value;
    this.character.initiativeVisible = true;
    this.character.longRest = false;
    if (value == 99) {
      this.character.longRest = true;
    }
  }

  dragInitiativeEnd(value: number) {
    if (value > 99) {
      value = 99;
    } else if (value < 0) {
      value = 0;
    }

    if (gameManager.game.state == GameState.next && value == 0 && settingsManager.settings.initiativeRequired) {
      value = 1;
    }

    this.character.initiative = this.initiative;
    gameManager.stateManager.before("setInitiative", "data.character." + this.character.name, "" + value);
    this.character.initiative = value;
    this.character.longRest = false;
    if (value == 99) {
      this.character.longRest = true;
    }
    this.initiative = -1;
    if (this.character instanceof Character) {
      this.character.initiativeVisible = true;
    }
    if (gameManager.game.state == GameState.next) {
      gameManager.sortFigures();
    }
    gameManager.stateManager.after();

  }

  toggleFigure(event: any): void {
    if (!this.character.absent) {
      if (gameManager.game.state == GameState.next && !this.character.exhausted && (!settingsManager.settings.initiativeRequired || this.character.initiative > 0)) {
        gameManager.stateManager.before(this.character.active ? "unsetActive" : "setActive", "data.character." + this.character.name);
        gameManager.roundManager.toggleFigure(this.character);
        gameManager.stateManager.after(250);
      } else if (settingsManager.settings.initiativeRequired && this.character.initiative <= 0 || gameManager.game.state == GameState.draw) {
        this.openInitiativeDialog(event);
      }
    }
  }

  openInitiativeDialog(event: any) {
    this.dialog.open(CharacterInitiativeDialogComponent, {
      panelClass: 'dialog',
      data: this.character,
      positionStrategy: this.overlay.position().flexibleConnectedTo(event.target).withPositions(ghsDefaultDialogPositions())
    });
  }

  dragHpMove(value: number) {
    const dragFactor = 4 * this.element.nativeElement.offsetWidth / window.innerWidth;
    this.health = Math.floor(value / dragFactor);
    if (this.character.health + this.health > this.character.maxHealth) {
      this.health = this.character.maxHealth - this.character.health;
    } else if (this.character.health + this.health < 0) {
      this.health = - this.character.health;
    }
  }

  dragHpEnd(value: number) {
    if (this.health != 0) {
      gameManager.stateManager.before("changeHP", "data.character." + this.character.name, ghsValueSign(this.health));
      gameManager.entityManager.changeHealth(this.character, this.health);
      if (this.character.health <= 0 || this.character.exhausted && this.health >= 0 && this.character.health > 0) {
        this.exhausted();
      }
      this.health = 0;
    }
    gameManager.stateManager.after();
  }

  dragXpMove(value: number) {
    const dragFactor = 4 * this.element.nativeElement.offsetWidth / window.innerWidth;
    this.experience = Math.floor(value / dragFactor);
    if (this.character.experience + this.experience < 0) {
      this.experience = - this.character.experience;
    }
  }

  dragXpEnd(value: number) {
    if (this.experience != 0) {
      gameManager.stateManager.before("changeXP", "data.character." + this.character.name, ghsValueSign(this.experience));
      this.character.experience += this.experience;
      this.experience = 0;
    }
    gameManager.stateManager.after();
  }

  dragLootMove(value: number) {
    const dragFactor = 4 * this.element.nativeElement.offsetWidth / window.innerWidth;
    this.loot = Math.floor(value / dragFactor);
    if (this.character.loot + this.loot < 0) {
      this.loot = - this.character.loot;
    }
  }

  dragLootEnd(value: number) {
    if (this.loot != 0) {
      gameManager.stateManager.before("changeLoot", "data.character." + this.character.name, ghsValueSign(this.loot));
      this.character.loot += this.loot;
      this.loot = 0;
    }
    gameManager.stateManager.after();
  }

  openEntityMenu(event: any): void {
    this.dialog.open(EntityMenuDialogComponent, {
      panelClass: 'dialog',
      data: {
        entity: this.character,
        figure: this.character
      },
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.characterName).withPositions(ghsDefaultDialogPositions())
    });
  }

  openSummonDialog(event: any): void {
    this.dialog.open(CharacterSummonDialog, {
      panelClass: 'dialog',
      data: this.character,
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.summonButton).withPositions(ghsDefaultDialogPositions('left'))
    });
  }

  openCharacterSheet(): void {
    this.dialog.open(CharacterSheetDialog, {
      panelClass: 'dialog-invert',
      data: this.character
    });
  }

  characterFullView() {
    gameManager.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        figure.fullview = false;
      }
    });
    this.character.fullview = true;
    gameManager.stateManager.saveLocal();
    gameManager.uiChange.emit();
  }


  toggleAttackModifierDeckVisible() {
    if (this.character.attackModifierDeckVisible) {
      this.character.attackModifierDeckVisible = false;
    } else if (settingsManager.settings.automaticAttackModifierFullscreen && (window.innerWidth < 800 || window.innerHeight < 400)) {

      const before = new EventEmitter<AttackModiferDeckChange>();
      const after = new EventEmitter<AttackModiferDeckChange>();

      before.subscribe({ next: (change: AttackModiferDeckChange) => this.beforeAttackModifierDeck(change) });
      after.subscribe({ next: (change: AttackModiferDeckChange) => this.afterAttackModifierDeck(change) });

      const dialog = this.dialog.open(AttackModifierDeckFullscreenComponent, {
        backdropClass: 'fullscreen-backdrop',
        data: {
          deck: this.character.attackModifierDeck,
          character: this.character,
          numeration: "" + this.character.number,
          before: before,
          after: after
        }
      });

      dialog.closed.subscribe({
        next: () => {
          before.unsubscribe();
          after.unsubscribe();
        }
      })

    } else {
      this.character.attackModifierDeckVisible = true;
    }
    gameManager.stateManager.saveLocal();
  }

}