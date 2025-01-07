import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { CharacterManager } from 'src/app/game/businesslogic/CharacterManager';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { ConditionType, EntityCondition } from 'src/app/game/model/data/Condition';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { GameState } from 'src/app/game/model/Game';
import { SummonState } from 'src/app/game/model/Summon';
import { ghsDefaultDialogPositions, ghsValueSign } from '../../helper/Static';
import { AttackModiferDeckChange } from '../attackmodifier/attackmodifierdeck';
import { AttackModifierDeckFullscreenComponent } from '../attackmodifier/attackmodifierdeck-fullscreen';
import { CharacterBattleGoalsDialog } from '../battlegoal/dialog/battlegoal-dialog';
import { EntitiesMenuDialogComponent } from '../entities-menu/entities-menu-dialog';
import { EntityMenuDialogComponent } from '../entity-menu/entity-menu-dialog';
import { ItemsCharacterDialogComponent } from '../items/character/items-character-dialog';
import { ItemsDialogComponent } from '../items/dialog/items-dialog';
import { CharacterInitiativeDialogComponent } from './cards/initiative-dialog';
import { CharacterSheetDialog } from './dialogs/character-sheet-dialog';
import { CharacterLootCardsDialog } from './dialogs/loot-cards';
import { CharacterSummonDialog } from './dialogs/summondialog';
import { CharacterSpecialAction } from 'src/app/game/model/data/CharacterStat';

