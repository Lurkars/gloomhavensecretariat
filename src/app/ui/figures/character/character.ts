import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CharacterManager } from 'src/app/game/businesslogic/CharacterManager';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { Character } from 'src/app/game/model/Character';
import { ConditionType, EntityCondition } from 'src/app/game/model/data/Condition';
import { GameState } from 'src/app/game/model/Game';
import { ghsDefaultDialogPositions, ghsValueSign } from '../../helper/Static';
import { AttackModiferDeckChange } from '../attackmodifier/attackmodifierdeck';
import { AttackModifierDeckFullscreenComponent } from '../attackmodifier/attackmodifierdeck-fullscreen';
import { EntityMenuDialogComponent } from '../entity-menu/entity-menu-dialog';
import { CharacterSheetDialog } from './dialogs/character-sheet-dialog';
import { CharacterLootCardsDialog } from './dialogs/loot-cards';
import { CharacterSummonDialog } from './dialogs/summondialog';
import { CharacterInitiativeDialogComponent } from './cards/initiative-dialog';
import { SummonState } from 'src/app/game/model/Summon';
import { Subscription } from 'rxjs';
import { CharacterBattleGoalsDialog } from '../battlegoal/dialog/battlegoal-dialog';
import { ItemsCharacterDialogComponent } from '../items/character/items-character-dialog';
import { ItemsDialogComponent } from '../items/dialog/items-dialog';
import { EntitiesMenuDialogComponent } from '../entities-menu/entities-menu-dialog';

@Component({
  selector: 'ghs-character',
  templateUrl: './character.html',
  styleUrls: ['./character.scss']
})
export class CharacterComponent implements OnInit, OnDestroy {

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
  token: number = 0;

  summonCount: number = 0;
  activeConditions: EntityCondition[] = [];

  constructor(private dialog: Dialog, private overlay: Overlay) { }

