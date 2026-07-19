import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Directive, ElementRef, OnInit, inject, input } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { ConditionType, EntityCondition } from 'src/app/game/model/data/Condition';
import { Entity } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ActionComponent } from 'src/app/ui/figures/actions/action';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Directive({
  selector: '[conditionHighlight]'
})
export class ConditionHighlightAnimationDirective implements OnInit {
  private el = inject(ElementRef);
  private ghsManager = inject(GhsManager);

  readonly inputCondition = input.required<EntityCondition>({ alias: 'conditionHighlight' });
  get condition(): EntityCondition {
    return this.inputCondition();
  }

  constructor() {
    this.ghsManager.uiChangeEffect(() => {
      if (
        this.condition.highlight &&
        !this.condition.expired &&
        (!settingsManager.settings.applyConditions ||
          !settingsManager.settings.activeApplyConditions ||
          settingsManager.settings.activeApplyConditionsExcludes.includes(this.condition.name))
      ) {
        this.playAnimation();
      }
    });
  }

  ngOnInit(): void {
    this.playAnimation();
  }

  playAnimation() {
    this.el.nativeElement.classList.add('animation');
    setTimeout(
      () => {
        this.el.nativeElement.classList.remove('animation');
        if (
          this.condition.types.includes(ConditionType.turn) ||
          !settingsManager.settings.applyConditions ||
          !settingsManager.settings.activeApplyConditions ||
          settingsManager.settings.activeApplyConditionsExcludes.includes(this.condition.name)
        ) {
          this.condition.highlight = false;
          gameManager.stateManager.saveLocal();
        }
      },
      settingsManager.settings.animations ? 1100 * settingsManager.settings.animationSpeed : 0
    );
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, TrackUUIDPipe, ConditionHighlightAnimationDirective, PointerInputDirective, ActionComponent],
  selector: 'ghs-highlight-conditions',
  templateUrl: './highlight.html',
  styleUrls: ['./highlight.scss']
})
export class HighlightConditionsComponent implements OnInit {
  private ghsManager = inject(GhsManager);

  readonly inputEntity = input.required<Entity>({ alias: 'entity' });
  get entity(): Entity {
    return this.inputEntity();
  }

  readonly inputFigure = input.required<Figure>({ alias: 'figure' });
  get figure(): Figure {
    return this.inputFigure();
  }

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  ConditionType = ConditionType;
  highlightedConditions: EntityCondition[] = [];
  highlightedActions: Action[] = [];
  highlightedActionsPersistent: Action[] = [];

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.highlightedConditions = [...gameManager.entityManager.highlightedConditions(this.entity)];
    this.highlightedActions = [...this.entity.extraActions.filter((action) => action.type === ActionType.extra)];
    this.highlightedActionsPersistent = [...this.entity.extraActionsPersistent.filter((action) => action.type === ActionType.extra)];
  }

  applyCondition(entityCondition: EntityCondition, event: any, double: boolean = false) {
    event.stopPropagation();
    gameManager.stateManager.before(
      ...gameManager.entityManager.undoInfos(this.entity, this.figure, 'applyCondition'),
      entityCondition.name
    );
    gameManager.entityManager.applyCondition(this.entity, this.figure, entityCondition);
    if (double) {
      gameManager.entityManager.applyCondition(this.entity, this.figure, entityCondition);
    }

    console.log('applied');
    this.after();
  }

  declineApplyCondition(entityCondition: EntityCondition, event: any) {
    event.stopPropagation();
    gameManager.stateManager.before(
      ...gameManager.entityManager.undoInfos(this.entity, this.figure, 'declineApplyCondition'),
      entityCondition.name
    );
    gameManager.entityManager.declineApplyCondition(this.entity, this.figure, entityCondition);
    this.after();
  }

  changeAction(action: Action, accept: boolean, persistent: boolean) {
    if (action.type === ActionType.extra) {
      gameManager.entityManager.before(
        this.entity,
        this.figure,
        (persistent ? 'changeExtraActionsPersistent' : 'changeExtraActions') + (accept ? '.accept' : 'decline'),
        gameManager.actionsManager.extraActionLabel(action)
      );

      if (persistent) {
        this.entity.extraActionsPersistent = this.entity.extraActionsPersistent.filter(
          (other) => JSON.stringify(other) !== JSON.stringify(action)
        );
        if (accept && !!action.subActions) {
          this.entity.extraActionsPersistent.push(...action.subActions);
        }
      } else {
        this.entity.extraActions = this.entity.extraActions.filter((other) => JSON.stringify(other) !== JSON.stringify(action));
        if (accept && !!action.subActions) {
          this.entity.extraActions.push(...action.subActions);
        }
      }

      gameManager.stateManager.after();
    }
  }

  after() {
    gameManager.entityManager.checkHealth(this.entity, this.figure);
    if (
      this.figure instanceof Monster &&
      this.entity instanceof MonsterEntity &&
      this.entity.dead &&
      (this.entity.entityConditions.length === 0 ||
        this.entity.entityConditions.every(
          (entityCondition) =>
            !entityCondition.highlight ||
            (!entityCondition.types.includes(ConditionType.turn) && !entityCondition.types.includes(ConditionType.apply))
        ))
    ) {
      gameManager.triggerUiChange();
      setTimeout(
        () => {
          if (this.figure instanceof Monster && this.entity instanceof MonsterEntity) {
            gameManager.monsterManager.removeMonsterEntity(this.figure, this.entity);
            if (this.figure.entities.every((monsterEntity) => !gameManager.entityManager.isAlive(monsterEntity))) {
              if (this.figure.active) {
                gameManager.roundManager.toggleFigure(this.figure);
              }
            }
          }
          gameManager.stateManager.after();
        },
        settingsManager.settings.animations ? 1500 * settingsManager.settings.animationSpeed : 0
      );
    } else {
      gameManager.stateManager.after();
    }
  }
}
