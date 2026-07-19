import { NgClass } from '@angular/common';
import { Component, OnInit, inject, input, model } from '@angular/core';
import { InteractiveAction } from 'src/app/game/businesslogic/ActionsManager';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { Condition, ConditionName } from 'src/app/game/model/data/Condition';
import { Element, ElementState } from 'src/app/game/model/data/Element';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [GhsLabelDirective, NgClass, PointerInputDirective, TrackUUIDPipe],
  selector: 'ghs-interactive-actions',
  templateUrl: './interactive-actions.html',
  styleUrls: ['./interactive-actions.scss']
})
export class InteractiveActionsComponent implements OnInit {
  private ghsManager = inject(GhsManager);

  readonly inputActions = input<Action[]>([], { alias: 'actions' });
  get actions(): Action[] {
    return this.inputActions();
  }

  readonly inputFigure = input.required<Monster | ObjectiveContainer>({ alias: 'figure' });
  get figure(): Monster | ObjectiveContainer {
    return this.inputFigure();
  }

  readonly preIndex = input<string>('');
  interactiveActions = model<InteractiveAction[]>([]);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  ActionValueType = ActionValueType;

  interactiveActionEntities: (MonsterEntity | ObjectiveEntity)[] = [];
  chooseElementAction: InteractiveAction | undefined;
  chooseElementValues: string[] = [];
  ignoreWarning: boolean = false;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit() {
    this.update();
  }

  update() {
    if (settingsManager.settings.interactiveAbilities && this.figure.active) {
      this.chooseElementAction = undefined;
      this.chooseElementValues = [];

      this.interactiveActionEntities = this.figure.entities.filter(
        (entity) => gameManager.actionsManager.getInteractiveActions(entity, this.figure, this.actions, this.preIndex()).length
      );

      if (this.figure instanceof Monster) {
        this.interactiveActionEntities = this.interactiveActionEntities
          .map((entity) => entity as MonsterEntity)
          .sort(gameManager.monsterManager.sortEntities);
      }

      this.interactiveActionEntities = this.interactiveActionEntities.filter(
        (entity, index) => settingsManager.settings.combineInteractiveAbilities || index === 0
      );

      this.interactiveActions.set(gameManager.actionsManager.getAllInteractiveActions(this.figure, this.actions, this.preIndex()));
      this.ignoreWarning = false;
    } else {
      this.interactiveActionEntities = [];
      this.interactiveActions.set([]);
    }
  }

  checkWarning(): boolean {
    // Ward or brittle could change whether monsters survive damage.
    // Warn if that's the case.
    const wardEnabled =
      settingsManager.settings.applyConditions &&
      settingsManager.settings.activeApplyConditions &&
      settingsManager.settings.activeApplyConditionsAuto.includes(ConditionName.ward) &&
      !settingsManager.settings.activeApplyConditionsExcludes.includes(ConditionName.ward);
    const brittleEnabled =
      settingsManager.settings.applyConditions &&
      settingsManager.settings.activeApplyConditions &&
      settingsManager.settings.activeApplyConditionsAuto.includes(ConditionName.brittle) &&
      !settingsManager.settings.activeApplyConditionsExcludes.includes(ConditionName.brittle);
    return (
      !(wardEnabled && brittleEnabled) &&
      this.interactiveActions()
        .filter((action) => action.action.type === ActionType.sufferDamage)
        .some((action) => {
          const damage = EntityValueFunction(action.action.value);
          const result = (ward: boolean, brittle: boolean) => Math.floor((damage * (brittle ? 2 : 1)) / (ward ? 2 : 1));
          return this.interactiveActionEntities.some((entity) => {
            const ward = gameManager.entityManager.hasCondition(entity, new Condition(ConditionName.ward));
            const brittle = gameManager.entityManager.hasCondition(entity, new Condition(ConditionName.brittle));
            const shouldDie = entity.health - result(ward, brittle) <= 0;
            const wouldDie = entity.health - result(ward && wardEnabled, brittle && brittleEnabled) <= 0;
            return shouldDie != wouldDie;
          });
        })
    );
  }