  ngOnInit(): void {
    this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() })
    this.update();
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  update(): void {
    this.summonCount = this.character.summons.filter((summon) => gameManager.entityManager.isAlive(summon)).length;
    this.activeConditions = gameManager.entityManager.activeConditions(this.character);
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
    gameManager.sortFigures(this.character);
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

    if (this.character.initiative != this.initiative) {
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
        gameManager.sortFigures(this.character);
      }
      gameManager.stateManager.after();
    }
  }

  toggleFigure(event: any): void {
    if (!this.character.absent) {
      if (gameManager.game.state == GameState.next && !this.character.exhausted && (!settingsManager.settings.initiativeRequired || this.character.initiative > 0)) {
        const activeSummon = this.character.summons.find((summon) => summon.active);
        if (settingsManager.settings.activeSummons && this.character.active && activeSummon) {
          gameManager.stateManager.before("summonInactive", "data.character." + this.character.name, "data.summon." + activeSummon.name);
        } else {
          gameManager.stateManager.before(this.character.active ? "unsetActive" : "setActive", "data.character." + this.character.name);
        }
        gameManager.roundManager.toggleFigure(this.character);
        gameManager.stateManager.after();
      } else if (settingsManager.settings.initiativeRequired && this.character.initiative <= 0 || gameManager.game.state == GameState.draw) {
        this.openInitiativeDialog(event);
      }
    }
  }

  nextIdentity(event: any): void {
    if (settingsManager.settings.characterIdentities && this.character.identities && this.character.identities.length > 1) {
      gameManager.stateManager.before("nextIdentity", "data.character." + this.character.name);
      this.character.identity++;
      if (this.character.identity >= this.character.identities.length) {
        this.character.identity = 0;
      }
      gameManager.stateManager.after();
      event.preventDefault();
    } else {
      this.openEntityMenu(event);
    }
  }

  openInitiativeDialog(event: any) {
    this.dialog.open(CharacterInitiativeDialogComponent, {
      panelClass: 'dialog',
      data: this.character,
      positionStrategy: this.overlay.position().flexibleConnectedTo(event.target).withPositions(ghsDefaultDialogPositions())
    });
  }

  initiativeDoubleClick(event: any) {
    if (this.character.active && this.character.summons.filter((summon) => gameManager.entityManager.isAlive(summon) && summon.state != SummonState.new).find((summon, index, self) => summon.active && index < self.length - 1)) {
      this.character.summons.forEach((summon) => summon.active = false);
    } else {
      this.openInitiativeDialog(event);
    }
  }

  dragHpMove(value: number) {
    this.health = value;
    if (this.character.health + this.health > this.character.maxHealth) {
      this.health = this.character.maxHealth - this.character.health;
    }
  }

  dragHpEnd(value: number) {
    if (this.health != 0) {
      gameManager.stateManager.before("changeHP", "data.character." + this.character.name, ghsValueSign(this.health));
      gameManager.entityManager.changeHealth(this.character, this.health);
      this.health = 0;
      gameManager.stateManager.after();
    }
  }

  dragXpMove(value: number) {
    this.experience = value;
    if (this.character.experience + this.experience < 0) {
      this.experience = - this.character.experience;
    }
  }

  dragXpEnd(value: number) {
    if (this.experience != 0) {
      gameManager.stateManager.before("changeXP", "data.character." + this.character.name, ghsValueSign(this.experience));
      this.character.experience += this.experience;
      this.experience = 0;
      gameManager.stateManager.after();
    }
  }

  dragTokenMove(value: number) {
    this.token = value;
    if (this.character.primaryToken < 0 && this.character.token + this.token < 0) {
      this.token = - this.character.token;
    } else if (this.character.primaryToken >= 0 && this.character.tokenValues[this.character.primaryToken] + this.token < 0) {
      this.token = - this.character.tokenValues[this.character.primaryToken];
    }
  }

  dragTokenEnd(value: number) {
    if (this.token != 0) {
      if (this.character.primaryToken < 0) {
        gameManager.stateManager.before("setCharacterToken", "data.character." + this.character.name, '' + (this.character.token + this.token));
        this.character.token += this.token;
        this.token = 0;
        gameManager.stateManager.after();
      } else {
        gameManager.stateManager.before("setCharacterTokenValue", "data.character." + this.character.name, this.character.tokens[this.character.primaryToken], '' + (this.character.token + this.token));
        this.character.tokenValues[this.character.primaryToken] += this.token;
        this.token = 0;
        gameManager.stateManager.after();
      }
    }
  }

  dragLootMove(value: number) {
    this.loot = value;
    if (this.character.loot + this.loot < 0) {
      this.loot = - this.character.loot;
    }
  }

  dragLootEnd(value: number) {
    if (this.loot != 0) {
      gameManager.stateManager.before("changeLoot", "data.character." + this.character.name, ghsValueSign(this.loot));
      this.character.loot += this.loot;
      this.loot = 0;
      gameManager.stateManager.after();
    }
  }

  openEntityMenu(event: any): void {
    /*
    const summon = this.character.summons.find((summon) => summon.active);
    if (summon) {
      gameManager.stateManager.before("summonInactive", "data.character." + this.character.name, "data.summon." + summon.name);
      summon.active = false;
      gameManager.stateManager.after();
    } else {
    */
    this.dialog.open(EntityMenuDialogComponent, {
      panelClass: 'dialog',
      data: {
        entity: this.character,
        figure: this.character
      },
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.characterName).withPositions(ghsDefaultDialogPositions())
    });
    // }
  }

  openEntitiesMenu(event: any) {
    this.dialog.open(EntitiesMenuDialogComponent, {
      panelClass: 'dialog',
      data: {
        character: this.character
      },
      positionStrategy: this.overlay.position().flexibleConnectedTo(event.target).withPositions(ghsDefaultDialogPositions())
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
      panelClass: ['dialog-invert'],
      data: this.character
    });
  }

  openBattleGoals(): void {
    this.dialog.open(CharacterBattleGoalsDialog, {
      panelClass: ['dialog'],
      data: { character: this.character, draw: !this.character.battleGoals || this.character.battleGoals.length == 0 }
    });
  }

  openItems(): void {
    if (this.character.progress.items.length == 0) {
      this.dialog.open(ItemsDialogComponent, {
        panelClass: ['dialog'],
        data: { edition: gameManager.game.edition, select: this.character, affordable: true }
      })
    } else {
      this.dialog.open(ItemsCharacterDialogComponent, {
        panelClass: ['dialog'],
        data: this.character
      });
    }
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
      this.character.attackModifierDeck.active = false;
      this.character.attackModifierDeckVisible = false;
    } else if (settingsManager.settings.characterAttackModifierDeckPermanent) {
      this.character.attackModifierDeck.active = true;
      this.character.attackModifierDeckVisible = true;
      this.character.lootCardsVisible = false;
    } else if (settingsManager.settings.automaticAttackModifierFullscreen && settingsManager.settings.portraitMode && (window.innerWidth < 800 || window.innerHeight < 400)) {
      this.character.lootCardsVisible = false;

      const before = new EventEmitter<AttackModiferDeckChange>();
      const after = new EventEmitter<AttackModiferDeckChange>();

      before.subscribe({ next: (change: AttackModiferDeckChange) => this.beforeAttackModifierDeck(change) });
      after.subscribe({ next: (change: AttackModiferDeckChange) => this.afterAttackModifierDeck(change) });

      const dialog = this.dialog.open(AttackModifierDeckFullscreenComponent, {
        backdropClass: 'fullscreen-backdrop',
        data: {
          deck: this.character.attackModifierDeck,
          character: this.character,
          ally: false,
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
      this.character.attackModifierDeck.active = true;
      this.character.attackModifierDeckVisible = true;
      this.character.lootCardsVisible = false;
    }
    gameManager.stateManager.saveLocal();
    gameManager.uiChange.emit();
  }

  toggleLootCardsVisible() {
    if (this.character.lootCardsVisible) {
      this.character.lootCardsVisible = false;
    } else if (settingsManager.settings.automaticAttackModifierFullscreen && settingsManager.settings.portraitMode && (window.innerWidth < 800 || window.innerHeight < 400)) {
      this.character.lootCardsVisible = false;
      this.openLootDeckDialog();
    } else {
      this.character.lootCardsVisible = true;
      this.character.attackModifierDeck.active = false;
      this.character.attackModifierDeckVisible = false;
    }
    gameManager.stateManager.saveLocal();
  }

  openLootDeckDialog() {
    this.dialog.open(CharacterLootCardsDialog, {
      panelClass: 'dialog',
      data: this.character
    });
  }

}