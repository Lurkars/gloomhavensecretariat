import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, inject, input, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CharacterManager } from 'src/app/game/businesslogic/CharacterManager';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { RpgAttribute } from 'src/app/game/model/CharacterProgress';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { CharacterSpecialAction } from 'src/app/game/model/data/CharacterStat';
import { ConditionType, EntityCondition, EntityConditionState } from 'src/app/game/model/data/Condition';
import { GameState } from 'src/app/game/model/Game';
import { Summon, SummonState } from 'src/app/game/model/Summon';
import { ActionComponent } from 'src/app/ui/figures/actions/action';
import { AttackModifierDrawComponent } from 'src/app/ui/figures/attackmodifier/attackmodifier-draw';
import { AttackModiferDeckChange, AttackModifierDeckComponent } from 'src/app/ui/figures/attackmodifier/attackmodifierdeck';
import { AttackModifierDeckFullscreenComponent } from 'src/app/ui/figures/attackmodifier/attackmodifierdeck-fullscreen';
import { CharacterBattleGoalsDialog } from 'src/app/ui/figures/battlegoal/dialog/battlegoal-dialog';
import { CharacterImageComponent } from 'src/app/ui/figures/character/cards/image';
import { CharacterInitiativeComponent } from 'src/app/ui/figures/character/cards/initiative';
import { CharacterInitiativeDialogComponent } from 'src/app/ui/figures/character/cards/initiative-dialog';
import { CharacterSheetDialog } from 'src/app/ui/figures/character/dialogs/character-sheet-dialog';
import { CharacterLootCardsDialog } from 'src/app/ui/figures/character/dialogs/loot-cards';
import { CharacterSummonDialog } from 'src/app/ui/figures/character/dialogs/summondialog';
import { CharacterItemListComponent } from 'src/app/ui/figures/character/item-list/item-list';
import { AbilityCardsDialogComponent } from 'src/app/ui/figures/character/sheet/abilities/ability-cards-dialog';
import { HighlightConditionsComponent } from 'src/app/ui/figures/conditions/highlight';
import { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { FigureErrorsComponent } from 'src/app/ui/figures/errors/errors';
import { ItemsDialogComponent } from 'src/app/ui/figures/items/dialog/items-dialog';
import { LootComponent } from 'src/app/ui/figures/loot/loot-card';
import { EntityIndexKeyComponent } from 'src/app/ui/figures/standee/entity-index-key/entity-index-key';
import { StandeeComponent } from 'src/app/ui/figures/standee/standee';
import { EntityAnimationDirective } from 'src/app/ui/helper/EntityAnimation';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsMinZeroPipe, GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsCompactPortrait, ghsDefaultDialogPositions, ghsValueSign } from 'src/app/ui/helper/Static';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';
import { ValueSignDirective } from 'src/app/ui/helper/ValueSign';
import { ghsCharacterRouteId } from 'src/app/ui/tools/standalone/standalone-character';

@Component({
  imports: [
    NgClass,
    EntityAnimationDirective,
    GhsLabelDirective,
    GhsTooltipDirective,
    PointerInputDirective,
    GhsMinZeroPipe,
    GhsRangePipe,
    TrackUUIDPipe,
    ValueSignDirective,
    ActionComponent,
    AttackModifierDeckComponent,
    AttackModifierDrawComponent,
    CharacterImageComponent,
    CharacterInitiativeComponent,
    CharacterItemListComponent,
    EntityIndexKeyComponent,
    FigureErrorsComponent,
    HighlightConditionsComponent,
    LootComponent,
    StandeeComponent
  ],
  selector: 'ghs-character',
  templateUrl: './character.html',
  styleUrls: ['./character.scss']
})
export class CharacterComponent implements OnInit {
  private dialog = inject(Dialog);
  private overlay = inject(Overlay);
  private router = inject(Router);
  protected ghsManager = inject(GhsManager);
  protected cdr = inject(ChangeDetectorRef);

  readonly inputCharacter = input.required<Character>({ alias: 'character' });
  get character(): Character {
    return this.inputCharacter();
  }

  readonly characterName = viewChild.required<ElementRef>('characterName');
  readonly summonButton = viewChild.required<ElementRef>('summonButton');

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  characterManager: CharacterManager = gameManager.characterManager;

