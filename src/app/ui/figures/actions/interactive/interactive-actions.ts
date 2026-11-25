import { NgClass } from '@angular/common';
import { Component, OnInit, inject, input, model } from '@angular/core';
import { InteractiveAction } from 'src/app/game/businesslogic/ActionsManager';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, labelManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { Element } from 'src/app/game/model/data/Element';
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
  toggledOffActions: InteractiveAction[] = [];

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit() {
    this.update();
  }

  update() {
    this.chooseElementAction = undefined;
    this.chooseElementValues = [];
    this.interactiveActionEntities = gameManager.actionsManager.interactiveEntities(this.figure, this.actions, this.preIndex());
    const defaults = gameManager.actionsManager.defaultInteractiveActions(
      this.interactiveActionEntities,
      gameManager.actionsManager.interactiveActionsOf(this.interactiveActionEntities, this.figure, this.actions, this.preIndex())
    );
    this.interactiveActions.set(defaults.selected);
    this.toggledOffActions = defaults.toggledOff;
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
          return labelManager.getLabel('state.info.applyHighlightAction.' + type, [values.join(', ')]);
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
      gameManager.actionsManager.applyInteractiveActions(
        this.figure,
        this.interactiveActionEntities,
        this.actions,
        this.preIndex(),
        this.chooseElementValues,
        this.interactiveActions(),
        this.toggledOffActions
      );

      this.update();
      gameManager.stateManager.after();
      event.preventDefault();
      event.stopPropagation();
    }
  }

  wildToConsume(): Element[] {
    return gameManager.actionsManager.wildElementsToConsume(this.chooseElementValues, this.chooseElementAction, this.interactiveActions());
  }

  wildToCreate(): Element[] {
    return gameManager.actionsManager.wildElementsToCreate(this.chooseElementValues, this.chooseElementAction);
  }

  selectWildElement(event: PointerEvent, element: Element) {
    this.chooseElementValues.push(element);
    this.applyInteractiveActions(event, true);
    event.preventDefault();
    event.stopPropagation();
  }
}