@Component({
  standalone: false,
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

  characterTitle: string = "";
  initiative: number = -1;
  health: number = 0;
  experience: number = 0;
  loot: number = 0;
  maxHp: number = 0;
  token: number = 0;
  amAnimationDrawing: boolean = false;
  compact: boolean = false;

  summonCount: number = 0;
  activeConditions: EntityCondition[] = [];
  specialActions: CharacterSpecialAction[] = [];

  bb: boolean = false;

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
    this.characterTitle = gameManager.characterManager.characterName(this.character);
    this.summonCount = this.character.summons.filter((summon) => gameManager.entityManager.isAlive(summon)).length;
    this.activeConditions = gameManager.entityManager.activeConditions(this.character);
    this.character.immunities.forEach((immunity) => {
      if (!this.activeConditions.find((entityCondition) => entityCondition.name == immunity)) {
        this.activeConditions.push(new EntityCondition(immunity));
      }
    })

    if (settingsManager.settings.characterAttackModifierDeckPermanent && settingsManager.settings.characterAttackModifierDeckPermanentActive && gameManager.game.state == GameState.next) {
      if (this.character.active) {
        this.character.attackModifierDeck.active = true;
      }
    }

    this.compact = settingsManager.settings.characterCompact && settingsManager.settings.theme != 'modern';
    this.bb = gameManager.bbRules() || this.character.bb;
    this.specialActions = this.character.specialActions.filter((specialAction) => this.character.tags.indexOf(specialAction.name) != -1);
  }

  beforeAttackModifierDeck(change: AttackModiferDeckChange) {
    gameManager.stateManager.before("updateAttackModifierDeck." + change.type, gameManager.characterManager.characterName(this.character), ...change.values);
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
      gameManager.stateManager.before("setInitiative", gameManager.characterManager.characterName(this.character), "" + value);
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
          gameManager.stateManager.before("summonInactive", gameManager.characterManager.characterName(this.character), "data.summon." + activeSummon.name);
        } else {
          gameManager.stateManager.before(this.character.active ? "unsetActive" : "setActive", gameManager.characterManager.characterName(this.character));
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

      let timeTokens = this.character.name == 'blinkblade' && this.character.tags.find((tag) => tag === 'time_tokens') && this.character.primaryToken == 0;

      if ((gameManager.game.state == GameState.next || gameManager.game.state == GameState.draw && this.character.identity == 0 && this.character.tokenValues[0] == 0) && timeTokens) {
        return;
      }

      let next = this.character.identity + 1;
      if (next >= this.character.identities.length) {
        next = 0;
      }

      gameManager.stateManager.before("nextIdentity", gameManager.characterManager.characterName(this.character, false, false, false), this.character.name, this.character.identities[this.character.identity], this.character.identities[next]);
      this.character.identity = next;
      gameManager.stateManager.after();
      event.preventDefault();
    } else {
      this.openEntityMenu(event);
    }
  }

  openInitiativeDialog(event: any) {
    this.dialog.open(CharacterInitiativeDialogComponent, {
      panelClass: ['dialog'],
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
    let maxHealth = EntityValueFunction(this.character.maxHealth);
    if (this.character.name == 'lightning' && this.character.tags.find((tag) => tag === 'unbridled-power')) {
      maxHealth = Math.max(maxHealth, 26);
    }

    if (this.character.health + this.health > maxHealth) {
      this.health = maxHealth - this.character.health;
    }
  }

  dragHpEnd(value: number) {
    if (this.health != 0) {
      gameManager.stateManager.before("changeHP", gameManager.characterManager.characterName(this.character), ghsValueSign(this.health));
      gameManager.entityManager.changeHealth(this.character, this.character, this.health);
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
      gameManager.stateManager.before("changeXP", gameManager.characterManager.characterName(this.character), ghsValueSign(this.experience));
      this.character.experience += this.experience;
      this.experience = 0;
      gameManager.stateManager.after();
    }
  }

  addExperience(value: number) {
    this.experience = value;
    if (this.character.experience + this.experience >= 0) {
      gameManager.stateManager.before("changeXP", gameManager.characterManager.characterName(this.character), ghsValueSign(this.experience));
      this.character.experience += this.experience;
      gameManager.stateManager.after();
    }
    this.experience = 0;
  }

  dragTokenMove(value: number) {
    this.token = value;
    if (this.character.primaryToken < 0 && this.character.token + this.token < 0) {
      this.token = - this.character.token;
    } else if (this.character.primaryToken >= 0 && this.character.tokenValues[this.character.primaryToken] + this.token < 0) {
      this.token = - this.character.tokenValues[this.character.primaryToken];
    } else if (this.character.name == 'blinkblade' && this.character.tags.find((tag) => ['time_tokens', 'resonance_token'].indexOf(tag) >= 0) && this.character.primaryToken == 0 && this.character.tokenValues[0] + this.token > 5) {
      this.token = 5 - this.character.tokenValues[this.character.primaryToken];
    }
  }

  dragTokenEnd(value: number) {
    if (this.token != 0) {
      if (this.character.primaryToken < 0) {
        gameManager.stateManager.before("setCharacterToken", gameManager.characterManager.characterName(this.character), (this.character.token + this.token));
        this.character.token += this.token;
        this.token = 0;
        gameManager.stateManager.after();
      } else {
        gameManager.stateManager.before("setCharacterTokenValue", gameManager.characterManager.characterName(this.character), '%data.characterToken.' + this.character.name + '.' + this.character.tokens[this.character.primaryToken] + '%', (this.character.token + this.token));
        this.character.tokenValues[this.character.primaryToken] += this.token;

        if (this.character.name == 'blinkblade' && this.character.tags.find((tag) => ['time_tokens', 'resonance_token'].indexOf(tag) >= 0) && this.character.primaryToken == 0 && this.character.tokenValues[0] > 5) {
          this.character.tokenValues[0] = 5;
        }

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
      gameManager.stateManager.before("changeLoot", gameManager.characterManager.characterName(this.character), ghsValueSign(this.loot));
      this.character.loot += this.loot;
      this.loot = 0;
      gameManager.stateManager.after();
    }
  }

  addLoot(value: number) {
    this.loot = value;
    if (this.character.loot + this.loot >= 0) {
      gameManager.stateManager.before("changeLoot", gameManager.characterManager.characterName(this.character), ghsValueSign(this.loot));
      this.character.loot += this.loot;
      gameManager.stateManager.after();
    }
    this.loot = 0;
  }

  dragCancel(value: number) {
    this.health = 0;
    this.experience = 0;
    this.loot = 0;
    this.token = 0;
  }

  openEntityMenu(event: any): void {
    this.dialog.open(EntityMenuDialogComponent, {
      panelClass: ['dialog'],
      data: {
        entity: this.character,
        figure: this.character
      },
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.characterName).withPositions(ghsDefaultDialogPositions())
    });
  }

  toggleDamageHP() {
    if (this.compact) {
      this.openCharacterSheet();
    } else if (settingsManager.settings.damageHPToggle) {
      settingsManager.toggle('damageHP');
    }
  }

  openEntitiesMenu(event: any) {
    this.dialog.open(EntitiesMenuDialogComponent, {
      panelClass: ['dialog'],
      data: {
        character: this.character
      },
      positionStrategy: this.overlay.position().flexibleConnectedTo(event.target).withPositions(ghsDefaultDialogPositions())
    });
  }

  openSummonDialog(event: any): void {
    this.dialog.open(CharacterSummonDialog, {
      panelClass: ['dialog'],
      data: this.character,
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.summonButton).withPositions(ghsDefaultDialogPositions('left'))
    });
  }

  openCharacterSheet(): void {
    this.dialog.open(CharacterSheetDialog, {
      panelClass: ['dialog-invert'],
      data: { character: this.character }
    });
  }

  removeCondition(entityCondition: EntityCondition) {
    gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.character, this.character, "removeCondition"), entityCondition.name);
    const immunityIndex = this.character.immunities.indexOf(entityCondition.name);
    if (immunityIndex != -1) {
      this.character.immunities.splice(immunityIndex, 1);
    }
    gameManager.entityManager.removeCondition(this.character, this.character, entityCondition, entityCondition.permanent);
    gameManager.stateManager.after();
  }

  removeMarker(marker: string) {
    const markerChar = new Character(gameManager.getCharacterData(marker), 1);
    const markerName = gameManager.characterManager.characterName(markerChar);
    const characterIcon = markerChar.name;
    gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.character, this.character, "removeMarker"), markerName, characterIcon);
    this.character.markers = this.character.markers.filter((value) => value != marker);
    gameManager.stateManager.after();
  }

  openBattleGoals(): void {
    this.dialog.open(CharacterBattleGoalsDialog, {
      panelClass: ['dialog'],
      data: { character: this.character, draw: !this.character.battleGoals || this.character.battleGoals.length == 0 }
    });
  }

  openItems(force: boolean = false): void {
    if (settingsManager.settings.characterItemsPermanent && !force) {
      this.character.itemsVisible = !this.character.itemsVisible;
      gameManager.stateManager.saveLocal();
      gameManager.uiChange.emit();
    } else if ((this.character.progress.items.length == 0 || force) && !this.bb) {
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
    if (this.character.attackModifierDeckVisible && (!settingsManager.settings.characterAttackModifierDeckPermanent || !settingsManager.settings.characterAttackModifierDeckPermanentActive || !this.character.active)) {
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
        panelClass: ['fullscreen-panel'],
        backdropClass: ['fullscreen-backdrop'],
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
      panelClass: ['dialog'],
      data: this.character
    });
  }

  removeShield() {
    gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.character, this.character, "removeEntityShield"));
    this.character.shield = undefined;
    gameManager.stateManager.after();
  }

  removeShieldPersistent() {
    gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.character, this.character, "removeEntityShieldPersistent"));
    this.character.shieldPersistent = undefined;
    gameManager.stateManager.after();
  }

  removeRetaliate(index: number) {
    let retaliate: Action[] = JSON.parse(JSON.stringify(this.character.retaliate));
    retaliate.splice(index, 1);
    if (retaliate.length > 0) {
      gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.character, this.character, "setEntityRetaliate"), retaliate.map((action) => '%game.action.retaliate% ' + EntityValueFunction(action.value) + (action.subActions && action.subActions[0] && action.subActions[0].type == ActionType.range && EntityValueFunction(action.subActions[0].value) > 1 ? ' %game.action.range% ' + EntityValueFunction(action.subActions[0].value) + '' : '')).join(', '));

    } else {
      gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.character, this.character, "removeEntityRetaliate"));
    }
    this.character.retaliate = retaliate;
    gameManager.stateManager.after();
  }

  removeRetaliatePersistent(index: number) {
    let retaliatePersistent: Action[] = JSON.parse(JSON.stringify(this.character.retaliatePersistent));
    retaliatePersistent.splice(index, 1);
    if (retaliatePersistent.length > 0) {
      gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.character, this.character, "setEntityRetaliatePersistent"), retaliatePersistent.map((action) => '%game.action.retaliate% ' + EntityValueFunction(action.value) + (action.subActions && action.subActions[0] && action.subActions[0].type == ActionType.range && EntityValueFunction(action.subActions[0].value) > 1 ? ' %game.action.range% ' + EntityValueFunction(action.subActions[0].value) + '' : '')).join(', '));
    } else {
      gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.character, this.character, "removeEntityRetaliatePersistent"));
    }
    this.character.retaliatePersistent = retaliatePersistent;
    gameManager.stateManager.after();
  }

  removeSpecialAction(specialAction: string) {
    gameManager.stateManager.before("removeSpecialTags", gameManager.characterManager.characterName(this.character), '%data.character.' + this.character.name + '.' + specialAction + '%');
    this.character.tags = this.character.tags.filter((specialTag) => specialTag != specialAction);

    if (this.character.name == 'lightning' && specialAction == 'careless-charge') {
      this.character.immunities = [];
    }

    if (this.character.name == 'boneshaper') {
      if (specialAction == 'solid-bones' || specialAction == 'unholy-prowess') {
        this.character.summons.forEach((summon) => {
          if (summon.name === 'shambling-skeleton') {
            summon.maxHealth -= 1;
            if (summon.health > summon.maxHealth) {
              summon.health = summon.maxHealth;
            }
            if (specialAction == 'solid-bones') {
              summon.movement -= 1;
              summon.action = undefined;
            }
          }
        })
      }
    }

    gameManager.stateManager.after();
  }
}
