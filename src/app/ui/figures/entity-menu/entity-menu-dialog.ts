import { DIALOG_DATA, Dialog, DialogRef } from "@angular/cdk/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { ChangeDetectorRef, Component, ElementRef, HostListener, Inject, ViewChild } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Entity, EntityValueFunction } from "src/app/game/model/Entity";
import { Figure } from "src/app/game/model/Figure";
import { GameState } from "src/app/game/model/Game";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { OBJECTIV_MARKERS, ObjectiveContainer } from "src/app/game/model/ObjectiveContainer";
import { ObjectiveEntity } from "src/app/game/model/ObjectiveEntity";
import { Summon, SummonColor, SummonState } from "src/app/game/model/Summon";
import { Action, ActionType, ActionValueType } from "src/app/game/model/data/Action";
import { AttackModifier, AttackModifierDeck, AttackModifierType } from "src/app/game/model/data/AttackModifier";
import { CharacterSpecialAction } from "src/app/game/model/data/CharacterStat";
import { Condition, ConditionName, ConditionType, EntityCondition, EntityConditionState } from "src/app/game/model/data/Condition";
import { ItemFlags } from "src/app/game/model/data/ItemData";
import { MonsterType } from "src/app/game/model/data/MonsterType";
import { PetIdentifier } from "src/app/game/model/data/PetCard";
import { ghsDefaultDialogPositions, ghsDialogClosingHelper, ghsModulo, ghsValueSign } from "../../helper/Static";
import { AttackModiferDeckChange } from "../attackmodifier/attackmodifierdeck";
import { CharacterSheetDialog } from "../character/dialogs/character-sheet-dialog";
import { MonsterNumberPickerDialog } from "../monster/dialogs/numberpicker-dialog";
import { AdditionalAMSelectDialogComponent } from "./additional-am-select/additional-am-select";