  applyInteractiveActions(event: PointerEvent, selectElement: boolean = false) {
    if (
      !selectElement &&
      this.chooseElementAction &&
      gameManager.actionsManager.getValues(this.chooseElementAction.action).filter((value) => value === Element.wild).length !=
        this.chooseElementValues.length
    ) {
      this.chooseElementAction = undefined;
      this.chooseElementValues = [];
      return;
    } else {
      this.chooseElementAction = this.interactiveActions().find(
        (interactiveAction) =>
          interactiveAction.action.type === ActionType.element &&
          gameManager.actionsManager.getValues(interactiveAction.action).includes(Element.wild)
      );

      if (this.chooseElementAction) {
        const chooseElementCount = gameManager.actionsManager
          .getValues(this.chooseElementAction.action)
          .filter((value) => value === Element.wild).length;
        if (chooseElementCount !== this.chooseElementValues.length) {
          if (
            this.chooseElementAction.action.valueType === ActionValueType.minus &&
            this.wildToConsume().length === chooseElementCount - this.chooseElementValues.length
          ) {
            this.wildToConsume().forEach((value) => this.chooseElementValues.push(value));
          } else if (
            this.chooseElementAction.action.valueType !== ActionValueType.minus &&
            this.wildToCreate().length === chooseElementCount - this.chooseElementValues.length
          ) {
            this.wildToConsume().forEach((value) => this.chooseElementValues.push(value));
          } else {
            return;
          }
        }
      }
    }

    if (!this.ignoreWarning && this.checkWarning()) {
      this.ignoreWarning = true;
      return;
    }

    if (this.interactiveActionEntities.length) {
      const interactiveActionsLabel = (
        settingsManager.settings.combineInteractiveAbilities
          ? this.interactiveActions()
          : gameManager.actionsManager.getInteractiveActions(this.interactiveActionEntities[0], this.figure, this.actions, this.preIndex())
      )
        .filter((interactiveAction) => this.interactiveActions().find((other) => other.index === interactiveAction.index))
        .map((interactiveAction) => {
          let type: ActionType | string = interactiveAction.action.type;
          let values = gameManager.actionsManager.getValues(interactiveAction.action);
          if (type === ActionType.element) {
            if (interactiveAction.action.valueType === ActionValueType.minus) {
              type = 'elementConsume';
              values = values.map((value) => '%game.element.consume.' + value + '%');
              const toConsume: string[] = gameManager.actionsManager
                .getElementsToConsume(interactiveAction.action)
                .map((value) => '%game.element.consume.' + value.type + '%');
              const additionalValues: string[] = this.chooseElementValues.map((value) => '%game.element.consume.' + value + '%');
              values = values
                .map((value) => {
                  if (value === Element.wild) {
                    return additionalValues.pop() || toConsume.pop();
                  }
                  toConsume.pop();
                  return value;
                })
                .map((value) => value as string);
            } else {
              type = 'elementInfuse';
              values = values.map((value, index) => {
                if (this.chooseElementValues[index]) {
                  return '%game.element.' + this.chooseElementValues[index] + '%';
                }
                return '%game.element.' + value + '%';
              });
            }
          }
          return settingsManager.getLabel('state.info.applyHighlightAction.' + type, [values.join(', ')]);
        })
        .join(', ');

      const entitiesLabel = this.interactiveActionEntities
        .map((entity) => (entity instanceof MonsterEntity ? '%game.monsterType.' + entity.type + '.' + entity.number + '%' : entity.number))
        .join(', ');

      gameManager.stateManager.before(
        this.interactiveActions().length ? 'applyInteractiveActions' : 'skipInteractiveActions',
        interactiveActionsLabel,
        entitiesLabel,
        this.figure instanceof Monster ? 'data.monster.' + this.figure.name : gameManager.objectiveManager.objectiveName(this.figure)
      );
      this.interactiveActionEntities.forEach((entity) => {
        let interactiveActions = gameManager.actionsManager
          .getInteractiveActions(entity, this.figure, this.actions, this.preIndex())
          .filter((interactiveAction) => this.interactiveActions().find((other) => other.index === interactiveAction.index));
        let interactiveAction = interactiveActions[0] || undefined;
        while (interactiveAction) {
          gameManager.actionsManager.applyInteractiveAction(entity, this.figure, interactiveAction, this.chooseElementValues);
          if (interactiveAction.action.type === ActionType.element) {
            this.chooseElementValues = [];
          }
          interactiveActions = gameManager.actionsManager
            .getInteractiveActions(entity, this.figure, this.actions, this.preIndex())
            .filter((interactiveAction) => this.interactiveActions().find((other) => other.index === interactiveAction.index));

          if (interactiveActions.some((newInteractiveAction) => newInteractiveAction.index === interactiveAction.index)) {
            console.warn('Interactive Action already processed, should not happen', interactiveAction);
            break;
          }

          interactiveAction = interactiveActions[0] || undefined;
        }

        const disabledInteractiveActions = gameManager.actionsManager
          .getInteractiveActions(entity, this.figure, this.actions, this.preIndex())
          .filter((interactiveAction) => !this.interactiveActions().find((other) => other.index === interactiveAction.index));
        disabledInteractiveActions.forEach((interactiveAction) => {
          const tag = gameManager.actionsManager.roundTag(interactiveAction.action, interactiveAction.index);
          if (!entity.tags.includes(tag)) {
            entity.tags.push(tag);
          }
        });
      });

      this.update();
      gameManager.stateManager.after();
      event.preventDefault();
      event.stopPropagation();
    }
  }

  wildToConsume(): Element[] {
    return gameManager.game.elementBoard
      .filter(
        (element) =>
          element.state !== ElementState.inert &&
          element.state !== ElementState.new &&
          element.state !== ElementState.consumed &&
          !this.chooseElementValues.includes(element.type) &&
          (!this.chooseElementAction || !gameManager.actionsManager.getValues(this.chooseElementAction.action).includes(element.type)) &&
          !this.interactiveActions().find(
            (interactiveAction) =>
              interactiveAction.action.type === ActionType.element &&
              interactiveAction.action.valueType === ActionValueType.minus &&
              interactiveAction.action.value === element.type
          )
      )
      .map((element) => element.type);
  }

  wildToCreate(): Element[] {
    return gameManager.game.elementBoard
      .filter(
        (element) =>
          element.state !== ElementState.new &&
          element.state !== ElementState.strong &&
          element.state !== ElementState.always &&
          !this.chooseElementValues.includes(element.type) &&
          (!this.chooseElementAction || !gameManager.actionsManager.getValues(this.chooseElementAction.action).includes(element.type))
      )
      .map((element) => element.type);
  }

  selectWildElement(event: PointerEvent, element: Element) {
    this.chooseElementValues.push(element);
    this.applyInteractiveActions(event, true);
    event.preventDefault();
    event.stopPropagation();
  }
}
