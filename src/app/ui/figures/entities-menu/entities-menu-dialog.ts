import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { CharacterSpecialAction } from 'src/app/game/model/data/CharacterStat';
import { ConditionName, ConditionType, EntityCondition } from 'src/app/game/model/data/Condition';
import { EventCardCondition, EventCardEffect } from 'src/app/game/model/data/EventCard';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { ObjectiveData } from 'src/app/game/model/data/ObjectiveData';
import { Entity, EntityValueFunction } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { OBJECTIV_MARKERS, ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { Summon, SummonColor, SummonState } from 'src/app/game/model/Summon';
import { ActionComponent } from 'src/app/ui/figures/actions/action';
import { CharacterSheetDialog } from 'src/app/ui/figures/character/dialogs/character-sheet-dialog';
import { ConditionsComponent } from 'src/app/ui/figures/conditions/conditions';
import { AttackModifierHelper } from 'src/app/ui/figures/entities-menu/helpers/attack-modifiers';
import { CampaignHelper } from 'src/app/ui/figures/entities-menu/helpers/campaign';
import { CharacterHelper } from 'src/app/ui/figures/entities-menu/helpers/character';
import { CharacterProgressHelper } from 'src/app/ui/figures/entities-menu/helpers/character-progress';
import { ConditionHelper } from 'src/app/ui/figures/entities-menu/helpers/conditions';
import { EventHelper } from 'src/app/ui/figures/entities-menu/helpers/event';
import { HealthHelper } from 'src/app/ui/figures/entities-menu/helpers/health';
import { MarkerHelper } from 'src/app/ui/figures/entities-menu/helpers/marker';
import { MonsterHelper } from 'src/app/ui/figures/entities-menu/helpers/monster';
import { ObjectiveHelper } from 'src/app/ui/figures/entities-menu/helpers/objective';
import { ShieldRetaliateHelper } from 'src/app/ui/figures/entities-menu/helpers/shield-retaliate';
import { SpecialActionsHelper } from 'src/app/ui/figures/entities-menu/helpers/special-actions';
import { EventCardAttackComponent } from 'src/app/ui/figures/event/attack/event-card-attack';
import { EventCardConditionComponent } from 'src/app/ui/figures/event/condition/event-card-condition';
import { EventCardEffectComponent } from 'src/app/ui/figures/event/effect/event-card-effect';
import { EntityIndexKeyComponent } from 'src/app/ui/figures/standee/entity-index-key/entity-index-key';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsMinZeroPipe, GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsDialogClosingHelper, ghsModulo } from 'src/app/ui/helper/Static';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';
import { ValueCalcDirective } from 'src/app/ui/helper/valueCalc';
import { ValueSignDirective } from 'src/app/ui/helper/ValueSign';