@Component({
  standalone: false,
  selector: 'ghs-entity-menu-dialog',
  templateUrl: 'entity-menu-dialog.html',
  styleUrls: ['./entity-menu-dialog.scss']
})
export class EntityMenuDialogComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  @ViewChild('charactertitle', { static: false }) characterTitleInput!: ElementRef;
  @ViewChild('objectiveTitle', { static: false }) objectiveTitleInput!: ElementRef;
  @ViewChild('summonTitle', { static: false }) summonTitleInput!: ElementRef;

  conditionType: 'character' | 'monster' | '' = '';

  levelDialog: boolean = false;

  health: number = 0;
  experience: number = 0;
  loot: number = 0;
  maxHp: number = 0;
  attack: number = 0;
  movement: number = 0;
  range: number = 0;
  bless: number = 0;
  curse: number = 0;
  empower: number = 0;
  enfeeble: number = 0;
  marker: number = 0;
  id: number = 0;
  characterToken: number = 0;
  characterTokenValues: number[] = [];
  objectiveDead: boolean = false;
  entityConditions: EntityCondition[] = [];
  entityImmunities: ConditionName[] = [];
  actionHints: Action[] = [];
  specialTags: string[] = [];
  entityShield: Action = new Action(ActionType.shield, 0);
  entityShieldPersistent: Action = new Action(ActionType.shield, 0);
  entityRetaliate: Action[] = [new Action(ActionType.retaliate, 0)];
  entityRetaliatePersistent: Action[] = [new Action(ActionType.retaliate, 0)];
  entityRetaliateRange: Action[] = [new Action(ActionType.range, 1, ActionValueType.fixed, [], true)];
  entityRetaliateRangePersistent: Action[] = [new Action(ActionType.range, 1, ActionValueType.fixed, [], true)];

  titles: string[] = [];

  empowerChar: Character | undefined;
  empowerChars: Character[] = [];
  enfeebleChar: Character | undefined;
  enfeebleChars: Character[] = [];

  bb: boolean = false;

  amDecks: string[] = [];

  AttackModifierType = AttackModifierType;
  SummonState = SummonState;
  SummonColor = SummonColor;
  ConditionName = ConditionName;
  ConditionType = ConditionType;
  MonsterType = MonsterType;
  OBJECTIV_MARKERS = OBJECTIV_MARKERS;
  EntityValueFunction = EntityValueFunction;
  ghsModulo = ghsModulo;
  Math = Math;
  catching: boolean = false;
  catchingDisabled: boolean = true;

  constructor(@Inject(DIALOG_DATA) public data: { entity: Entity | undefined, figure: Figure, positionElement: ElementRef, entityIndexKey: boolean }, private changeDetectorRef: ChangeDetectorRef, private dialogRef: DialogRef, private dialog: Dialog, private overlay: Overlay) {
    if (data.entity instanceof Character) {
      this.conditionType = 'character';
      for (let index = 0; index < data.entity.tokens.length; index++) {
        this.characterTokenValues[index] = 0;
      }

      if (data.entity.identities && data.entity.identities.length > 1 && settingsManager.settings.characterIdentities) {
        this.titles = data.entity.title.split('|');
        if (this.titles.length < data.entity.identities.length) {
          for (let i = this.titles.length; i < data.entity.identities.length; i++) {
            this.titles.push('');
          }
        }
        for (let i = 0; i < this.titles.length; i++) {
          if (!this.titles[i]) {
            this.titles[i] = settingsManager.getLabel('data.character.' + data.entity.name.toLowerCase());
          }
        }
      }
    } else if (data.figure instanceof ObjectiveContainer && data.figure.escort) {
      this.conditionType = 'character';
    } else if (data.entity instanceof MonsterEntity) {
      this.conditionType = 'monster';
    } else if (data.entity instanceof Summon) {
      this.conditionType = 'monster';
      if (data.entity.init) {
        this.levelDialog = true;
      }
    }
    if (this.data.entity) {
      this.entityConditions = JSON.parse(JSON.stringify(this.data.entity.entityConditions));
      this.entityImmunities = JSON.parse(JSON.stringify(this.data.entity.immunities));
    }

    if (this.data.figure instanceof Monster && this.data.entity instanceof MonsterEntity) {
      this.actionHints = gameManager.actionsManager.calcActionHints(this.data.figure, this.data.entity).map((actionHint) => new Action(actionHint.type, actionHint.value, ActionValueType.fixed, actionHint.range ? [new Action(ActionType.range, actionHint.range, ActionValueType.fixed, [], true)] : []));
    }

    if (this.data.figure instanceof Character && this.data.figure.specialActions) {
      this.data.figure.specialActions.forEach((specialAction) => {
        if (this.data.entity instanceof Character && !specialAction.summon && this.data.entity.tags.indexOf(specialAction.name) != -1) {
          this.specialTags.push(specialAction.name);
        } else if (this.data.entity instanceof Summon && specialAction.summon && this.data.entity.tags.indexOf(specialAction.name) != -1) {
          this.specialTags.push(specialAction.name);
        }
      })
    }

    if (this.data.entity) {
      if (this.data.entity.shield) {
        this.entityShield.value = this.data.entity.shield.value;
      }

      if (this.data.entity.shieldPersistent) {
        this.entityShieldPersistent.value = this.data.entity.shieldPersistent.value;
      }

      this.data.entity.retaliate.forEach((retaliate, index) => {
        if (!this.entityRetaliate[index]) {
          this.entityRetaliate[index] = new Action(ActionType.retaliate, retaliate.value);
        } else {
          this.entityRetaliate[index].value = retaliate.value;
        }

        if (!this.entityRetaliateRange[index]) {
          this.entityRetaliateRange[index] = new Action(ActionType.range, 1);
          this.entityRetaliateRange[index].small = true;
        }

        const rangeSubAction = retaliate.subActions.find((subAction) => subAction.type == ActionType.range);
        if (rangeSubAction) {
          this.entityRetaliateRange[index].value = rangeSubAction.value;
        }
      })

      this.data.entity.retaliatePersistent.forEach((retaliate, index) => {
        if (!this.entityRetaliatePersistent[index]) {
          this.entityRetaliatePersistent[index] = new Action(ActionType.retaliate, retaliate.value);
        } else {
          this.entityRetaliatePersistent[index].value = retaliate.value;
        }

        if (!this.entityRetaliateRangePersistent[index]) {
          this.entityRetaliateRangePersistent[index] = new Action(ActionType.range, 1);
          this.entityRetaliateRangePersistent[index].small = true;
        }

        const rangeSubAction = retaliate.subActions.find((subAction) => subAction.type == ActionType.range);
        if (rangeSubAction) {
          this.entityRetaliateRangePersistent[index].value = rangeSubAction.value;
        }
      })

      if (gameManager.buildingsManager.petsEnabled && this.data.figure instanceof Monster && this.data.figure.pet) {
        this.catching = true;
        this.catchingDisabled = gameManager.game.figures.find((figure) => figure instanceof Character && figure.progress.equippedItems.find((item) => item.edition == 'fh' && item.name == '247' && (!item.tags || item.tags.indexOf(ItemFlags.consumed) == -1))) == undefined;
      }
    }

    this.dialogRef.closed.subscribe({
      next: (forced) => {
        if (!forced) {
          this.close();
        }
      }
    })

    this.empowerChars = gameManager.game.figures.filter((figure) => figure instanceof Character && gameManager.entityManager.isAlive(figure) && figure.additionalModifier && figure.additionalModifier.find((perk) => perk.attackModifier && perk.attackModifier.type == AttackModifierType.empower)).map((figure) => figure as Character);

    this.empowerChars.forEach((char) => {
      if (char.active) {
        this.empowerChar = char;
      }
    })

    if (!this.empowerChar && this.empowerChars.length == 1) {
      this.empowerChar = this.empowerChars[0];
    }

    this.enfeebleChars = gameManager.game.figures.filter((figure) => figure instanceof Character && gameManager.entityManager.isAlive(figure) && !figure.absent && figure.additionalModifier && figure.additionalModifier.find((perk) => perk.attackModifier && perk.attackModifier.type == AttackModifierType.enfeeble)).map((figure) => figure as Character);

    this.enfeebleChars.forEach((char) => {
      if (char.active) {
        this.enfeebleChar = char;
      }
    })

    if (!this.enfeebleChar && this.enfeebleChars.length == 1) {
      this.enfeebleChar = this.enfeebleChars[0];
    }

    this.bb = this.data.entity instanceof Character && this.data.entity.bb || this.data.figure instanceof Monster && this.data.figure.bb;

    this.amDecks = ['M', 'A', ...gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent).map((figure) => figure.name)];
  }

  @HostListener('document:keydown', ['$event'])
  keyboardShortcuts(event: KeyboardEvent) {
    if (settingsManager.settings.keyboardShortcuts && !this.levelDialog && !event.altKey && !event.metaKey && (!window.document.activeElement || window.document.activeElement.tagName != 'INPUT' && window.document.activeElement.tagName != 'SELECT' && window.document.activeElement.tagName != 'TEXTAREA')) {
      if (!(this.data.entity instanceof Character) || !this.data.entity.absent) {
        if (!event.ctrlKey && !event.shiftKey && event.key === 'ArrowRight') {
          this.changeHealth(1);
          event.preventDefault();
          event.stopPropagation();
        } else if (!event.ctrlKey && !event.shiftKey && event.key === 'ArrowLeft') {
          this.changeHealth(-1);
          event.preventDefault();
          event.stopPropagation();
        } else if (!event.ctrlKey && !event.shiftKey && event.key === 'ArrowUp') {
          this.changeMaxHealth(1);
          event.preventDefault();
          event.stopPropagation();
        } else if (!event.ctrlKey && !event.shiftKey && event.key === 'ArrowDown') {
          this.changeMaxHealth(-1);
          event.preventDefault();
          event.stopPropagation();
        } else if (!event.ctrlKey && event.key.toLowerCase() === 'x') {
          this.changeExperience(event.shiftKey ? -1 : 1);
          event.preventDefault();
          event.stopPropagation();
        } else if (!event.ctrlKey && event.key.toLowerCase() === 'l') {
          this.changeLoot(event.shiftKey ? -1 : 1);
          event.preventDefault();
          event.stopPropagation();
        } else if (!event.ctrlKey && event.key.toLowerCase() === 'b') {
          this.changeBless(event.shiftKey ? -1 : 1);
          event.preventDefault();
          event.stopPropagation();
        } else if (!event.ctrlKey && event.key.toLowerCase() === 'c') {
          this.changeCurse(event.shiftKey ? -1 : 1);
          event.preventDefault();
          event.stopPropagation();
        } else if (!event.ctrlKey && !event.shiftKey && (event.key.toLowerCase() === 'k' || event.key.toLowerCase() === 'd')) {
          if (this.data.entity instanceof Character) {
            this.toggleExhausted();
          } else {
            this.toggleDead();
          }
          event.preventDefault();
          event.stopPropagation();
        } else if (!event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 's') {
          if (this.data.entity instanceof Character) {
            ghsDialogClosingHelper(this.dialogRef);
            this.dialog.open(CharacterSheetDialog, {
              panelClass: ['dialog-invert'],
              data: { character: this.data.entity }
            });
            event.preventDefault();
            event.stopPropagation();
          }
        }
      }
      if (settingsManager.settings.keyboardShortcuts && !event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'a' && this.data.entity instanceof Character) {
        this.toggleCharacterAbsent();
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  changeHealth(value: number) {
    this.health += value;

    if (this.data.entity) {
      let maxHealth = EntityValueFunction(this.data.entity.maxHealth);
      if (this.data.entity instanceof Character && this.data.entity.name == 'lightning' && this.specialTags.indexOf('unbridled-power') != -1) {
        maxHealth = Math.max(maxHealth, 26);
      }

      if (this.data.entity.health + this.health > maxHealth + this.maxHp) {
        this.health = maxHealth + this.maxHp - this.data.entity.health;
      }
    }
  }

  changeExperience(value: number) {
    if (this.data.entity instanceof Character) {
      this.experience += value;
      if (this.data.entity.experience + this.experience <= 0) {
        this.experience = -this.data.entity.experience;
      }
    }
  }

  changeCharacterToken(value: number, index: number = -1) {
    if (this.data.entity instanceof Character) {
      if (index < 0) {
        this.characterToken += value;
        if (this.data.entity.token + this.characterToken <= 0) {
          this.characterToken = -this.data.entity.token;
        }
      } else {
        this.characterTokenValues[index] += value;
        if (this.data.entity.tokenValues[index] + this.characterTokenValues[index] <= 0) {
          this.characterTokenValues[index] = -this.data.entity.tokenValues[index];
        }
      }
    }
  }

  changeLoot(value: number) {
    if (this.data.entity instanceof Character) {
      this.loot += value;
      if (this.data.entity.loot + this.loot <= 0) {
        this.loot = -this.data.entity.loot;
      }
    }
  }

  attackModifierDeck(): AttackModifierDeck {
    return gameManager.attackModifierManager.byFigure(this.data.figure);
  }

  beforeAttackModifierDeck(change: AttackModiferDeckChange) {
    gameManager.stateManager.before("updateAttackModifierDeck." + change.type, this.data.figure instanceof Character ? gameManager.characterManager.characterName(this.data.figure) : (this.data.figure instanceof Monster && (this.data.figure.isAlly || this.data.figure.isAllied) ? 'ally' : 'monster'), ...change.values);
  }

  afterAttackModifierDeck(change: AttackModiferDeckChange) {
    this.attackModifierDeck().merge(change.deck);
    gameManager.stateManager.after();
  }

  countAttackModifier(type: AttackModifierType): number {
    return this.attackModifierDeck().cards.filter((attackModifier) => {
      return attackModifier.type == type;
    }).length;
  }

  countUpcomingAttackModifier(type: AttackModifierType, idPrefix: string | undefined = undefined): number {
    return this.attackModifierDeck().cards.filter((attackModifier, index) => {
      return attackModifier.type == type && index > this.attackModifierDeck().current && (!idPrefix || attackModifier.id && attackModifier.id.startsWith(idPrefix));
    }).length;
  }

  countDrawnAttackModifier(type: AttackModifierType): number {
    return this.attackModifierDeck().cards.filter((attackModifier, index) => {
      return attackModifier.type == type && index <= this.attackModifierDeck().current;
    }).length;
  }

  changeAttackModifier(type: AttackModifierType, value: number) {
    if (value > 0) {
      if (type == AttackModifierType.bless && gameManager.attackModifierManager.countUpcomingBlesses() >= 10) {
        return;
      } else if (type == AttackModifierType.curse && gameManager.attackModifierManager.countUpcomingCurses(this.data.figure instanceof Monster && !this.data.figure.isAlly && !this.data.figure.isAllied) >= 10) {
        return;
      }
      for (let i = 0; i < value; i++) {
        gameManager.attackModifierManager.addModifier(this.attackModifierDeck(), new AttackModifier(type));
      }
    } else if (value < 0) {
      let card = this.attackModifierDeck().cards.find((attackModifier, index) => {
        return attackModifier.type == type && index > this.attackModifierDeck().current;
      });
      while (card && value < 0) {
        this.attackModifierDeck().cards.splice(this.attackModifierDeck().cards.indexOf(card), 1);
        card = this.attackModifierDeck().cards.find((attackModifier, index) => {
          return attackModifier.type == type && index > this.attackModifierDeck().current;
        });
        value++;
      }
    }
  }

  changeBless(value: number) {
    if (this.data.figure instanceof Character || this.data.figure instanceof Monster) {
      this.bless += value;
      const existing = gameManager.attackModifierManager.countUpcomingBlesses();
      if (this.bless + existing >= 10) {
        this.bless = 10 - existing;
      } else if (this.bless + existing < 0) {
        this.bless = -existing;
      }
    }
  }

  changeCurse(value: number) {
    if (this.data.figure instanceof Character || this.data.figure instanceof Monster) {
      this.curse += value;
      const existing = gameManager.attackModifierManager.countUpcomingCurses(this.data.figure instanceof Monster && !this.data.figure.isAlly && !this.data.figure.isAllied);
      if (this.curse + existing >= 10) {
        this.curse = 10 - existing;
      } else if (this.curse + existing < 0) {
        this.curse = -existing;
      }
    }
  }

  countEmpower(all: boolean = false): number {
    return this.empowerChar ? this.empowerChar.additionalModifier.filter((perk) => perk.attackModifier && perk.attackModifier.type == AttackModifierType.empower).map((perk) => perk.count).reduce((a, b) => a + b) - (all ? 0 : gameManager.attackModifierManager.countUpcomingAdditional(this.empowerChar, AttackModifierType.empower)) : -1
  }

  countEnfeeble(all: boolean = false): number {
    return this.enfeebleChar ? this.enfeebleChar.additionalModifier.filter((perk) => perk.attackModifier && perk.attackModifier.type == AttackModifierType.enfeeble).map((perk) => perk.count).reduce((a, b) => a + b) - (all ? 0 : gameManager.attackModifierManager.countUpcomingAdditional(this.enfeebleChar, AttackModifierType.enfeeble)) : -1

  }

  changeEmpower(value: number) {
    if (this.empowerChar || value < 0) {
      this.empower += value;
      const existing = this.countUpcomingAttackModifier(AttackModifierType.empower);
      const count_all = this.countEmpower();
      if (this.empower >= count_all) {
        this.empower = count_all;
      } else if (this.empower + existing < 0) {
        this.empower = -existing;
      }
    } else {
      const dialog = this.dialog.open(AdditionalAMSelectDialogComponent, {
        panelClass: ['dialog'],
        data: {
          characters: this.empowerChars,
          type: AttackModifierType.empower
        }
      })

      dialog.closed.subscribe({
        next: (index) => {
          if (typeof index === 'number' && index != -1) {
            this.empowerChar = this.empowerChars[index];
          }
        }
      })
    }
  }

  changeEnfeeble(value: number) {
    if (this.enfeebleChar || value < 0) {
      this.enfeeble += value;
      const existing = this.countUpcomingAttackModifier(AttackModifierType.enfeeble);
      const count_all = this.countEnfeeble();
      if (this.enfeeble >= count_all) {
        this.enfeeble = count_all;
      } else if (this.enfeeble + existing < 0) {
        this.enfeeble = -existing;
      }
    } else {
      const dialog = this.dialog.open(AdditionalAMSelectDialogComponent, {
        panelClass: ['dialog'],
        data: {
          characters: this.enfeebleChars,
          type: AttackModifierType.enfeeble
        }
      })

      dialog.closed.subscribe({
        next: (index) => {
          if (typeof index === 'number' && index != -1) {
            this.enfeebleChar = this.enfeebleChars[index];
          }
        }
      })
    }
  }

  hasCondition(conditionName: ConditionName) {
    if (conditionName == ConditionName.empower) {
      return this.empowerChars.length > 0;
    }

    if (conditionName == ConditionName.enfeeble) {
      return this.enfeebleChars.length > 0;
    }

    return gameManager.conditions(gameManager.game.edition).find((condition) => condition.name == conditionName) != undefined;
  }

  toggleExhausted() {
    if (this.data.entity instanceof Character) {
      gameManager.stateManager.before(this.data.entity.exhausted ? "unsetExhausted" : "setExhausted", gameManager.characterManager.characterName(this.data.entity));
      this.exhausted();
      gameManager.stateManager.after();
    }
  }

  exhausted() {
    if (this.data.entity instanceof Character) {
      this.data.entity.exhausted = !this.data.entity.exhausted;
      if (this.data.entity.exhausted) {
        this.data.entity.off = true;
        this.data.entity.active = false;
      } else {
        this.data.entity.off = false;
      }
    }
  }

  changeMaxHealth(value: number) {
    this.maxHp += value;
    if (!(this.data.entity instanceof Character) && !(this.data.figure instanceof ObjectiveContainer)) {
      this.health += value;
    }

    if (this.data.figure instanceof ObjectiveContainer) {
      if (EntityValueFunction(this.data.figure.health) + this.maxHp <= 1) {
        this.maxHp = -EntityValueFunction(this.data.figure.health) + 1;
      }
    } else if (this.data.entity && EntityValueFunction(this.data.entity.maxHealth) + this.maxHp <= 1) {
      this.maxHp = -EntityValueFunction(this.data.entity.maxHealth) + 1;
    }
  }

  setLevel(level: number) {
    if (this.data.entity instanceof Character) {
      gameManager.stateManager.before("setLevel", gameManager.characterManager.characterName(this.data.entity), "" + level);
      gameManager.characterManager.setLevel(this.data.entity, level);
      gameManager.stateManager.after();
    }
  }

  isImmune(conditionName: ConditionName): boolean {
    if (this.data.entity) {
      return gameManager.entityManager.isImmune(this.data.entity, this.data.figure, conditionName);
    }
    return false;
  }

  markers(): string[] {
    if (this.data.entity) {
      return [...gameManager.markers(), ...this.data.entity.markers].filter((marker, index, self) => index == self.indexOf(marker));
    }
    return [];
  }

  hasMarker(marker: string): boolean {
    if (this.data.entity) {
      return gameManager.entityManager.hasMarker(this.data.entity, marker);
    }
    return false;
  }

  toggleCharacterAbsent() {
    if (this.data.entity instanceof Character && (this.data.entity.absent || gameManager.characterManager.characterCount() > 1)) {
      gameManager.stateManager.before(this.data.entity.absent ? "unsetAbsent" : "setAbsent", gameManager.characterManager.characterName(this.data.entity));
      this.data.entity.absent = !this.data.entity.absent;
      if (this.data.entity.absent && this.data.entity.active) {
        gameManager.roundManager.toggleFigure(this.data.entity);
      }
      gameManager.stateManager.after();
    }
  }

  toggleCharacterMarker() {
    if (this.data.entity instanceof Character) {
      gameManager.stateManager.before(this.data.entity.marker ? "disableMarker" : "enableMarker", gameManager.characterManager.characterName(this.data.entity));
      this.data.entity.marker = !this.data.entity.marker;
      gameManager.stateManager.after();
    }
  }

  toggleMarker(marker: string) {
    if (this.data.entity) {
      const markerChar = new Character(gameManager.getCharacterData(marker), 1);
      const markerName = gameManager.characterManager.characterName(markerChar);
      const characterIcon = markerChar.name;
      gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.data.entity, this.data.figure, this.hasMarker(marker) ? "removeMarker" : "addMarker"), markerName, characterIcon);
      gameManager.entityManager.toggleMarker(this.data.entity, marker);
      gameManager.stateManager.after();
    }
  }

  toggleSummon() {
    if (this.data.entity instanceof MonsterEntity) {
      let summonState = SummonState.false;
      if (this.data.entity.summon == SummonState.false) {
        summonState = SummonState.new;
      } else if (this.data.entity.summon == SummonState.new) {
        summonState = SummonState.true;
      }

      gameManager.stateManager.before("setEntitySummonState", "data.monster." + this.data.figure.name, "monster." + this.data.entity.type, "" + this.data.entity.number, 'summon.state.' + summonState);
      this.data.entity.summon = summonState;
      gameManager.stateManager.after();
    }
  }

  changeMonsterEntity() {
    if (this.data.figure instanceof Monster && this.data.entity instanceof MonsterEntity) {
      if (gameManager.monsterManager.monsterStandeeMax(this.data.figure) > 1 || this.data.entity.type != MonsterType.boss) {
        this.close();
        this.dialog.open(MonsterNumberPickerDialog, {
          panelClass: ['dialog'],
          data: {
            monster: this.data.figure,
            entity: this.data.entity,
            change: true
          },
          positionStrategy: this.overlay.position().flexibleConnectedTo(this.data.positionElement).withPositions(ghsDefaultDialogPositions())
        })
        ghsDialogClosingHelper(this.dialogRef);
      }
    }
  }


  toggleDead() {
    if (this.data.entity instanceof MonsterEntity) {
      this.dead();
    } else if (this.data.entity instanceof Summon) {
      this.dead();
    } else if (this.data.entity instanceof ObjectiveEntity) {
      this.dead();
    }
  }

  dead(catching: boolean = false, force: boolean = false) {
    if (this.data.figure instanceof Monster && this.data.entity instanceof MonsterEntity && (!catching || this.catching && (!this.catchingDisabled || force))) {
      gameManager.stateManager.before(catching ? 'buildings.stables.pets.catch' : "entityDead", "data.monster." + this.data.figure.name, "monster." + this.data.entity.type, "" + this.data.entity.number);
      this.data.entity.dead = true;

      if (this.data.figure.entities.every((monsterEntity) => monsterEntity.dead)) {
        if (this.data.figure.active) {
          gameManager.roundManager.toggleFigure(this.data.figure);
        }
      }

      if (catching && gameManager.game.party.pets.find((value) => this.data.figure instanceof Monster && value.edition == this.data.figure.edition && value.name == this.data.figure.pet) == undefined) {
        gameManager.game.party.pets.push(new PetIdentifier(this.data.figure.pet, this.data.figure.edition));
        const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.progress.equippedItems.find((item) => item.edition == 'fh' && item.name == '247' && (!item.tags || item.tags.indexOf(ItemFlags.consumed) == -1))) as Character;
        if (character) {
          const item = character.progress.equippedItems.find((item) => item.edition == 'fh' && item.name == '247' && (!item.tags || item.tags.indexOf(ItemFlags.consumed) == -1));
          if (item) {
            item.tags = item.tags || [];
            item.tags.push(ItemFlags.consumed);
          }
        }
      }

      setTimeout(() => {
        if (this.data.figure instanceof Monster && this.data.entity instanceof MonsterEntity) {
          gameManager.monsterManager.removeMonsterEntity(this.data.figure, this.data.entity);
          gameManager.stateManager.after();
        }
      }, !settingsManager.settings.animations ? 0 : 1500);
      ghsDialogClosingHelper(this.dialogRef, true)
    } else if (this.data.figure instanceof Character && this.data.entity instanceof Summon) {
      gameManager.stateManager.before("summonDead", gameManager.characterManager.characterName(this.data.figure), "data.summon." + this.data.entity.name);
      this.data.entity.dead = true;
      setTimeout(() => {
        if (this.data.figure instanceof Character && this.data.entity instanceof Summon) {
          gameManager.characterManager.removeSummon(this.data.figure, this.data.entity);
          gameManager.stateManager.after();
        }
      }, !settingsManager.settings.animations ? 0 : 1500);
      ghsDialogClosingHelper(this.dialogRef, true)
    } else if (this.data.figure instanceof ObjectiveContainer && this.data.entity instanceof ObjectiveEntity) {
      let name = this.data.figure.name;
      if (!name) {
        name = this.data.figure.title;
        if (!name) {
          name = this.data.figure.escort ? '%escort%' : '%objective%';
        }
      }
      gameManager.stateManager.before("objectiveEntityDead", name, "" + this.data.entity.number);
      this.data.entity.dead = true;

      if (this.data.figure.entities.every((entity) => entity.dead)) {
        if (this.data.figure.active) {
          gameManager.roundManager.toggleFigure(this.data.figure);
        }
      }

      setTimeout(() => {
        if (this.data.figure instanceof ObjectiveContainer && this.data.entity instanceof ObjectiveEntity) {
          gameManager.objectiveManager.removeObjectiveEntity(this.data.figure, this.data.entity);
          gameManager.stateManager.after();
        }
      }, !settingsManager.settings.animations || !this.data.figure.entities.some((entity) => gameManager.entityManager.isAlive(entity)) ? 0 : 1500);
      ghsDialogClosingHelper(this.dialogRef, true)
    }
  }

  changeAttack(value: number) {
    if (this.data.entity instanceof Summon) {
      this.attack += value;
      if (typeof this.data.entity.attack == 'number' && this.data.entity.attack + this.attack < 0) {
        this.attack = -this.data.entity.attack;
      }
    }
  }

  changeMovement(value: number) {
    if (this.data.entity instanceof Summon) {
      this.movement += value;
      if (this.data.entity.movement + this.movement <= 0) {
        this.movement = -this.data.entity.movement;
      }
    }
  }

  changeRange(value: number) {
    if (this.data.entity instanceof Summon) {
      this.range += value;
      if (this.data.entity.range + this.range <= 0) {
        this.range = -this.data.entity.range;
      }
    }
  }

  toggleSummonStatus() {
    if (this.data.entity instanceof Summon) {
      let state = SummonState.new;
      if (this.data.entity.state == SummonState.new) {
        state = SummonState.true;
      }
      gameManager.stateManager.before("setSummonState", gameManager.characterManager.characterName(this.data.figure as Character), "data.summon." + this.data.entity.name, 'summon.state.' + state);
      this.data.entity.state = state;
      gameManager.stateManager.after();
    }
  }

  changeId(value: number) {
    if (this.data.figure instanceof ObjectiveContainer && this.data.entity instanceof ObjectiveEntity) {
      this.id += value;
      let newId = this.data.entity.number + this.id;
      if (newId < 1) {
        this.id = 12 - this.data.entity.number;
      } else if (newId > 12) {
        this.id = 1 - this.data.entity.number;
      }
      newId = this.data.entity.number + this.id;
      if (this.data.figure.entities.length < 12) {
        while (this.data.figure.entities.some((entity) => entity.number == newId && entity != this.data.entity)) {
          this.id += value;
          newId = this.data.entity.number + this.id;
          if (newId < 1) {
            this.id = 12 - this.data.entity.number;
          } else if (newId > 12) {
            this.id = 1 - this.data.entity.number;
          }
          newId = this.data.entity.number + this.id;
        }
      }
    }
  }

  changeMarker(value: number) {
    if (this.data.figure instanceof ObjectiveContainer) {
      this.marker = ghsModulo(this.marker + value, OBJECTIV_MARKERS.length);
    }
  }

  openLevelDialog() {
    this.levelDialog = true;
    this.changeDetectorRef.detectChanges();
    if (this.data.entity instanceof Character) {

      if (this.characterTitleInput) {
        this.characterTitleInput.nativeElement.value = this.data.entity.title || settingsManager.getLabel('data.character.' + this.data.entity.name.toLowerCase());
      }

      this.titles = [];
      if (this.data.entity.identities && this.data.entity.identities.length > 1 && settingsManager.settings.characterIdentities) {
        this.titles = this.data.entity.title.split('|');
        if (this.titles.length < this.data.entity.identities.length) {
          for (let i = this.titles.length; i < this.data.entity.identities.length; i++) {
            this.titles.push('');
          }
        }
        for (let i = 0; i < this.titles.length; i++) {
          if (!this.titles[i]) {
            this.titles[i] = settingsManager.getLabel('data.character.' + this.data.entity.name.toLowerCase());
          }
        }
      }
    }
    if (this.data.entity instanceof Summon) {
      this.summonTitleInput.nativeElement.value = this.data.entity.title || settingsManager.getLabel('data.summon.' + this.data.entity.name.toLowerCase());
    }
  }

  applySpecialAction(specialAction: CharacterSpecialAction) {
    if (!specialAction.noTag) {
      if (this.specialTags.indexOf(specialAction.name) == -1) {
        this.specialTags.push(specialAction.name);
      } else {
        this.specialTags.splice(this.specialTags.indexOf(specialAction.name), 1);
      }
    }
  }

  changeShield(value: number) {
    this.entityShield.value = EntityValueFunction(this.entityShield.value) + value;
    if (this.entityShield.value < 0) {
      this.entityShield.value = 0;
    }
    gameManager.uiChange.emit();
  }

  changeShieldPersistent(value: number) {
    this.entityShieldPersistent.value = EntityValueFunction(this.entityShieldPersistent.value) + value;
    if (this.entityShieldPersistent.value < 0) {
      this.entityShieldPersistent.value = 0;
    }
    gameManager.uiChange.emit();
  }

  changeRetaliate(index: number, value: number, range: number) {
    if (!this.entityRetaliate[index]) {
      this.entityRetaliate[index] = new Action(ActionType.retaliate, 0);
    }
    if (!this.entityRetaliateRange[index]) {
      this.entityRetaliateRange[index] = new Action(ActionType.range, 1);
      this.entityRetaliateRange[index].small = true;
    }

    this.entityRetaliate[index].value = EntityValueFunction(this.entityRetaliate[index].value) + value;
    this.entityRetaliateRange[index].value = EntityValueFunction(this.entityRetaliateRange[index].value) + range;

    if (EntityValueFunction(this.entityRetaliate[index].value) <= 0 && this.entityRetaliate.length > 1) {
      this.entityRetaliate.splice(index, 1);
      this.entityRetaliateRange.splice(index, 1);
    }

    gameManager.uiChange.emit();
  }

  changeRetaliatePersistent(index: number, value: number, range: number) {
    if (!this.entityRetaliatePersistent[index]) {
      this.entityRetaliatePersistent[index] = new Action(ActionType.retaliate, 0);
    }
    if (!this.entityRetaliateRangePersistent[index]) {
      this.entityRetaliateRangePersistent[index] = new Action(ActionType.range, 1);
      this.entityRetaliateRangePersistent[index].small = true;
    }

    this.entityRetaliatePersistent[index].value = EntityValueFunction(this.entityRetaliatePersistent[index].value) + value;
    this.entityRetaliateRangePersistent[index].value = EntityValueFunction(this.entityRetaliateRangePersistent[index].value) + range;

    if (EntityValueFunction(this.entityRetaliatePersistent[index].value) <= 0 && this.entityRetaliatePersistent.length > 1) {
      this.entityRetaliatePersistent.splice(index, 1);
      this.entityRetaliateRangePersistent.splice(index, 1);
    }

    gameManager.uiChange.emit();
  }

  setTitle(event: any, index: number) {
    this.titles[index] = event.target.value;
  }

  setIdentity(index: number) {
    if (this.data.entity instanceof Character && index != this.data.entity.identity) {
      let timeTokens = this.data.entity.name == 'blinkblade' && this.data.entity.tags.find((tag) => tag === 'time_tokens') && this.data.entity.primaryToken == 0;
      if ((gameManager.game.state == GameState.next || gameManager.game.state == GameState.draw && this.data.entity.identity == 0 && this.data.entity.tokenValues[0] == 0) && timeTokens) {
        return;
      }

      gameManager.stateManager.before("setIdentity", gameManager.characterManager.characterName(this.data.entity, false, false, false), this.data.entity.name, this.data.entity.identities[index]);
      this.data.entity.identity = index;
      gameManager.stateManager.after();
    }
  }

  toggleAMDeck(deck: string) {
    if (this.data.figure instanceof ObjectiveContainer) {
      if (this.data.figure.amDeck == deck || this.data.figure.amDeck && deck == 'M') {
        gameManager.stateManager.before("unsetObjectiveAmDeck", this.data.figure.title || this.data.figure.name || this.data.figure.escort ? 'escort' : 'objective', deck);
        this.data.figure.amDeck = undefined;
        gameManager.stateManager.after();
      } else if (deck != 'M' && this.amDecks.indexOf(deck) != -1) {
        gameManager.stateManager.before("setObjectiveAmDeck", this.data.figure.title || this.data.figure.name || this.data.figure.escort ? 'escort' : 'objective', deck);
        this.data.figure.amDeck = deck;
        gameManager.stateManager.after();
      }
    }
  }

  close(): void {
    if (this.data.entity instanceof Character) {
      this.closeCharacter();
    } else if (this.data.figure instanceof Monster) {
      this.closeMonster();
    } else if (this.data.entity instanceof Summon) {
      this.closeSummon();
    } else if (this.data.entity instanceof ObjectiveEntity) {
      this.closeObjectiveEntity();
    } else if (this.data.figure instanceof ObjectiveContainer) {
      this.closeObjectiveContainer();
    }
    this.closeShieldRetaliate();
    this.closeAMs();
    this.closeConditions();
  }

  closeCharacter(): void {
    if (this.data.entity instanceof Character) {
      if (this.maxHp) {
        gameManager.stateManager.before("changeMaxHP", gameManager.characterManager.characterName(this.data.entity), ghsValueSign(this.maxHp));
        if (this.data.entity.maxHealth + this.maxHp < this.data.entity.maxHealth || this.data.entity.health == this.data.entity.maxHealth) {
          this.data.entity.health = this.data.entity.maxHealth + this.maxHp;
        }
        this.data.entity.maxHealth += this.maxHp;
        gameManager.stateManager.after();
        this.maxHp = 0;
      }

      if (this.health != 0) {
        gameManager.stateManager.before("changeHP", gameManager.characterManager.characterName(this.data.entity), ghsValueSign(this.health));
        gameManager.entityManager.changeHealth(this.data.entity, this.data.figure, this.health);
        this.health = 0;
        gameManager.stateManager.after();
      }

      if (this.experience != 0) {
        gameManager.stateManager.before("changeXP", gameManager.characterManager.characterName(this.data.entity), ghsValueSign(this.experience));
        this.data.entity.experience += this.experience;
        if (this.data.entity.experience < 0) {
          this.data.entity.experience = 0;
        }
        this.experience = 0;
        gameManager.stateManager.after();
      }

      if (this.characterToken != 0) {
        let token = this.data.entity.token + this.characterToken;
        if (token < 0) {
          token = 0;
        }
        gameManager.stateManager.before("setCharacterToken", gameManager.characterManager.characterName(this.data.entity), token);
        this.data.entity.token = token;
        this.characterToken = 0;
        gameManager.stateManager.after();
      }

      for (let index = 0; index < this.data.entity.tokens.length; index++) {
        if (this.characterTokenValues[index] != 0) {
          let tokenValue = this.data.entity.tokenValues[index] + this.characterTokenValues[index];
          if (tokenValue < 0) {
            tokenValue = 0;
          }
          gameManager.stateManager.before("setCharacterTokenValue", gameManager.characterManager.characterName(this.data.entity), '%data.characterToken.' + this.data.figure.name + '.' + this.data.entity.tokens[index] + '%', tokenValue);
          this.data.entity.tokenValues[index] = tokenValue;
          this.characterTokenValues[index] = 0;
          gameManager.stateManager.after();
        }
      }

      if (this.loot != 0) {
        gameManager.stateManager.before("changeLoot", gameManager.characterManager.characterName(this.data.entity), ghsValueSign(this.loot));
        this.data.entity.loot += this.loot;
        if (this.data.entity.loot < 0) {
          this.data.entity.loot = 0;
        }
        this.loot = 0;
        gameManager.stateManager.after();
      }

      const specialTagsToTemove = this.data.entity.tags.filter((specialTag) => this.data.figure instanceof Character && this.data.figure.specialActions && this.data.figure.specialActions.find((specialAction) => specialAction.name == specialTag) != undefined && this.specialTags.indexOf(specialTag) == -1);

      if (specialTagsToTemove.length) {
        gameManager.stateManager.before("removeSpecialTags", gameManager.characterManager.characterName(this.data.entity), specialTagsToTemove.map((specialTag) => '%data.character.' + this.data.figure.name + '.' + specialTag + '%').join(','));
        this.data.entity.tags = this.data.entity.tags.filter((specialTag) => specialTagsToTemove.indexOf(specialTag) == -1);

        if (this.data.entity.name == 'lightning' && specialTagsToTemove.indexOf('careless-charge') != -1) {
          this.data.entity.immunities = [];
          this.entityImmunities = this.data.entity.immunities;
        }

        if (this.data.entity.name == 'fist' && specialTagsToTemove.indexOf('one-with-the-mountain') != -1) {
          this.data.entity.entityConditions = this.data.entity.entityConditions.filter((entityCondition) => entityCondition.name != ConditionName.regenerate || !entityCondition.permanent);
        }

        if (this.data.entity.name == 'demolitionist' && specialTagsToTemove.indexOf('mech') != -1) {
          this.data.entity.maxHealth -= 5;
          gameManager.entityManager.checkHealth(this.data.entity, this.data.entity);
        }

        if (this.data.entity.name == 'boneshaper') {
          if (specialTagsToTemove.indexOf('solid-bones') != -1 || specialTagsToTemove.indexOf('unholy-prowess') != -1) {
            this.data.entity.summons.forEach((summon) => {
              if (summon.name === 'shambling-skeleton') {
                summon.maxHealth -= 1;
                if (summon.health > summon.maxHealth) {
                  summon.health = summon.maxHealth;
                }
                if (specialTagsToTemove.indexOf('solid-bones') != -1) {
                  summon.movement -= 1;
                  summon.action = undefined;
                }
              }
            })
          }
        }

        gameManager.stateManager.after();
      }

      const specialTagsToAdd = this.specialTags.filter((specialTag) => this.data.entity && this.data.entity.tags.indexOf(specialTag) == -1);

      if (specialTagsToAdd.length) {
        gameManager.stateManager.before("addSpecialTags", gameManager.characterManager.characterName(this.data.entity), specialTagsToAdd.map((specialTag) => '%data.character.' + this.data.figure.name + '.' + specialTag + '%').join(','));
        this.data.entity.tags.push(...specialTagsToAdd);

        if (this.data.entity.name == 'lightning' && specialTagsToAdd.indexOf('careless-charge') != -1) {
          this.data.entity.immunities = gameManager.conditionsForTypes('character', 'negative').map((condition) => condition.name);
          this.data.entity.immunities.push(ConditionName.curse);
          if (this.hasCondition(ConditionName.enfeeble)) {
            this.data.entity.immunities.push(ConditionName.enfeeble);
          }
          this.entityImmunities = this.data.entity.immunities;
        }

        if (this.data.entity.name == 'fist' && specialTagsToAdd.indexOf('one-with-the-mountain') != -1) {
          let regenerate = this.data.entity.entityConditions.find((entityCondition) => entityCondition.name == ConditionName.regenerate);
          if (regenerate) {
            regenerate.permanent = true;
          } else {
            regenerate = new EntityCondition(ConditionName.regenerate);
            regenerate.permanent = true;
            this.data.entity.entityConditions.push(regenerate);
          }
        }

        if (this.data.entity.name == 'demolitionist' && specialTagsToAdd.indexOf('mech') != -1) {
          this.data.entity.maxHealth += 5;
          this.data.entity.health += 10;
          gameManager.entityManager.addCondition(this.data.entity, this.data.figure, new Condition(ConditionName.heal, 10));
          gameManager.entityManager.applyCondition(this.data.entity, this.data.figure, ConditionName.heal, true);
        }

        if (this.data.entity.name == 'boneshaper') {
          if (specialTagsToAdd.indexOf('solid-bones') != -1 || specialTagsToAdd.indexOf('unholy-prowess') != -1) {
            this.data.entity.summons.forEach((summon) => {
              if (summon.name === 'shambling-skeleton') {
                summon.maxHealth += 1;
                if (summon.health == summon.maxHealth - 1) {
                  summon.health = summon.maxHealth;
                }
                if (specialTagsToAdd.indexOf('solid-bones') != -1) {
                  summon.movement += 1;
                  summon.action = new Action(ActionType.pierce, 1);
                }
              }
            })
          }
        }

        gameManager.stateManager.after();
      }

      let title = this.data.entity.title;

      if (this.characterTitleInput) {
        title = this.characterTitleInput.nativeElement.value;
      }

      if (this.titles.length > 0) {
        for (let i = 0; i < this.titles.length; i++) {
          if (this.titles[i] == settingsManager.getLabel('data.character.' + this.data.entity.name.toLowerCase())) {
            this.titles[i] = '';
          }
        }

        title = this.titles.join('|');
        while (title.endsWith('|')) {
          title = title.substring(0, title.length - 1);
        }
      }

      if (title != settingsManager.getLabel('data.character.' + this.data.entity.name.toLowerCase())) {
        if (this.data.entity.title != title) {
          gameManager.stateManager.before("setTitle", gameManager.characterManager.characterName(this.data.entity), title);
          this.data.entity.title = title;
          gameManager.stateManager.after();
        }
      } else if (this.data.entity.title != "") {
        gameManager.stateManager.before("unsetTitle", gameManager.characterManager.characterName(this.data.entity), this.data.entity.title);
        this.data.entity.title = "";
        gameManager.stateManager.after();
      }
    }
  }

  closeMonster() {
    if (this.data.figure instanceof Monster) {
      if (this.data.entity instanceof MonsterEntity) {
        if (this.maxHp) {
          gameManager.stateManager.before("changeEntityMaxHp", "data.monster." + this.data.figure.name, "monster." + this.data.entity.type, "" + this.data.entity.number, ghsValueSign(this.maxHp));
          this.data.entity.maxHealth += this.maxHp;
          gameManager.stateManager.after();
          this.maxHp = 0;
        }

        if (this.health != 0) {
          gameManager.stateManager.before("changeEntityHp", "data.monster." + this.data.figure.name, "monster." + this.data.entity.type, "" + this.data.entity.number, ghsValueSign(this.health));
          gameManager.entityManager.changeHealth(this.data.entity, this.data.figure, this.health);
          gameManager.stateManager.after();
          this.health = 0;
        }

        if ((this.data.entity.maxHealth > 0 && this.data.entity.health <= 0 || this.data.entity.dead) && (this.data.entity.entityConditions.length == 0 || this.data.entity.entityConditions.every((entityCondition) => !entityCondition.highlight && entityCondition.types.indexOf(ConditionType.turn) == -1 && entityCondition.types.indexOf(ConditionType.apply) == -1))) {
          this.dead();
        }
      }
    }
  }

  closeSummon() {
    if (this.data.figure instanceof Character && this.data.entity instanceof Summon) {
      if (this.data.entity.init) {
        gameManager.characterManager.removeSummon(this.data.figure, this.data.entity);
        gameManager.stateManager.before("addSummon", gameManager.characterManager.characterName(this.data.figure), this.data.entity.name);
        this.data.entity.init = false;
        if (this.health != 0) {
          gameManager.entityManager.changeHealth(this.data.entity, this.data.figure, this.health);
        }
        if (this.attack != 0 && typeof this.data.entity.attack == 'number') {
          this.data.entity.attack += this.attack;
        }
        if (this.movement != 0) {
          this.data.entity.movement += this.movement;
        }
        if (this.range != 0) {
          this.data.entity.range += this.range;
        }
        if (this.maxHp) {
          if (this.data.entity.maxHealth + this.maxHp < this.data.entity.maxHealth || this.data.entity.health == this.data.entity.maxHealth) {
            this.data.entity.health = this.data.entity.maxHealth + this.maxHp;
          }
          this.data.entity.maxHealth += this.maxHp;
        }
        gameManager.characterManager.addSummon(this.data.figure, this.data.entity);
        gameManager.stateManager.after();
      } else {
        if (this.summonTitleInput) {
          if (this.summonTitleInput.nativeElement.value && this.summonTitleInput.nativeElement.value != this.data.entity.name) {
            if (this.data.entity.title != this.summonTitleInput.nativeElement.value) {
              gameManager.stateManager.before("setTitle", this.data.entity.name, this.summonTitleInput.nativeElement.value);
              this.data.entity.title = this.summonTitleInput.nativeElement.value;
              gameManager.stateManager.after();
            }
          } else if (this.data.entity.title != "") {
            gameManager.stateManager.before("unsetTitle", 'data.summon.' + this.data.entity.name, this.data.entity.title);
            this.data.entity.title = "";
            gameManager.stateManager.after();
          }
        }

        if (this.maxHp) {
          gameManager.stateManager.before("changeSummonMaxHp", gameManager.characterManager.characterName(this.data.figure), this.data.entity.title ? this.data.entity.title : "data.summon." + this.data.entity.name, ghsValueSign(this.maxHp));
          this.data.entity.maxHealth += this.maxHp;
          gameManager.stateManager.after();
        }
        if (this.health != 0) {
          gameManager.stateManager.before("changeSummonHp", gameManager.characterManager.characterName(this.data.figure), this.data.entity.title ? this.data.entity.title : "data.summon." + this.data.entity.name, ghsValueSign(this.health));
          gameManager.entityManager.changeHealth(this.data.entity, this.data.figure, this.health);
          gameManager.stateManager.after();
        }
        if (this.attack != 0 && typeof this.data.entity.attack == 'number') {
          gameManager.stateManager.before("changeSummonAttack", gameManager.characterManager.characterName(this.data.figure), this.data.entity.title ? this.data.entity.title : "data.summon." + this.data.entity.name, ghsValueSign(this.attack));
          this.data.entity.attack += this.attack;
          gameManager.stateManager.after();
        }
        if (this.movement != 0) {
          gameManager.stateManager.before("changeSummonMove", gameManager.characterManager.characterName(this.data.figure), this.data.entity.title ? this.data.entity.title : "data.summon." + this.data.entity.name, ghsValueSign(this.movement));
          this.data.entity.movement += this.movement;
          gameManager.stateManager.after();
        }
        if (this.range != 0) {
          gameManager.stateManager.before("changeSummonRange", gameManager.characterManager.characterName(this.data.figure), this.data.entity.title ? this.data.entity.title : "data.summon." + this.data.entity.name, ghsValueSign(this.range));
          this.data.entity.range += this.range;
          gameManager.stateManager.after();
        }

        const specialTagsToTemove = this.data.entity.tags.filter((specialTag) => this.data.figure instanceof Character && this.data.figure.specialActions && this.data.figure.specialActions.find((specialAction) => specialAction.name == specialTag) != undefined && this.specialTags.indexOf(specialTag) == -1);

        if (specialTagsToTemove.length) {
          gameManager.stateManager.before("removeSpecialTagsSummon", gameManager.characterManager.characterName(this.data.figure), specialTagsToTemove.map((specialTag) => '%data.character.' + this.data.figure.name + '.' + specialTag + '%').join(','), this.data.entity.title ? this.data.entity.title : "data.summon." + this.data.entity.name);
          this.data.entity.tags = this.data.entity.tags.filter((specialTag) => specialTagsToTemove.indexOf(specialTag) == -1);
          gameManager.stateManager.after();
        }

        const specialTagsToAdd = this.specialTags.filter((specialTag) => this.data.entity && this.data.entity.tags.indexOf(specialTag) == -1);

        if (specialTagsToAdd.length) {
          gameManager.stateManager.before("addSpecialTagsSummon", gameManager.characterManager.characterName(this.data.figure), specialTagsToAdd.map((specialTag) => '%data.character.' + this.data.figure.name + '.' + specialTag + '%').join(','), this.data.entity.title ? this.data.entity.title : "data.summon." + this.data.entity.name);
          this.data.entity.tags.push(...specialTagsToAdd);
          gameManager.stateManager.after();
        }
      }

      if ((this.data.entity.health <= 0 || this.data.entity.dead) && (this.data.entity.entityConditions.length == 0 || this.data.entity.entityConditions.every((entityCondition) => !entityCondition.highlight && entityCondition.types.indexOf(ConditionType.turn) == -1 && entityCondition.types.indexOf(ConditionType.apply) == -1))) {
        this.dead();
      }
    }
  }

  showMaxHealth(): boolean {
    if (this.data.figure instanceof ObjectiveContainer) {
      return !isNaN(+this.data.figure.health) && EntityValueFunction(this.data.figure.health) > 0;
    }
    return false;
  }

  closeObjectiveEntity() {
    if (this.data.figure instanceof ObjectiveContainer && this.data.entity instanceof ObjectiveEntity) {
      if (this.maxHp) {
        gameManager.stateManager.before("changeObjectiveMaxHp", this.data.figure.title || this.data.figure.name || this.data.figure.escort ? 'escort' : 'objective', ghsValueSign(this.maxHp));
        const maxHealth: number = EntityValueFunction(this.data.figure.health) + this.maxHp;
        this.data.figure.health = maxHealth;
        this.data.figure.entities.forEach((entity) => {
          if (entity.health == entity.maxHealth || entity.health > maxHealth) {
            entity.health = maxHealth;
          }
          entity.maxHealth = maxHealth;
        })
        gameManager.stateManager.after();
      }

      if (this.health != 0) {
        gameManager.stateManager.before("changeObjectiveEntityHP", this.data.figure.title || this.data.figure.name || this.data.figure.escort ? 'escort' : 'objective', this.data.entity.number, ghsValueSign(this.health));
        gameManager.entityManager.changeHealth(this.data.entity, this.data.figure, this.health);
        if (this.data.entity.health <= 0) {
          gameManager.objectiveManager.removeObjectiveEntity(this.data.figure, this.data.entity);
        }
        gameManager.stateManager.after();
        this.health = 0;
      }

      const newId = this.data.entity.number + this.id;
      if (newId != this.data.entity.number) {
        gameManager.stateManager.before("changeObjectiveEntityNumber", this.data.figure.title || this.data.figure.name || this.data.figure.escort ? 'escort' : 'objective', this.data.entity.number, "" + newId);
        this.data.entity.number = newId;
        gameManager.stateManager.after();
      }
      this.id = 0;

      if (!this.data.entity.marker) {
        this.data.entity.marker = "";
      }

      const newMarker = OBJECTIV_MARKERS[ghsModulo(this.marker + OBJECTIV_MARKERS.indexOf(this.data.entity.marker), OBJECTIV_MARKERS.length)];

      if (newMarker != this.data.entity.marker) {
        gameManager.stateManager.before("changeObjectiveEntityMarker", this.data.figure.title || this.data.figure.name || this.data.figure.escort ? 'escort' : 'objective', this.data.entity.number, newMarker);
        this.data.entity.marker = newMarker;
        gameManager.stateManager.after();
      }
      this.marker = 0;

      if (this.objectiveTitleInput) {
        if (this.objectiveTitleInput.nativeElement.value && this.objectiveTitleInput.nativeElement.value != this.data.figure.name) {
          if (this.data.figure.title != this.objectiveTitleInput.nativeElement.value) {
            gameManager.stateManager.before("setTitle", this.data.figure.name, this.objectiveTitleInput.nativeElement.value);
            this.data.figure.title = this.objectiveTitleInput.nativeElement.value;
            gameManager.stateManager.after();
          }
        } else if (this.data.figure.title != "") {
          gameManager.stateManager.before("unsetTitle", this.data.figure.name || this.data.figure.escort ? 'escort' : 'objective', this.data.figure.title);
          this.data.figure.title = "";
          gameManager.stateManager.after();
        }
      }
    }
  }

  closeObjectiveContainer() {
    if (this.data.figure instanceof ObjectiveContainer) {

      this.data.figure.marker = this.data.figure.marker || "";
      const newMarker = OBJECTIV_MARKERS[ghsModulo(this.marker + OBJECTIV_MARKERS.indexOf(this.data.figure.marker), OBJECTIV_MARKERS.length)];

      if (newMarker != this.data.figure.marker) {
        gameManager.stateManager.before("changeObjectiveMarker", this.data.figure.title || this.data.figure.name || this.data.figure.escort ? 'escort' : 'objective', newMarker);
        this.data.figure.marker = newMarker;
        this.data.figure.entities.forEach((objectiveEntity) => objectiveEntity.marker = newMarker);
        gameManager.stateManager.after();
      }
      this.marker = 0;

      if (this.objectiveTitleInput) {
        if (this.objectiveTitleInput.nativeElement.value && this.objectiveTitleInput.nativeElement.value != this.data.figure.name) {
          if (this.data.figure.title != this.objectiveTitleInput.nativeElement.value) {
            gameManager.stateManager.before("setTitle", this.data.figure.name, this.objectiveTitleInput.nativeElement.value);
            this.data.figure.title = this.objectiveTitleInput.nativeElement.value;
            gameManager.stateManager.after();
          }
        } else if (this.data.figure.title != "") {
          gameManager.stateManager.before("unsetTitle", this.data.figure.name || this.data.figure.escort ? 'escort' : 'objective', this.data.figure.title);
          this.data.figure.title = "";
          gameManager.stateManager.after();
        }
      }
    }
  }

  closeShieldRetaliate() {
    if (settingsManager.settings.characterShieldRetaliate && (this.data.entity instanceof Character || this.data.entity instanceof ObjectiveEntity) || settingsManager.settings.standeeShieldRetaliate && (this.data.entity instanceof Summon || this.data.entity instanceof MonsterEntity)) {
      if (this.entityShield.value) {
        if (!this.data.entity.shield || this.entityShield.value != this.data.entity.shield.value) {
          gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.data.entity, this.data.figure, "setEntityShield"), this.entityShield.value);
          this.data.entity.shield = this.entityShield;
          gameManager.stateManager.after();
        }
      } else if (this.data.entity.shield) {
        gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.data.entity, this.data.figure, "removeEntityShield"));
        this.data.entity.shield = undefined;
        gameManager.stateManager.after();
      }


      if (this.entityShieldPersistent.value) {
        if (!this.data.entity.shieldPersistent || this.entityShieldPersistent.value != this.data.entity.shieldPersistent.value) {
          gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.data.entity, this.data.figure, "setEntityShieldPersistent"), this.entityShield.value);
          this.data.entity.shieldPersistent = this.entityShieldPersistent;
          gameManager.stateManager.after();
        }
      } else if (this.data.entity.shieldPersistent) {
        gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.data.entity, this.data.figure, "removeEntityShieldPersistent"));
        this.data.entity.shieldPersistent = undefined;
        gameManager.stateManager.after();
      }

      const retaliate = this.entityRetaliate.filter((action) => action.value).map((action, index) => {
        let retaliateAction = new Action(ActionType.retaliate, action.value);
        retaliateAction.subActions = action.subActions || [];
        if (this.entityRetaliateRange[index] && this.entityRetaliateRange[index].value != 1) {
          retaliateAction.subActions.unshift(this.entityRetaliateRange[index]);
        }
        return retaliateAction
      });

      if (JSON.stringify(retaliate) != JSON.stringify(this.data.entity.retaliate)) {
        if (retaliate.length > 0) {
          gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.data.entity, this.data.figure, "setEntityRetaliate"), retaliate.map((action) => '%game.action.retaliate% ' + EntityValueFunction(action.value) + (action.subActions && action.subActions[0] && action.subActions[0].type == ActionType.range && EntityValueFunction(action.subActions[0].value) > 1 ? ' %game.action.range% ' + EntityValueFunction(action.subActions[0].value) + '' : '')).join(', '));

        } else {
          gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.data.entity, this.data.figure, "removeEntityRetaliate"));
        }
        this.data.entity.retaliate = retaliate;
        gameManager.stateManager.after();
      }

      const retaliatePersistent = this.entityRetaliatePersistent.filter((action) => action.value).map((action, index) => {
        let retaliateAction = new Action(ActionType.retaliate, action.value);
        retaliateAction.subActions = [];
        if (this.entityRetaliateRangePersistent[index] && this.entityRetaliateRangePersistent[index].value != 1) {
          retaliateAction.subActions.push(this.entityRetaliateRangePersistent[index]);
        }
        return retaliateAction
      });

      if (JSON.stringify(retaliatePersistent) != JSON.stringify(this.data.entity.retaliatePersistent)) {
        if (retaliatePersistent.length > 0) {
          gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.data.entity, this.data.figure, "setEntityRetaliatePersistent"), retaliatePersistent.map((action) => '%game.action.retaliate% ' + EntityValueFunction(action.value) + (action.subActions && action.subActions[0] && action.subActions[0].type == ActionType.range && EntityValueFunction(action.subActions[0].value) > 1 ? ' %game.action.range% ' + EntityValueFunction(action.subActions[0].value) + '' : '')).join(', '));
        } else {
          gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.data.entity, this.data.figure, "removeEntityRetaliatePersistent"));
        }
        this.data.entity.retaliatePersistent = retaliatePersistent;
        gameManager.stateManager.after();
      }
    }
  }

  closeAMs() {
    if (this.bless != 0) {
      gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.data.entity, this.data.figure, this.bless < 0 ? "removeCondition" + (this.bless < -1 ? 's' : '') : "addCondition" + (this.bless > 1 ? 's' : '')), AttackModifierType.bless, (this.bless > 0 ? this.bless : this.bless * -1));
      this.changeAttackModifier(AttackModifierType.bless, this.bless);
      gameManager.stateManager.after();
      this.bless = 0;
    }

    if (this.curse != 0) {
      gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.data.entity, this.data.figure, this.curse < 0 ? "removeCondition" + (this.curse < -1 ? 's' : '') : "addCondition" + (this.curse > 1 ? 's' : '')), AttackModifierType.curse, (this.curse > 0 ? this.curse : this.curse * -1));
      this.changeAttackModifier(AttackModifierType.curse, this.curse);
      gameManager.stateManager.after();
      this.curse = 0;
    }

    if (this.empower != 0) {
      if (this.empowerChar || this.empower < 0) {
        gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.data.entity, this.data.figure, this.empower < 0 ? "removeCondition" + (this.empower < -1 ? 's' : '') : "addCondition" + (this.empower > 1 ? 's' : '')), AttackModifierType.empower, (this.empower > 0 ? this.empower : this.empower * -1));
        if (this.empowerChar && this.empower > 0) {
          const additional = gameManager.attackModifierManager.getAdditional(this.empowerChar, AttackModifierType.empower);
          for (let i = 0; i < Math.min(this.empower, additional.length); i++) {
            gameManager.attackModifierManager.addModifier(this.attackModifierDeck(), additional[i]);
          }
        } else {
          for (let i = 0; i < this.empower * -1; i++) {
            const empower = this.attackModifierDeck().cards.find((am, index) => index > this.attackModifierDeck().current && am.type == AttackModifierType.empower);
            if (empower) {
              this.attackModifierDeck().cards.splice(this.attackModifierDeck().cards.indexOf(empower), 1);
            }
          }
        }
        gameManager.stateManager.after();
        this.empower = 0;
      }
    }

    if (this.enfeeble != 0) {
      if (this.enfeebleChar || this.enfeeble < 0) {
        gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.data.entity, this.data.figure, this.enfeeble < 0 ? "removeCondition" + (this.enfeeble < -1 ? 's' : '') : "addCondition" + (this.enfeeble > 1 ? 's' : '')), AttackModifierType.enfeeble, (this.enfeeble > 0 ? this.enfeeble : this.enfeeble * -1));
        if (this.enfeebleChar && this.enfeeble > 0) {
          const additional = gameManager.attackModifierManager.getAdditional(this.enfeebleChar, AttackModifierType.enfeeble);
          for (let i = 0; i < Math.min(this.enfeeble, additional.length); i++) {
            gameManager.attackModifierManager.addModifier(this.attackModifierDeck(), additional[i]);
          }
        } else {
          for (let i = 0; i < this.enfeeble * -1; i++) {
            const enfeeble = this.attackModifierDeck().cards.find((am, index) => index > this.attackModifierDeck().current && am.type == AttackModifierType.enfeeble);
            if (enfeeble) {
              this.attackModifierDeck().cards.splice(this.attackModifierDeck().cards.indexOf(enfeeble), 1);
            }
          }
        }
        gameManager.stateManager.after();
        this.enfeeble = 0;
      }
    }
  }

  closeConditions() {
    if (this.data.entity) {
      this.entityConditions.filter((entityCondition) => entityCondition.state == EntityConditionState.new || entityCondition.state == EntityConditionState.removed).forEach((entityCondition) => {
        if (this.data.entity && (entityCondition.state == EntityConditionState.new || gameManager.entityManager.hasCondition(this.data.entity, entityCondition, entityCondition.permanent))) {
          if (this.data.entity instanceof Character && entityCondition.name == ConditionName.muddle && entityCondition.state == EntityConditionState.new &&
            this.data.entity.progress.equippedItems.find((identifier) => identifier.edition == 'gh' && identifier.name == '108')) {
            entityCondition.name = ConditionName.strengthen;
          }

          entityCondition.expired = entityCondition.state == EntityConditionState.new;
          gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.data.entity, this.data.figure, entityCondition.state == EntityConditionState.removed ? "removeCondition" : "addCondition"), entityCondition.name, this.data.entity instanceof MonsterEntity ? 'monster.' + this.data.entity.type + ' ' : '');
          if (entityCondition.state == EntityConditionState.removed) {
            gameManager.entityManager.removeCondition(this.data.entity, this.data.figure, entityCondition, entityCondition.permanent);
          } else {
            gameManager.entityManager.addCondition(this.data.entity, this.data.figure, entityCondition, entityCondition.permanent);
          }
          gameManager.stateManager.after();
        }
      })

      this.entityConditions.forEach((condition) => {
        if (this.data.entity) {
          const entityCondition = this.data.entity.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired);
          if ((condition.types.indexOf(ConditionType.stack) != -1 || condition.types.indexOf(ConditionType.upgrade) != -1) && entityCondition && entityCondition.value != condition.value) {
            gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.data.entity, this.data.figure, "setConditionValue"), condition.name, "" + condition.value, this.data.entity instanceof MonsterEntity ? 'monster.' + (this.data.entity as MonsterEntity).type + ' ' : '');
            entityCondition.value = condition.value;
            gameManager.stateManager.after();
          }
        }
      })

      this.data.entity.immunities.forEach((immunity) => {
        if (this.data.entity && this.entityImmunities.indexOf(immunity) == -1) {
          gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.data.entity, this.data.figure, 'removeImmunity'), immunity);
          this.data.entity.immunities = this.data.entity.immunities.filter((existing) => existing != immunity);
          gameManager.stateManager.after();
        }
      })

      this.entityImmunities.forEach((immunity) => {
        if (this.data.entity && this.data.entity.immunities.indexOf(immunity) == -1) {
          gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.data.entity, this.data.figure, 'addImmunity'), immunity);
          this.data.entity.immunities.push(immunity);
          gameManager.stateManager.after();
        }
      })
    }
  }

}