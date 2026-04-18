import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { InteractiveAction } from 'src/app/game/businesslogic/ActionsManager';
import { CharacterManager } from 'src/app/game/businesslogic/CharacterManager';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { ConditionType, EntityCondition, EntityConditionState } from 'src/app/game/model/data/Condition';
import { ObjectiveData } from 'src/app/game/model/data/ObjectiveData';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { GameState } from 'src/app/game/model/Game';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { ActionComponent } from 'src/app/ui/figures/actions/action';
import { ActionsComponent } from 'src/app/ui/figures/actions/actions';
import { InteractiveActionsComponent } from 'src/app/ui/figures/actions/interactive/interactive-actions';
import { CharacterInitiativeComponent } from 'src/app/ui/figures/character/cards/initiative';
import { CharacterInitiativeDialogComponent } from 'src/app/ui/figures/character/cards/initiative-dialog';
import { HighlightConditionsComponent } from 'src/app/ui/figures/conditions/highlight';
import { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { EntityIndexKeyComponent } from 'src/app/ui/figures/standee/entity-index-key/entity-index-key';
import { StandeeComponent } from 'src/app/ui/figures/standee/standee';
import { EntityAnimationDirective } from 'src/app/ui/helper/EntityAnimation';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsMinZeroPipe, GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsDefaultDialogPositions, ghsValueSign } from 'src/app/ui/helper/Static';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';
import { ValueSignDirective } from 'src/app/ui/helper/ValueSign';