@Component({
  imports: [
    NgClass,
    GhsLabelDirective,
    GhsTooltipDirective,
    PointerInputDirective,
    TabClickDirective,
    GhsMinZeroPipe,
    GhsRangePipe,
    TrackUUIDPipe,
    ValueCalcDirective,
    ValueSignDirective,
    ActionComponent,
    ConditionsComponent,
    EntityIndexKeyComponent,
    EventCardAttackComponent,
    EventCardConditionComponent,
    EventCardEffectComponent
  ],
  selector: 'ghs-entities-menu-dialog',
  templateUrl: 'entities-menu-dialog.html',
  styleUrls: ['./entities-menu-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntitiesMenuDialogComponent {
  dialogRef = inject(DialogRef);
  dialog = inject(Dialog);
  overlay = inject(Overlay);
  ghsManager = inject(GhsManager);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  // all entities
  health: number = 0;
  maxHealth: number = 0;
  bless: number = 0;
  curse: number = 0;

  blessMin: number = -1;
  curseMin: number = -1;
  isMonster: boolean = false;

  entityConditions: EntityCondition[] = [];
  initialImmunities: ConditionName[] = [];
  entityImmunities: ConditionName[] = [];

  characterMarker: string[] = [];
  characterMarkerToAdd: string[] = [];
  characterMarkerToRemove: string[] = [];

  // shield and retaliate
  entityShield: Action = new Action(ActionType.shield, 0);
  entityShieldPersistent: Action = new Action(ActionType.shield, 0);
  entityRetaliate: Action[] = [new Action(ActionType.retaliate, 0)];
  entityRetaliatePersistent: Action[] = [new Action(ActionType.retaliate, 0)];
  entityRetaliateRange: Action[] = [new Action(ActionType.range, 1, ActionValueType.fixed, [], true)];
  entityRetaliateRangePersistent: Action[] = [new Action(ActionType.range, 1, ActionValueType.fixed, [], true)];

  // character specific
  loot: number = 0;
  experience: number = 0;
  empower: number = 0;
  empowerEnabled: boolean = false;
  enfeeble: number = 0;
  enfeebleEnabled: boolean = false;

  empowerMin: number = -1;
  empowerMax: number = -1;
  enfeebleMin: number = -1;
  enfeebleMax: number = -1;

  characterToken: number = 0;
  characterTokenValues: number[] = [];
  actionHints: Action[] = [];
  specialTags: string[] = [];
  titles: string[] = [];

  empowerChar: Character | undefined;
  empowerChars: Character[] = [];
  enfeebleChar: Character | undefined;
  enfeebleChars: Character[] = [];

  identities: string[] = [];
  specialActions: CharacterSpecialAction[] = [];

  // B&B
  bb: boolean = false;

  // Objective specific
  objectiveMarker: number = 0;
  objectiveId: number = 0;
  objectiveTitle: string | undefined;
  objectiveData: ObjectiveData | undefined;
  amDecks: string[] = [];
  trackDamage: boolean = false;

  // figures and entities
  figure: Figure | undefined;
  entity: Entity | undefined;
  figures: Figure[] = [];
  entities: Entity[];
  allEntities: Entity[] = [];
  filter: 'character' | 'monster' | 'allies' | 'enemies' | 'objectives' | undefined;
  filters: ('character' | 'monster' | 'allies' | 'enemies' | 'objectives' | undefined)[] = [
    undefined,
    'character',
    'monster',
    'objectives',
    'allies',
    'enemies'
  ];

  // helper
  entityIndexKey: boolean = false;
  eventMenu: boolean = false;
  forceEventMenu: boolean = false;
  objectiveOnly: boolean = false;
  shieldAndRetaliate: boolean = false;

  ConditionName = ConditionName;
  ConditionType = ConditionType;
  MonsterType = MonsterType;
  SummonState = SummonState;
  SummonColor = SummonColor;
  OBJECTIV_MARKERS = OBJECTIV_MARKERS;
  AttackModifierType = AttackModifierType;
  EntityValueFunction = EntityValueFunction;
  ghsModulo = ghsModulo;
  Math = Math;
  catching: boolean = false;
  catchingDisabled: boolean = true;

  // helpers
  amHelper: AttackModifierHelper;
  campaignHelper: CampaignHelper;
  characterHelper: CharacterHelper;
  characterProgressHelper: CharacterProgressHelper;
  conditionHelper: ConditionHelper;
  eventHelper: EventHelper;
  healthHelper: HealthHelper;
  markerHelper: MarkerHelper;
  monsterHelper: MonsterHelper;
  objectiveHelper: ObjectiveHelper;
  shieldRetaliateHelper: ShieldRetaliateHelper;
  specialActionsHelper: SpecialActionsHelper;

  data: {
    figure: Figure | undefined;
    entity: Entity | undefined;
    type: MonsterType | undefined;
    objectiveOnly: boolean;
    filter: 'character' | 'monster' | 'allies' | 'enemies' | 'objectives' | undefined;
    entityIndexKey: boolean;
    eventMenu: boolean;
    eventResults: (EventCardEffect | EventCardCondition)[];
    positionElement: ElementRef;
  } = inject(DIALOG_DATA);

  constructor() {
    this.amHelper = new AttackModifierHelper(this);
    this.campaignHelper = new CampaignHelper(this);
    this.characterHelper = new CharacterHelper(this);
    this.characterProgressHelper = new CharacterProgressHelper(this);
    this.conditionHelper = new ConditionHelper(this);
    this.eventHelper = new EventHelper(this);
    this.healthHelper = new HealthHelper(this);
    this.markerHelper = new MarkerHelper(this);
    this.monsterHelper = new MonsterHelper(this);
    this.objectiveHelper = new ObjectiveHelper(this);
    this.shieldRetaliateHelper = new ShieldRetaliateHelper(this);
    this.specialActionsHelper = new SpecialActionsHelper(this);
    this.filter = !!this.data ? this.data.filter : undefined;
    this.entityIndexKey = !!this.data && this.data.entityIndexKey;
    if (!!this.data && !!this.data.eventResults) {
      this.eventHelper.createEventResults(this.data.eventResults);
    }
    this.eventMenu = !!this.data && (this.data.eventMenu || !!this.data.eventResults);
    if (this.eventMenu) {
      this.filter = 'character';
    }
    this.objectiveOnly = !!this.data && this.data.objectiveOnly;
    if (!!this.data && this.data.figure) {
      this.figure = this.data.figure;
      this.figures = [this.figure];
      if (this.figure instanceof Monster) {
        this.allEntities = this.figure.entities.filter((entity) => !this.data.type || entity.type === this.data.type);
      } else if (this.figure instanceof Character) {
        this.allEntities = this.figure.summons;
      } else if (this.figure instanceof ObjectiveContainer && !this.objectiveOnly) {
        this.allEntities = this.figure.entities;
      }
    }

    if (!!this.data && this.data.entity) {
      this.entity = this.data.entity;
      this.allEntities = [this.entity];

      if (this.entity instanceof Summon && this.entity.init) {
        this.characterHelper.openLevelDialog();
      }
    }

    if (!this.figure && !this.entity) {
      this.updateFigures();
    }

    this.dialogRef.closed.subscribe({
      next: (forced) => {
        if (!forced) {
          this.close();
        }
      }
    });

    this.entities = [];
    this.allEntities.forEach((entity) => this.entities.push(entity));
    this.update();
  }

  updateFigures() {
    if (gameManager.game.figures.find((figure) => figure instanceof Character) === undefined) {
      this.filters = this.filters.filter((v) => v !== 'character');
    } else if (!this.filters.includes('character')) {
      this.filters.push('character');
    }

    if (gameManager.game.figures.find((figure) => figure instanceof Monster) === undefined) {
      this.filters = this.filters.filter((v) => v !== 'monster');
    } else if (!this.filters.includes('monster')) {
      this.filters.push('monster');
    }

    if (gameManager.game.figures.find((figure) => figure instanceof ObjectiveContainer) === undefined) {
      this.filters = this.filters.filter((v) => v !== 'objectives');
    } else if (!this.filters.includes('objectives')) {
      this.filters.push('objectives');
    }

    if (
      gameManager.game.figures.find(
        (figure) => (figure instanceof ObjectiveContainer && figure.escort) || (figure instanceof Monster && figure.isAlly)
      ) === undefined
    ) {
      this.filters = this.filters.filter((v) => v !== 'allies');
    } else if (!this.filters.includes('allies')) {
      this.filters.push('allies');
    }

    if (gameManager.game.figures.find((figure) => figure instanceof ObjectiveContainer && !figure.escort) === undefined) {
      this.filters = this.filters.filter((v) => v !== 'enemies');
    } else if (!this.filters.includes('enemies')) {
      this.filters.push('enemies');
    }

    this.figures = gameManager.game.figures.filter(
      (figure) =>
        (figure instanceof Character && !figure.absent && (!this.filter || this.filter === 'character' || this.filter === 'allies')) ||
        (figure instanceof Monster &&
          (!this.filter ||
            this.filter === 'monster' ||
            (this.filter === 'enemies' && !figure.isAlly) ||
            (this.filter === 'allies' && figure.isAlly))) ||
        (figure instanceof ObjectiveContainer &&
          (!this.filter ||
            (this.filter === 'allies' && figure.escort) ||
            (this.filter === 'enemies' && !figure.escort) ||
            this.filter === 'objectives'))
    );

    this.allEntities = [];

    this.figures.forEach((figure) => {
      if (figure instanceof Character) {
        this.allEntities.push(figure, ...figure.summons);
      } else if (figure instanceof Monster || (figure instanceof ObjectiveContainer && !this.objectiveOnly)) {
        this.allEntities.push(...figure.entities);
      }
    });

    if (!this.entities || this.entities.length) {
      this.entities = [];
      this.allEntities.forEach((entity) => this.entities.push(entity));
    }
    this.update();
  }

  update() {
    this.amHelper.updateAmDecks();
    this.amHelper.updateCurseBless();
    this.amHelper.updateEmpowerEnfeeble();
    this.campaignHelper.update();
    this.characterHelper.update();
    this.characterProgressHelper.update();
    this.conditionHelper.update();
    this.eventHelper.update();
    this.markerHelper.update();
    this.monsterHelper.update();
    this.objectiveHelper.update();
    this.shieldRetaliateHelper.update();
    this.specialActionsHelper.update();
    this.bb = this.figures.every((figure) => (!(figure instanceof Character) && !(figure instanceof Monster)) || figure.bb);
    // TODO: maybe also empower/enfeeble for multiple, like bless/curse
    this.empowerEnabled = !this.bb && !!this.figure && !!this.entity && !this.objectiveOnly && this.empowerChars.length > 0;
    this.enfeebleEnabled = !this.bb && !!this.figure && !!this.entity && !this.objectiveOnly && this.enfeebleChars.length > 0;
  }

  setFilter(filter: 'character' | 'monster' | 'allies' | 'enemies' | 'objectives' | undefined = undefined) {
    this.filter = filter;
    this.updateFigures();
  }

  figureForEntity(entity: Entity): Figure {
    if (!!this.figure) {
      return this.figure;
    }

    let result: Figure | undefined;
    if (entity instanceof Character) {
      result = entity;
    } else if (entity instanceof Summon) {
      result = this.figures.find((figure) => figure instanceof Character && figure.summons.includes(entity));
    } else if (entity instanceof MonsterEntity) {
      result = this.figures.find((figure) => figure instanceof Monster && figure.entities.includes(entity));
    } else if (entity instanceof ObjectiveEntity) {
      result = this.figures.find((figure) => figure instanceof ObjectiveContainer && figure.entities.includes(entity));
    }

    if (!result) {
      console.warn('No figure found for entity:', entity);
      return new Monster(new MonsterData());
    }
    return result;
  }

  toggleEntity(entity: Entity) {
    if (!this.entities.includes(entity)) {
      this.entities.push(entity);
    } else {
      this.entities.splice(this.entities.indexOf(entity), 1);
    }
  }

  toggleAll(select: boolean) {
    this.entities = [];
    if (select) {
      this.allEntities.forEach((entity) => this.entities.push(entity));
    }
  }

  before(info: string, ...values: (string | number | boolean)[]) {
    gameManager.entityManager.beforeEntities(this.entity, this.figure, this.entities, info, ...values);
  }

  close(): void {
    this.healthHelper.close();
    this.campaignHelper.close();
    this.characterHelper.close();
    this.characterProgressHelper.close();
    this.eventHelper.close();
    this.shieldRetaliateHelper.close();
    this.amHelper.close();
    this.markerHelper.close();
    this.objectiveHelper.close();
    this.conditionHelper.close();
    this.specialActionsHelper.close();
  }

  @HostListener('document:keydown', ['$event'])
  keyboardShortcuts(event: KeyboardEvent) {
    if (
      settingsManager.settings.keyboardShortcuts &&
      !event.altKey &&
      !event.metaKey &&
      (!window.document.activeElement ||
        (window.document.activeElement.tagName !== 'INPUT' &&
          window.document.activeElement.tagName !== 'SELECT' &&
          window.document.activeElement.tagName !== 'TEXTAREA'))
    ) {
      if (!this.entity || !(this.entity instanceof Character) || (this.entity instanceof Character && !this.entity.absent)) {
        if (!event.ctrlKey && !event.shiftKey && event.key === 'ArrowRight') {
          this.healthHelper.changeHealth(1);
          event.preventDefault();
          event.stopPropagation();
        } else if (!event.ctrlKey && !event.shiftKey && event.key === 'ArrowLeft') {
          this.healthHelper.changeHealth(-1);
          event.preventDefault();
          event.stopPropagation();
        } else if (!event.ctrlKey && !event.shiftKey && event.key === 'ArrowUp') {
          this.healthHelper.changeMaxHealth(1);
          event.preventDefault();
          event.stopPropagation();
        } else if (!event.ctrlKey && !event.shiftKey && event.key === 'ArrowDown') {
          this.healthHelper.changeMaxHealth(-1);
          event.preventDefault();
          event.stopPropagation();
        } else if (this.entity instanceof Character && !event.ctrlKey && event.key.toLowerCase() === 'x') {
          if (this.entity.experience + this.experience > 0) {
            this.experience += event.shiftKey ? -1 : 1;
          }
          event.preventDefault();
          event.stopPropagation();
        } else if (
          this.entity instanceof Character &&
          (!settingsManager.settings.lootDeck || (!settingsManager.settings.alwaysLootDeck && !gameManager.fhRules())) &&
          !settingsManager.settings.hideCharacterLoot &&
          !event.ctrlKey &&
          event.key.toLowerCase() === 'l'
        ) {
          if (this.entity.loot + this.loot > 0) {
            this.loot += event.shiftKey ? -1 : 1;
          }
          event.preventDefault();
          event.stopPropagation();
        } else if (!event.ctrlKey && event.key.toLowerCase() === 'b') {
          if (
            (!event.shiftKey &&
              (!!this.figure ? gameManager.attackModifierManager.countUpcomingCurses(this.isMonster) : 0) + this.curse < 10) ||
            (event.shiftKey && (this.curseMin < 0 || this.curseMin + this.curse > 0))
          ) {
            this.bless += event.shiftKey ? -1 : 1;
          }
          event.preventDefault();
          event.stopPropagation();
        } else if (!event.ctrlKey && event.key.toLowerCase() === 'c') {
          if (
            (!event.shiftKey && gameManager.attackModifierManager.countUpcomingBlesses() + this.bless < 10) ||
            (event.shiftKey && (this.blessMin < 0 || this.blessMin + this.bless > 0))
          ) {
            this.curse += event.shiftKey ? -1 : 1;
          }
          event.preventDefault();
          event.stopPropagation();
        } else if (!event.ctrlKey && !event.shiftKey && (event.key.toLowerCase() === 'k' || event.key.toLowerCase() === 'd')) {
          this.healthHelper.toggleDeadExhausted();
          event.preventDefault();
          event.stopPropagation();
        } else if (!event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 's') {
          if (this.entity instanceof Character) {
            ghsDialogClosingHelper(this.dialogRef);
            this.dialog.open(CharacterSheetDialog, {
              panelClass: ['dialog-invert'],
              data: { character: this.entity }
            });
            event.preventDefault();
            event.stopPropagation();
          }
        }
      }

      if (event.key.toLowerCase() === 'a' && this.entity instanceof Character) {
        this.characterHelper.toggleAbsent();
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }
}