  GameState = GameState;
  ConditionType = ConditionType;
  EntityConditionState = EntityConditionState;
  AttackModifierType = AttackModifierType;
  levelDialog: boolean = false;

  characterHp: number = 0;
  characterMaxHp: number = 0;

  characterTitle: string = '';
  initiative: number = -1;
  health: number = 0;
  experience: number = 0;
  loot: number = 0;
  maxHp: number = 0;
  token: number = 0;
  amAnimationDrawing: boolean = false;
  compact: boolean = false;
  short: boolean = false;
  shortMenu: boolean = false;

  summons: Summon[] = [];
  summonsAfterTurn: Summon[] = [];
  summonCount: number = 0;
  summonsAfterTurnCount: number = 0;
  activeConditions: EntityCondition[] = [];
  extraActions: Action[] = [];
  extraActionsPersistent: Action[] = [];
  specialActions: CharacterSpecialAction[] = [];
  off: boolean = false;
  battleGoalSelected: boolean = false;
  identityIcon: string = '';
  rpgAttributes: { attribute: RpgAttribute; value: number }[] = [];

  bb: boolean = false;
  // TODO: items not implemented for RPG yet
  rpg: boolean = false;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }

  update(): void {
    this.characterHp = this.character.health;
    this.characterMaxHp = this.character.maxHealth;
    this.characterTitle = gameManager.characterManager.characterName(this.character);
    this.summons = this.character.summons.filter((summon) => !summon.afterTurn);
    this.summonsAfterTurn = this.character.summons.filter((summon) => summon.afterTurn);
    this.summonCount = this.summons.filter((summon) => gameManager.entityManager.isAlive(summon)).length;
    this.summonsAfterTurnCount = this.summonsAfterTurn.filter((summon) => gameManager.entityManager.isAlive(summon)).length;
    this.activeConditions = gameManager.conditionManager.activeConditions(this.character);
    this.character.immunities.forEach((immunity) => {
      if (!this.activeConditions.find((entityCondition) => entityCondition.name === immunity)) {
        this.activeConditions.push(new EntityCondition(immunity));
      }
    });

    if (
      settingsManager.settings.characterAttackModifierDeckPermanent &&
      settingsManager.settings.characterAttackModifierDeckPermanentActive &&
      gameManager.game.state === GameState.next
    ) {
      if (this.character.active) {
        this.character.attackModifierDeck.active = true;
      }
    }

    this.compact = settingsManager.settings.characterCompact && settingsManager.settings.theme !== 'modern';
    this.short = (!settingsManager.settings.abilities || !settingsManager.settings.stats) && settingsManager.settings.theme !== 'modern';
    this.shortMenu = false;
    this.bb = gameManager.bbRules() || this.character.editionRules === 'bb';
    this.rpg = gameManager.characterRpgManager.isRpgCharacter(this.character);
    this.specialActions = this.character.specialActions.filter((specialAction) => this.character.tags.includes(specialAction.name));
    this.off = this.character.off || this.character.exhausted || this.character.health <= 0;
    this.battleGoalSelected = this.character.battleGoal && this.character.battleGoals.length > 0;
    this.identityIcon =
      this.character.identities && this.character.identities.length
        ? gameManager.characterManager.characterIdentityIcon(this.character.name, this.character.identity)
        : '';
    this.extraActions = [...this.character.extraActions.filter((action) => action.type !== ActionType.extra)];
    this.extraActionsPersistent = [...this.character.extraActionsPersistent.filter((action) => action.type !== ActionType.extra)];
    const attributes = this.character.progress.rpg?.attributes || {};
    this.rpgAttributes = gameManager.characterRpgManager.isRpgCharacter(this.character)
      ? Object.values(RpgAttribute)
          .map((attribute) => ({ attribute, value: attributes[attribute] || 0 }))
          .filter((rpgAttribute) => rpgAttribute.value > 0)
      : [];
  }

  beforeAttackModifierDeck(change: AttackModiferDeckChange) {
    gameManager.stateManager.before(
      'updateAttackModifierDeck.' + change.type,
      gameManager.characterManager.characterName(this.character, true, true),
      ...change.values
    );
  }

  afterAttackModifierDeck(change: AttackModiferDeckChange) {
    this.character.attackModifierDeck = change.deck;
    gameManager.stateManager.after();
  }

  dragInitiativeMove(value: number) {
    value = gameManager.roundManager.clampInitiative(value);

    this.initiative = value;
    this.cdr.markForCheck();
  }

  dragInitiativeEnd(value: number) {
    value = gameManager.roundManager.clampInitiative(value);

    if (this.character.initiative !== value && gameManager.roundManager.validInitiative(value)) {
      gameManager.entityManager.before(this.character, this.character, 'setInitiative', value);
      gameManager.roundManager.setInitiative(this.character, value);
      gameManager.stateManager.after();
    }
    this.initiative = -1;
  }

  toggleFigure(event: any): void {
    if (!this.character.absent) {
      if (gameManager.characterManager.canToggleActive(this.character)) {
        gameManager.stateManager.before(...gameManager.characterManager.toggleActiveUndoInfos(this.character));
        gameManager.characterManager.toggleActive(this.character);
        gameManager.stateManager.after();
      } else if (
        (settingsManager.settings.initiativeRequired && this.character.initiative <= 0) ||
        gameManager.game.state === GameState.draw
      ) {
        this.openInitiativeDialog(event);
      }
    }
  }

  nextIdentity(event: any): void {
    if (settingsManager.settings.characterIdentities && this.character.identities && this.character.identities.length > 1) {
      const next = gameManager.characterManager.nextIdentity(this.character);
      if (!gameManager.characterManager.canSetIdentity(this.character, next)) {
        return;
      }

      gameManager.entityManager.before(
        this.character,
        this.character,
        'identity',
        this.character.edition,
        this.character.name,
        next,
        this.character.identities[next]
      );
      gameManager.characterManager.setIdentity(this.character, next);
      gameManager.stateManager.after();
      event.preventDefault();
    } else {
      this.openEntityMenu();
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
    if (
      this.character.active &&
      this.character.summons
        .filter((summon) => gameManager.entityManager.isAlive(summon) && summon.state !== SummonState.new)
        .find((summon, index, self) => summon.active && index < self.length - 1)
    ) {
      this.character.summons.forEach((summon) => (summon.active = false));
    } else {
      this.openInitiativeDialog(event);
    }
  }

  dragHpMove(value: number) {
    this.health = value;
    const maxHealth = gameManager.specialActionsManager.maxHealth(this.character);

    if (this.character.health + this.health > maxHealth) {
      this.health = maxHealth - this.character.health;
    }
  }

  dragHpEnd() {
    if (this.health !== 0) {
      gameManager.entityManager.before(this.character, this.character, 'changeHP', ghsValueSign(this.health));
      gameManager.entityManager.changeHealth(this.character, this.character, this.health);
      this.health = 0;
      gameManager.stateManager.after();
    }
  }

  dragXpMove(value: number) {
    this.experience = value;
    if (this.character.experience + this.experience < 0) {
      this.experience = -this.character.experience;
    }
  }

  dragXpEnd() {
    if (this.experience !== 0) {
      gameManager.entityManager.before(this.character, this.character, 'changeXP', ghsValueSign(this.experience));
      gameManager.characterManager.changeExperience(this.character, this.experience);
      this.experience = 0;
      gameManager.stateManager.after();
    }
  }

  addExperience(value: number) {
    this.experience = value;
    if (this.character.experience + this.experience >= 0) {
      gameManager.entityManager.before(this.character, this.character, 'changeXP', ghsValueSign(this.experience));
      gameManager.characterManager.changeExperience(this.character, this.experience);
      gameManager.stateManager.after();
    }
    this.experience = 0;
  }

  dragTokenMove(value: number) {
    this.token = value;
    if (this.character.primaryToken < 0 && this.character.token + this.token < 0) {
      this.token = -this.character.token;
    } else if (this.character.primaryToken >= 0 && this.character.tokenValues[this.character.primaryToken] + this.token < 0) {
      this.token = -this.character.tokenValues[this.character.primaryToken];
    } else if (this.character.primaryToken >= 0) {
      const maxTokenValue = gameManager.specialActionsManager.maxTokenValue(this.character, this.character.primaryToken);
      if (maxTokenValue !== undefined && this.character.tokenValues[this.character.primaryToken] + this.token > maxTokenValue) {
        this.token = maxTokenValue - this.character.tokenValues[this.character.primaryToken];
      }
    }
  }

  dragTokenEnd() {
    if (this.token !== 0) {
      if (this.character.primaryToken < 0) {
        gameManager.entityManager.before(
          this.character,
          this.character,
          'characterToken',
          this.character.name,
          gameManager.characterManager.tokenAfter(this.character, this.token)
        );
        gameManager.characterManager.changeToken(this.character, this.token);
        this.token = 0;
        gameManager.stateManager.after();
      } else {
        gameManager.entityManager.before(
          this.character,
          this.character,
          'characterTokenValue',
          this.character.name,
          this.character.tokens[this.character.primaryToken],
          gameManager.characterManager.tokenValueAfter(this.character, this.character.primaryToken, this.token)
        );
        gameManager.characterManager.changeTokenValue(this.character, this.character.primaryToken, this.token);

        this.token = 0;
        gameManager.stateManager.after();
      }
    }
  }

  dragLootMove(value: number) {
    this.loot = value;
    if (this.character.loot + this.loot < 0) {
      this.loot = -this.character.loot;
    }
  }

  dragLootEnd() {
    if (this.loot !== 0) {
      gameManager.entityManager.before(this.character, this.character, 'changeLoot', ghsValueSign(this.loot));
      gameManager.characterManager.changeLoot(this.character, this.loot);
      this.loot = 0;
      gameManager.stateManager.after();
    }
  }

  addLoot(value: number) {
    this.loot = value;
    if (this.character.loot + this.loot >= 0) {
      gameManager.entityManager.before(this.character, this.character, 'changeLoot', ghsValueSign(this.loot));
      gameManager.characterManager.changeLoot(this.character, this.loot);
      gameManager.stateManager.after();
    }
    this.loot = 0;
  }

  dragCancel() {
    this.health = 0;
    this.experience = 0;
    this.loot = 0;
    this.token = 0;
  }

  openEntityMenu(): void {
    this.dialog.open(EntitiesMenuDialogComponent, {
      panelClass: ['dialog'],
      data: {
        entity: this.character,
        figure: this.character,
        positionElement: this.characterName()
      },
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.characterName()).withPositions(ghsDefaultDialogPositions())
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
        figure: this.character
      },
      positionStrategy: this.overlay.position().flexibleConnectedTo(event.target).withPositions(ghsDefaultDialogPositions())
    });
  }

  openSummonDialog(): void {
    this.dialog.open(CharacterSummonDialog, {
      panelClass: ['dialog'],
      data: this.character,
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.summonButton()).withPositions(ghsDefaultDialogPositions('left'))
    });
  }

  openCharacterSheet(): void {
    this.dialog.open(CharacterSheetDialog, {
      panelClass: ['dialog-invert'],
      data: { character: this.character }
    });
  }

  removeCondition(entityCondition: EntityCondition) {
    gameManager.entityManager.before(
      this.character,
      this.character,
      gameManager.conditionManager.isImmunityPlaceholder(this.character, entityCondition) ? 'removeImmunity' : 'removeCondition',
      entityCondition.name
    );
    gameManager.conditionManager.reduceCondition(this.character, this.character, entityCondition);
    gameManager.stateManager.after();
  }

  removeMarker(marker: string) {
    const edition = marker.split('-')[0];
    const name = marker.split('-').slice(1).join('-');
    gameManager.entityManager.before(this.character, this.character, 'removeCharacterMarker', marker, edition + '.' + name);
    gameManager.entityManager.setMarker([this.character], marker, false);
    gameManager.stateManager.after();
  }

  openBattleGoals(): void {
    this.dialog.open(CharacterBattleGoalsDialog, {
      panelClass: ['dialog'],
      data: { character: this.character, draw: !this.character.battleGoals || this.character.battleGoals.length === 0 }
    });
  }

  openItems(force: boolean = false): void {
    if (settingsManager.settings.characterItemsPermanent && !force) {
      gameManager.stateManager.before(
        this.character.itemsVisible ? 'characterItemsHide' : 'characterItemsShow',
        gameManager.characterManager.characterName(this.character, true, true)
      );
      gameManager.characterManager.toggleItemsVisible(this.character);
      gameManager.stateManager.after();
    } else {
      this.dialog.open(ItemsDialogComponent, {
        panelClass: ['dialog'],
        data: { edition: gameManager.game.edition, select: this.character, affordable: true, owned: force && !this.bb ? false : undefined }
      });
    }
  }

  characterFullView() {
    if (settingsManager.settings.characterFullView) {
      this.router.navigate(['/fullview', ghsCharacterRouteId(this.character)]);
    } else if (settingsManager.settings.characterSheet) {
      this.openCharacterSheet();
    } else {
      this.openEntityMenu();
    }
  }

  toggleAttackModifierDeckVisible() {
    const hides = gameManager.characterManager.attackModifierDeckToggleHides(this.character);
    if (
      ghsCompactPortrait() &&
      !hides &&
      !settingsManager.settings.characterAttackModifierDeckActiveBottom &&
      !settingsManager.settings.characterAttackModifierDeckPermanent
    ) {
      if (this.character.lootCardsVisible) {
        this.toggleLootCardsVisible();
      }

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
          numeration: '' + this.character.number,
          before: before,
          after: after
        }
      });

      dialog.closed.subscribe({
        next: () => {
          before.unsubscribe();
          after.unsubscribe();
        }
      });
    } else {
      gameManager.stateManager.before(
        'updateAttackModifierDeck.' + (hides ? 'amDeckHide' : 'amDeckShow'),
        gameManager.characterManager.characterName(this.character, true, true)
      );
      gameManager.characterManager.toggleAttackModifierDeckVisible(this.character);
      gameManager.stateManager.after();
    }
  }

  toggleLootCardsVisible() {
    if (!this.character.lootCardsVisible && ghsCompactPortrait()) {
      this.openLootDeckDialog();
    } else {
      gameManager.stateManager.before(
        this.character.lootCardsVisible ? 'characterLootCardsHide' : 'characterLootCardsShow',
        gameManager.characterManager.characterName(this.character, true, true)
      );
      gameManager.characterManager.toggleLootCardsVisible(this.character);
      gameManager.stateManager.after();
    }
  }

  openLootDeckDialog() {
    this.dialog.open(CharacterLootCardsDialog, {
      panelClass: ['dialog'],
      data: this.character
    });
  }

  removeExtraAction(action: Action, persistent: boolean = false) {
    const index = gameManager.actionsManager.extraActions(this.character, persistent).indexOf(action);
    if (!gameManager.actionsManager.canRemoveExtraAction(this.character, index, persistent)) {
      return;
    }
    const actions = gameManager.actionsManager.extraActionsWithout(this.character, index, persistent);

    gameManager.entityManager.before(
      this.character,
      this.character,
      persistent ? 'changeExtraActionsPersistent' : 'changeExtraActions',
      actions.length
        ? actions.map((action) => gameManager.actionsManager.extraActionLabel(action)).join(', ')
        : gameManager.actionsManager.extraActionLabel(action)
    );

    gameManager.actionsManager.removeExtraAction(this.character, index, persistent);
    gameManager.stateManager.after();
  }

  removeSpecialAction(specialAction: string) {
    if (!gameManager.specialActionsManager.canSetSpecialAction(this.character, this.character, specialAction, false)) {
      return;
    }
    gameManager.entityManager.before(
      this.character,
      this.character,
      'removeSpecialTags',
      '%data.character.' + this.character.edition + '.' + this.character.name + '.' + specialAction + '%'
    );
    gameManager.specialActionsManager.setSpecialAction(this.character, this.character, specialAction, false);
    gameManager.stateManager.after();
  }

  triggerSpecialActionSlot(specialAction: CharacterSpecialAction, index: number, force: boolean = false) {
    if (gameManager.specialActionsManager.slotChangeable(this.character, specialAction, index, force)) {
      const revert = index < gameManager.specialActionsManager.slotIndex(this.character, specialAction);
      gameManager.entityManager.before(
        this.character,
        this.character,
        'triggerSpecialTagSlot' + (revert ? '.revert' : ''),
        '%data.character.' + this.character.edition + '.' + this.character.name + '.' + specialAction.name + '%'
      );
      gameManager.specialActionsManager.setSlot(this.character, specialAction, index, force);
      gameManager.stateManager.after();
    }
  }

  openAbilityCards() {
    if (gameManager.editionManager.deckData(this.character, true).abilities.length > 0) {
      this.dialog.open(AbilityCardsDialogComponent, {
        panelClass: ['dialog'],
        data: { character: this.character }
      });
    }
  }
}