@Component({
  imports: [
    NgClass,
    GhsLabelDirective,
    PointerInputDirective,
    ValueSignDirective,
    EntityAnimationDirective,
    GhsMinZeroPipe,
    GhsRangePipe,
    TrackUUIDPipe,
    ActionComponent,
    ActionsComponent,
    CharacterInitiativeComponent,
    EntityIndexKeyComponent,
    HighlightConditionsComponent,
    InteractiveActionsComponent,
    StandeeComponent
  ],
  selector: 'ghs-objective-container',
  templateUrl: './objective-container.html',
  styleUrls: ['./objective-container.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ObjectiveContainerComponent implements OnInit {
  private dialog = inject(Dialog);
  private overlay = inject(Overlay);
  private elementRef = inject(ElementRef);
  private ghsManager = inject(GhsManager);
  private cdr = inject(ChangeDetectorRef);

  @Input() objective!: ObjectiveContainer;

  @ViewChild('objectiveTitle', { static: false }) titleInput!: ElementRef;

  characterManager: CharacterManager = gameManager.characterManager;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  ConditionType = ConditionType;
  objectiveData: ObjectiveData | undefined;
  entity: ObjectiveEntity | undefined;
  activeConditions: EntityCondition[] = [];
  initiative: number = -1;
  health: number = 0;
  marker: string = '';
  compact: boolean = false;
  short: boolean = false;
  shortMenu: boolean = false;

  nonDead: number = 0;

  interactiveActions: InteractiveAction[] = [];
  interactiveActionsChange = new EventEmitter<InteractiveAction[]>();

  EntityConditionState = EntityConditionState;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.nonDead = this.objective.entities.filter((entity) => gameManager.entityManager.isAlive(entity)).length;
    this.activeConditions = [];
    this.entity = undefined;
    this.marker = '';
    if (this.nonDead == 1) {
      this.entity = this.objective.entities.find((entity) => gameManager.entityManager.isAlive(entity));
      if (this.entity) {
        this.activeConditions = gameManager.entityManager.activeConditions(this.entity);
        this.entity.immunities.forEach((immunity) => {
          if (!this.activeConditions.find((entityCondition) => entityCondition.name == immunity)) {
            this.activeConditions.push(new EntityCondition(immunity));
          }
        });
      }
    } else if (this.objective.entities.flatMap((entity) => entity.marker).every((marker, index, self) => self.indexOf(marker) == 0)) {
      this.marker = this.objective.entities.flatMap((entity) => entity.marker)[0];
    }

    if (this.objective.objectiveId) {
      this.objectiveData = gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(this.objective.objectiveId);
    }

    this.compact = settingsManager.settings.characterCompact && settingsManager.settings.theme != 'modern';
    this.short = (!settingsManager.settings.abilities || !settingsManager.settings.stats) && settingsManager.settings.theme != 'modern';
  }

  toggleFigure(event: any): void {
    if (gameManager.game.state == GameState.draw || (settingsManager.settings.initiativeRequired && this.objective.initiative <= 0)) {
      this.openInitiativeDialog(event);
    } else {
      gameManager.stateManager.before(
        this.objective.active ? 'unsetActive' : 'setActive',
        gameManager.objectiveManager.objectiveName(this.objective)
      );
      gameManager.roundManager.toggleFigure(this.objective);
      gameManager.stateManager.after();
    }
  }

  openInitiativeDialog(event: any) {
    this.dialog.open(CharacterInitiativeDialogComponent, {
      panelClass: ['dialog'],
      data: this.objective,
      positionStrategy: this.overlay.position().flexibleConnectedTo(event.target).withPositions(ghsDefaultDialogPositions())
    });
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

    this.initiative = value;
    this.cdr.markForCheck();
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

    if (this.objective.initiative != this.initiative) {
      this.objective.initiative = this.initiative;
      gameManager.entityManager.before(undefined, this.objective, 'setInitiative', value);
      this.objective.initiative = value;
      this.initiative = -1;
      if (gameManager.game.state == GameState.next) {
        gameManager.sortFigures(this.objective);
      }
      gameManager.stateManager.after();
    }
  }

  dragHpMove(value: number) {
    this.health = value;
    if (
      (!this.objectiveData || !this.objectiveData.trackDamage) &&
      this.entity &&
      this.entity.health + this.health > EntityValueFunction(this.entity.maxHealth)
    ) {
      this.health = EntityValueFunction(this.entity.maxHealth) - this.entity.health;
    }
  }

  dragHpEnd() {
    if (this.health != 0 && this.entity) {
      gameManager.entityManager.before(this.entity, this.objective, 'changeHP', ghsValueSign(this.health));
      gameManager.entityManager.changeHealth(this.entity, this.objective, this.health);
      if (this.entity.health <= 0 && this.entity.maxHealth > 0) {
        gameManager.objectiveManager.removeObjective(this.objective);
      }
      this.health = 0;
      gameManager.stateManager.after();
    }
  }

  dragHpCancel() {
    this.health = 0;
  }

  openEntityMenu(): void {
    this.dialog.open(EntitiesMenuDialogComponent, {
      panelClass: ['dialog'],
      data: {
        entity: this.entity,
        figure: this.objective,
        objectiveOnly: !this.entity,
        positionElement: this.elementRef.nativeElement.querySelector('.image-container')
      },
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.elementRef.nativeElement.querySelector('.image-container'))
        .withPositions(ghsDefaultDialogPositions())
    });
  }

  toggleDamageHP() {
    settingsManager.toggle('damageHP');
  }

  openEntitiesMenu(event: any) {
    this.dialog.open(EntitiesMenuDialogComponent, {
      panelClass: ['dialog'],
      data: {
        figure: this.objective
      },
      positionStrategy: this.overlay.position().flexibleConnectedTo(event.target).withPositions(ghsDefaultDialogPositions())
    });
  }

  addEntity() {
    const objectiveCount = this.objective.entities.filter((entity) => gameManager.entityManager.isAlive(entity)).length;
    let number = objectiveCount % 12;
    if (this.objective.entities.find((objectiveEntity) => objectiveEntity.number == number)) {
      number = objectiveCount % 12;
      if (objectiveCount < 12) {
        while (this.objective.entities.find((objectiveEntity) => objectiveEntity.number - 1 == number)) {
          number++;
        }
      }
    }

    let name = this.objective.name;
    if (!name) {
      name = this.objective.title;
      if (!name) {
        name = this.objective.escort ? '%escort%' : '%objective%';
      }
    }

    gameManager.stateManager.before('addObjective.entity', number + 1, name);
    gameManager.objectiveManager.addObjectiveEntity(this.objective, number);
    gameManager.stateManager.after();
  }

  removeCondition(entityCondition: EntityCondition) {
    if (this.entity) {
      gameManager.entityManager.before(this.entity, this.objective, 'removeCondition', entityCondition.name);
      if (entityCondition.types.indexOf(ConditionType.stackable) && entityCondition.value > 1) {
        entityCondition.value--;
      } else {
        gameManager.entityManager.removeCondition(this.entity, this.objective, entityCondition, entityCondition.permanent);
      }
      gameManager.stateManager.after();
    }
  }

  removeMarker(marker: string) {
    if (this.entity) {
      const edition = marker.split('-')[0];
      const name = marker.split('-').slice(1).join('-');
      gameManager.entityManager.before(this.entity, this.objective, 'removeCharacterMarker', marker, edition + '.' + name);
      this.entity.markers = this.entity.markers.filter((value) => value != marker);
      gameManager.stateManager.after();
    }
  }

  onInteractiveActionsChange(change: InteractiveAction[]) {
    this.interactiveActionsChange.emit(change);
    this.interactiveActions = change;
  }

  removeShield() {
    if (this.entity) {
      gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.objective, 'removeEntityShield'));
      this.entity.shield = undefined;
      gameManager.stateManager.after();
    }
  }

  removeShieldPersistent() {
    if (this.entity) {
      gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.objective, 'removeEntityShieldPersistent'));
      this.entity.shieldPersistent = undefined;
      gameManager.stateManager.after();
    }
  }

  removeRetaliate(index: number) {
    if (this.entity) {
      const retaliate: Action[] = JSON.parse(JSON.stringify(this.entity.retaliate));
      retaliate.splice(index, 1);
      if (retaliate.length > 0) {
        gameManager.stateManager.before(
          ...gameManager.entityManager.undoInfos(this.entity, this.objective, 'setEntityRetaliate'),
          retaliate
            .map(
              (action) =>
                '%game.action.retaliate% ' +
                EntityValueFunction(action.value) +
                (action.subActions &&
                action.subActions[0] &&
                action.subActions[0].type == ActionType.range &&
                EntityValueFunction(action.subActions[0].value) > 1
                  ? ' %game.action.range% ' + EntityValueFunction(action.subActions[0].value) + ''
                  : '')
            )
            .join(', ')
        );
      } else {
        gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.objective, 'removeEntityRetaliate'));
      }
      this.entity.retaliate = retaliate;
      gameManager.stateManager.after();
    }
  }

  removeRetaliatePersistent(index: number) {
    if (this.entity) {
      const retaliatePersistent: Action[] = JSON.parse(JSON.stringify(this.entity.retaliatePersistent));
      retaliatePersistent.splice(index, 1);
      if (retaliatePersistent.length > 0) {
        gameManager.stateManager.before(
          ...gameManager.entityManager.undoInfos(this.entity, this.objective, 'setEntityRetaliatePersistent'),
          retaliatePersistent
            .map(
              (action) =>
                '%game.action.retaliate% ' +
                EntityValueFunction(action.value) +
                (action.subActions &&
                action.subActions[0] &&
                action.subActions[0].type == ActionType.range &&
                EntityValueFunction(action.subActions[0].value) > 1
                  ? ' %game.action.range% ' + EntityValueFunction(action.subActions[0].value) + ''
                  : '')
            )
            .join(', ')
        );
      } else {
        gameManager.stateManager.before(
          ...gameManager.entityManager.undoInfos(this.entity, this.objective, 'removeEntityRetaliatePersistent')
        );
      }
      this.entity.retaliatePersistent = retaliatePersistent;
      gameManager.stateManager.after();
    }
  }
}
