import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { Subscription } from "rxjs";
import { InteractiveAction } from "src/app/game/businesslogic/ActionsManager";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { ObjectiveContainer } from "src/app/game/model/ObjectiveContainer";
import { ObjectiveEntity } from "src/app/game/model/ObjectiveEntity";
import { Action, ActionType, ActionValueType } from "src/app/game/model/data/Action";
import { Element, ElementState } from "src/app/game/model/data/Element";

@Component({
	standalone: false,
    selector: 'ghs-interactive-actions',
    templateUrl: './interactive-actions.html',
    styleUrls: ['./interactive-actions.scss']
})
export class InteractiveActionsComponent implements OnInit, OnDestroy {

    @Input() actions!: Action[];
    @Input() figure!: Monster | ObjectiveContainer;
    @Input() preIndex: string = "";
    @Input() interactiveActions: InteractiveAction[] = [];
    @Output() interactiveActionsChange = new EventEmitter<InteractiveAction[]>();


    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    ActionValueType = ActionValueType;

    interactiveActionEntities: (MonsterEntity | ObjectiveEntity)[] = [];
    chooseElementAction: InteractiveAction | undefined;
    chooseElementValues: string[] = [];

    ngOnInit() {
        this.update();
        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: () => {
                this.update();
            }
        });
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    update() {
        let change = this.interactiveActions.length > 0;
        this.interactiveActions = [];
        this.interactiveActionEntities = [];
        if (settingsManager.settings.interactiveAbilities && this.figure.active) {
            this.interactiveActions = gameManager.actionsManager.getAllInteractiveActions(this.figure, this.actions, this.preIndex);

            this.chooseElementAction = undefined;
            this.chooseElementValues = [];

            this.interactiveActionEntities = this.figure.entities.filter((entity) => gameManager.actionsManager.getInteractiveActions(entity, this.figure, this.actions, this.preIndex).length);

            if (this.figure instanceof Monster) {
                this.interactiveActionEntities = this.interactiveActionEntities.map((entity) => entity as MonsterEntity).sort(gameManager.monsterManager.sortEntities);
            }

            this.interactiveActionEntities = this.interactiveActionEntities.filter((entity, index) => settingsManager.settings.combineInteractiveAbilities || index == 0);
            change = true;
        }

        if (change) {
            setTimeout(() => {
                this.interactiveActionsChange.emit(this.interactiveActions);
            }, 1)
        }
    }

    applyInteractiveActions(event: MouseEvent | TouchEvent, selectElement: boolean = false) {
        if (!selectElement && this.chooseElementAction && gameManager.actionsManager.getValues(this.chooseElementAction.action).filter((value) => value == Element.wild).length != this.chooseElementValues.length) {
            this.chooseElementAction = undefined;
            this.chooseElementValues = [];
            return;
        } else {
            this.chooseElementAction = this.interactiveActions.find((interactiveAction) => interactiveAction.action.type == ActionType.element && gameManager.actionsManager.getValues(interactiveAction.action).indexOf(Element.wild) != -1);

            if (this.chooseElementAction) {
                const chooseElementCount = gameManager.actionsManager.getValues(this.chooseElementAction.action).filter((value) => value == Element.wild).length;
                if (chooseElementCount != this.chooseElementValues.length) {
                    if (this.chooseElementAction.action.valueType == ActionValueType.minus && this.wildToConsume().length == (chooseElementCount - this.chooseElementValues.length)) {
                        this.wildToConsume().forEach((value) => this.chooseElementValues.push(value));
                    } else if (this.chooseElementAction.action.valueType != ActionValueType.minus && this.wildToCreate().length == (chooseElementCount - this.chooseElementValues.length)) {
                        this.wildToConsume().forEach((value) => this.chooseElementValues.push(value));
                    } else {
                        return;
                    }
                }
            }
        }

        if (this.interactiveActionEntities.length || this.interactiveActionEntities.length) {
            let after = true;

            const interactiveActionsLabel = (settingsManager.settings.combineInteractiveAbilities ? this.interactiveActions : gameManager.actionsManager.getInteractiveActions(this.interactiveActionEntities[0], this.figure, this.actions, this.preIndex)).filter((interactiveAction) => this.interactiveActions.find((other) => other.index == interactiveAction.index)).map((interactiveAction) => {
                let type: ActionType | string = interactiveAction.action.type;
                let values = gameManager.actionsManager.getValues(interactiveAction.action);
                if (type == ActionType.element) {
                    if (interactiveAction.action.valueType == ActionValueType.minus) {
                        type = "elementConsume";
                        values = values.map((value) => '%game.element.consume.' + value + '%');
                        let toConsume: string[] = gameManager.actionsManager.getElementsToConsume(interactiveAction.action).map((value) => '%game.element.consume.' + value.type + '%');
                        let additionalValues: string[] = this.chooseElementValues.map((value) => '%game.element.consume.' + value + '%');
                        values = values.map((value) => {
                            if (value == Element.wild) {
                                return additionalValues.pop() || toConsume.pop();
                            }
                            toConsume.pop();
                            return value;
                        }).map((value) => value as string);
                    } else {
                        type = "elementInfuse";
                        values = values.map((value, index) => {
                            if (this.chooseElementValues[index]) {
                                return '%game.element.' + this.chooseElementValues[index] + '%';
                            }
                            return '%game.element.' + value + '%';
                        })
                    }
                }
                return settingsManager.getLabel('state.info.applyHighlightAction.' + type, [values.join(', ')]);
            }).join(', ');

            const entitiesLabel = this.interactiveActionEntities.map((entity) => entity instanceof MonsterEntity ? '%game.monsterType.' + entity.type + '.' + entity.number + '%' : entity.number).join(', ');

            gameManager.stateManager.before(this.interactiveActions.length ? 'applyInteractiveActions' : 'skipInteractiveActions', interactiveActionsLabel, entitiesLabel, this.figure instanceof Monster ? "data.monster." + this.figure.name : gameManager.objectiveManager.objectiveName(this.figure));
            this.interactiveActionEntities.forEach((entity) => {

                let interactiveActions = gameManager.actionsManager.getInteractiveActions(entity, this.figure, this.actions, this.preIndex).filter((interactiveAction) => this.interactiveActions.find((other) => other.index == interactiveAction.index));
                let interactiveAction = interactiveActions[0] || undefined;
                while (interactiveAction) {
                    gameManager.actionsManager.applyInteractiveAction(entity, this.figure, interactiveAction, this.chooseElementValues);
                    if (interactiveAction.action.type == ActionType.element) {
                        this.chooseElementValues = [];
                    }
                    interactiveActions = gameManager.actionsManager.getInteractiveActions(entity, this.figure, this.actions, this.preIndex).filter((interactiveAction) => this.interactiveActions.find((other) => other.index == interactiveAction.index));

                    if (interactiveActions.some((newInteractiveAction) => newInteractiveAction.index == interactiveAction.index)) {
                        console.warn("Interactive Action already processed, should not happen", interactiveAction);
                        break;
                    }

                    interactiveAction = interactiveActions[0] || undefined;
                }

                const disabledInteractiveActions = gameManager.actionsManager.getInteractiveActions(entity, this.figure, this.actions, this.preIndex).filter((interactiveAction) => !this.interactiveActions.find((other) => other.index == interactiveAction.index));
                disabledInteractiveActions.forEach((interactiveAction) => {
                    const tag = gameManager.actionsManager.roundTag(interactiveAction.action, interactiveAction.index);
                    if (entity.tags.indexOf(tag) == -1) {
                        entity.tags.push(tag);
                    }
                })
            })

            if (this.interactiveActionEntities.some((entity) => entity.dead)) {
                after = false;
                gameManager.uiChange.emit();
                setTimeout(() => {
                    this.interactiveActionEntities.forEach((entity) => {
                        if (entity.dead) {
                            if (this.figure instanceof Monster && entity instanceof MonsterEntity) {
                                gameManager.monsterManager.removeMonsterEntity(this.figure, entity);
                            } else if (this.figure instanceof ObjectiveContainer && entity instanceof ObjectiveEntity) {
                                gameManager.objectiveManager.removeObjectiveEntity(this.figure, entity);
                            }
                            if (this.figure.entities.every((entity) => entity.dead || entity.health <= 0 || !entity.active)) {
                                this.figure.off = true;
                                if (this.figure.active) {
                                    gameManager.roundManager.toggleFigure(this.figure);
                                }
                            }
                        }
                    })
                    this.update();
                    gameManager.stateManager.after();
                }, !settingsManager.settings.animations ? 0 : 1500)
            }

            if (after) {
                this.update();
                gameManager.stateManager.after();
            }
            event.preventDefault();
            event.stopPropagation();
        }
    }

    wildToConsume(): Element[] {
        return gameManager.game.elementBoard.filter((element) => element.state != ElementState.inert && element.state != ElementState.new && element.state != ElementState.consumed && this.chooseElementValues.indexOf(element.type) == -1 && (!this.chooseElementAction || gameManager.actionsManager.getValues(this.chooseElementAction.action).indexOf(element.type) == -1) && !this.interactiveActions.find((interactiveAction) => interactiveAction.action.type == ActionType.element && interactiveAction.action.valueType == ActionValueType.minus && interactiveAction.action.value == element.type)).map((element) => element.type);
    }

    wildToCreate(): Element[] {
        return gameManager.game.elementBoard.filter((element) => element.state != ElementState.new && element.state != ElementState.strong && element.state != ElementState.always && this.chooseElementValues.indexOf(element.type) == -1 && (!this.chooseElementAction || gameManager.actionsManager.getValues(this.chooseElementAction.action).indexOf(element.type) == -1)).map((element) => element.type);
    }

    selectWildElement(event: MouseEvent | TouchEvent, element: Element) {
        this.chooseElementValues.push(element);
        this.applyInteractiveActions(event, true);
        event.preventDefault();
        event.stopPropagation();
    }

    onInteractiveActionsChange(change: InteractiveAction[]) {
        this.interactiveActionsChange.emit(change);
    }
}