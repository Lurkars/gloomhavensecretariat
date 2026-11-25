import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionHint, ActionSpecialTarget, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { Condition, ConditionName, ConditionType, EntityCondition } from 'src/app/game/model/data/Condition';
import { Element, ElementModel, ElementState } from 'src/app/game/model/data/Element';
import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { MonsterSpawnData, ObjectiveSpawnData } from 'src/app/game/model/data/ScenarioRule';
import { Entity, EntityValueFunction } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { Summon } from 'src/app/game/model/Summon';

export type InteractiveAction = { action: Action; index: string };

export class ActionsManager {
  getValues(action: Action): string[] {
    if (action.value && typeof action.value === 'string') {
      return action.value.split(':');
    }
    return [];
  }

  calcActionHints(figure: Figure, entity: Entity): ActionHint[] {
    const actionHints: ActionHint[] = [];

    if (figure instanceof Monster && entity instanceof MonsterEntity) {
      actionHints.push(...this.calcMonsterActionHints(figure, entity));
    }

    if (entity instanceof Summon) {
      if (entity.action && entity.action.type === ActionType.shield) {
        const existingShield = actionHints.find((actionHint) => actionHint.type === ActionType.shield);
        if (existingShield) {
          existingShield.value += EntityValueFunction(entity.action.value);
        } else {
          actionHints.push(new ActionHint(ActionType.shield, EntityValueFunction(entity.action.value)));
        }
      }
      if (entity.additionalAction && entity.additionalAction.type === ActionType.shield) {
        const existingShield = actionHints.find((actionHint) => actionHint.type === ActionType.shield);
        if (existingShield) {
          existingShield.value += EntityValueFunction(entity.additionalAction.value);
        } else {
          actionHints.push(new ActionHint(ActionType.shield, EntityValueFunction(entity.additionalAction.value)));
        }
      }
      if (entity.action && entity.action.type === ActionType.retaliate) {
        const rangeSubAction =
          entity.action.subActions && entity.action.subActions.find((subAction) => subAction.type === ActionType.range);
        const existingRetaliate = actionHints.find((actionHint) => {
          if (!rangeSubAction || (EntityValueFunction(rangeSubAction.value) === 1 && (!actionHint.range || actionHint.range === 1))) {
            return actionHint.type === ActionType.retaliate;
          } else {
            return actionHint.type === ActionType.retaliate && actionHint.range === EntityValueFunction(rangeSubAction.value);
          }
        });
        if (existingRetaliate) {
          existingRetaliate.value += EntityValueFunction(entity.action.value);
        } else {
          actionHints.push(
            new ActionHint(
              ActionType.retaliate,
              EntityValueFunction(entity.action.value),
              rangeSubAction ? EntityValueFunction(rangeSubAction.value) : 0
            )
          );
        }
      }
      if (entity.additionalAction && entity.additionalAction.type === ActionType.retaliate) {
        const rangeSubAction =
          entity.additionalAction.subActions && entity.additionalAction.subActions.find((subAction) => subAction.type === ActionType.range);
        const existingRetaliate = actionHints.find((actionHint) => {
          if (!rangeSubAction || (EntityValueFunction(rangeSubAction.value) === 1 && (!actionHint.range || actionHint.range === 1))) {
            return actionHint.type === ActionType.retaliate;
          } else {
            return actionHint.type === ActionType.retaliate && actionHint.range === EntityValueFunction(rangeSubAction.value);
          }
        });
        if (existingRetaliate) {
          existingRetaliate.value += EntityValueFunction(entity.additionalAction.value);
        } else {
          actionHints.push(
            new ActionHint(
              ActionType.retaliate,
              EntityValueFunction(entity.additionalAction.value),
              rangeSubAction ? EntityValueFunction(rangeSubAction.value) : 0
            )
          );
        }
      }
    }

    entity.extraActions.forEach((action) => {
      if (action.type === ActionType.shield) {
        const existingShield = actionHints.find((actionHint) => actionHint.type === ActionType.shield);
        const actionValue =
          action.valueType === ActionValueType.minus ? -EntityValueFunction(action.value) : EntityValueFunction(action.value);
        if (existingShield) {
          existingShield.value += actionValue;
        } else {
          actionHints.push(new ActionHint(ActionType.shield, actionValue));
        }
      } else if (action.type === ActionType.retaliate) {
        const rangeSubAction = action.subActions.find((subAction) => subAction.type === ActionType.range);
        const existingRetaliate = actionHints.find((actionHint) => {
          if (!rangeSubAction || (EntityValueFunction(rangeSubAction.value) === 1 && (!actionHint.range || actionHint.range === 1))) {
            return actionHint.type === ActionType.retaliate;
          } else {
            return actionHint.type === ActionType.retaliate && actionHint.range === EntityValueFunction(rangeSubAction.value);
          }
        });
        const actionValue =
          action.valueType === ActionValueType.minus ? -EntityValueFunction(action.value) : EntityValueFunction(action.value);
        if (existingRetaliate) {
          existingRetaliate.value += actionValue;
        } else {
          actionHints.push(
            new ActionHint(ActionType.retaliate, actionValue, rangeSubAction ? EntityValueFunction(rangeSubAction.value) : 0)
          );
        }
      }
    });

    entity.extraActionsPersistent.forEach((action) => {
      if (action.type === ActionType.shield) {
        const existingShield = actionHints.find((actionHint) => actionHint.type === ActionType.shield);
        const actionValue =
          action.valueType === ActionValueType.minus ? -EntityValueFunction(action.value) : EntityValueFunction(action.value);
        if (existingShield) {
          existingShield.value += actionValue;
        } else {
          actionHints.push(new ActionHint(ActionType.shield, actionValue));
        }
      } else if (action.type === ActionType.retaliate) {
        const rangeSubAction = action.subActions.find((subAction) => subAction.type === ActionType.range);
        const existingRetaliate = actionHints.find((actionHint) => {
          if (!rangeSubAction || (EntityValueFunction(rangeSubAction.value) === 1 && (!actionHint.range || actionHint.range === 1))) {
            return actionHint.type === ActionType.retaliate;
          } else {
            return actionHint.type === ActionType.retaliate && actionHint.range === EntityValueFunction(rangeSubAction.value);
          }
        });
        const actionValue =
          action.valueType === ActionValueType.minus ? -EntityValueFunction(action.value) : EntityValueFunction(action.value);
        if (existingRetaliate) {
          existingRetaliate.value += actionValue;
        } else {
          actionHints.push(
            new ActionHint(ActionType.retaliate, actionValue, rangeSubAction ? EntityValueFunction(rangeSubAction.value) : 0)
          );
        }
      }
    });

    return actionHints.sort((a, b) => {
      if (a.type === ActionType.shield && b.type !== ActionType.shield) {
        return -1;
      } else if (b.type === ActionType.shield && a.type !== ActionType.shield) {
        return 1;
      }
      return a.range - b.range;
    });
  }

  calcMonsterActionHints(monster: Monster, entity: MonsterEntity): ActionHint[] {
    const actionHints: ActionHint[] = [];
    const stat = gameManager.monsterManager.getStat(monster, entity.type);
    this.calcMonsterActionHint(monster, entity.type, ActionType.shield, stat.actions, actionHints);
    this.calcMonsterActionHint(monster, entity.type, ActionType.retaliate, stat.actions, actionHints);
    if (gameManager.entityManager.isAlive(entity, true) && (!entity.active || monster.active)) {
      const activeFigure = gameManager.game.figures.find((figure) => figure.active);
      if (
        monster.active ||
        (gameManager.game.state === GameState.next &&
          (!activeFigure || gameManager.game.figures.indexOf(activeFigure) > gameManager.game.figures.indexOf(monster)))
      ) {
        let abilityCard = gameManager.monsterAbilityManager.getAbilityCard(monster);
        if (gameManager.monsterAbilityManager.hasBottomActions(monster) && monster.firstActiveAction) {
          const secondAbilityCard = abilityCard;
          abilityCard = gameManager.monsterAbilityManager.getAbilityCard(monster, true);
          if (abilityCard) {
            this.calcMonsterActionHint(
              monster,
              entity.type,
              ActionType.shield,
              monster.firstActiveAction === 'bottom' ? abilityCard.bottomActions : abilityCard.actions,
              actionHints
            );
            this.calcMonsterActionHint(
              monster,
              entity.type,
              ActionType.retaliate,
              monster.firstActiveAction === 'bottom' ? abilityCard.bottomActions : abilityCard.actions,
              actionHints
            );
          }

          if (secondAbilityCard) {
            this.calcMonsterActionHint(
              monster,
              entity.type,
              ActionType.shield,
              monster.firstActiveAction === 'bottom' ? secondAbilityCard.actions : secondAbilityCard.bottomActions,
              actionHints
            );
            this.calcMonsterActionHint(
              monster,
              entity.type,
              ActionType.retaliate,
              monster.firstActiveAction === 'bottom' ? secondAbilityCard.actions : secondAbilityCard.bottomActions,
              actionHints
            );
          }
        } else if (abilityCard) {
          this.calcMonsterActionHint(monster, entity.type, ActionType.shield, abilityCard.actions, actionHints);
          this.calcMonsterActionHint(monster, entity.type, ActionType.retaliate, abilityCard.actions, actionHints);

          if (abilityCard.bottomActions) {
            this.calcMonsterActionHint(monster, entity.type, ActionType.shield, abilityCard.bottomActions, actionHints, 'bottom');
            this.calcMonsterActionHint(monster, entity.type, ActionType.retaliate, abilityCard.bottomActions, actionHints, 'bottom');
          }
        }
      }
    }

    return actionHints;
  }

  calcMonsterActionHint(
    monster: Monster,
    monsterType: MonsterType,
    type: ActionType,
    actions: Action[],
    actionHints: ActionHint[],
    parentIndex: string = ''
  ) {
    actions.forEach((action, i) => {
      const index = (parentIndex ? parentIndex + '-' : '') + i;
      if (
        action.type === type &&
        action.value !== 'X' &&
        (!action.subActions ||
          action.subActions.every(
            (subAction) => subAction.type !== ActionType.specialTarget || ('' + subAction.value).toLocaleLowerCase().includes('self')
          ))
      ) {
        const actionHint: ActionHint = new ActionHint(type, EntityValueFunction(action.value));
        if (action.subActions && action.subActions.length > 0) {
          const rangeSubAction = action.subActions.find((subAction) => subAction.type === ActionType.range);
          if (rangeSubAction) {
            if (!rangeSubAction.valueType || rangeSubAction.valueType === ActionValueType.fixed) {
              actionHint.range = EntityValueFunction(rangeSubAction.value);
            } else {
              const stats = gameManager.monsterManager.getStat(monster, monsterType);
              if (stats && rangeSubAction.valueType === ActionValueType.plus) {
                actionHint.range = EntityValueFunction(stats.range) + EntityValueFunction(rangeSubAction.value);
              } else if (stats && rangeSubAction.valueType === ActionValueType.minus) {
                actionHint.range = EntityValueFunction(stats.range) - EntityValueFunction(rangeSubAction.value);
              } else if (rangeSubAction.valueType === ActionValueType.add || rangeSubAction.valueType === ActionValueType.subtract) {
                actionHint.additionalRange = rangeSubAction.valueType === ActionValueType.add ? 'add' : 'substract';
                actionHint.range = EntityValueFunction(rangeSubAction.value);
              }
            }
          }
        }

        const existingActionHint = actionHints.find(
          (existing) =>
            existing.type === actionHint.type &&
            ((!actionHint.additionalRange && existing.range === actionHint.range) || (existing.range && actionHint.additionalRange))
        );

        if (existingActionHint) {
          if (existingActionHint.range && actionHint.additionalRange) {
            if (actionHint.additionalRange === 'add') {
              existingActionHint.range += actionHint.range;
            } else {
              existingActionHint.range -= actionHint.range;
            }
          }
          existingActionHint.value += actionHint.value;
        } else {
          actionHints.push(actionHint);
        }
      } else if (
        (action.subActions && action.type === ActionType.monsterType && action.value === monsterType) ||
        action.type === ActionType.concatenation ||
        action.type === ActionType.grid
      ) {
        this.calcMonsterActionHint(monster, monsterType, type, action.subActions, actionHints, index);
      } else if (
        action.subActions &&
        action.type === ActionType.element &&
        action.valueType === ActionValueType.minus &&
        monster.entities.find((monsterEntity) => monsterEntity.tags.find((tag) => tag === this.roundTag(action, index)))
      ) {
        this.calcMonsterActionHint(monster, monsterType, type, action.subActions, actionHints, index);
      } else if (action.type === ActionType.special) {
        const stats = monster.stats.find((stat) => stat.level === monster.level && stat.type === monsterType);
        const special = stats && stats.special[EntityValueFunction(action.value) - 1];
        if (special) {
          this.calcMonsterActionHint(monster, monsterType, type, special, actionHints, index);
        }
      }
    });
  }

  roundTag(action: Action, index: string): string {
    return 'roundAction-' + (index ? index + '-' : '') + action.type;
  }

  isInteractiveAction(action: Action): boolean {
    const selfSubAction =
      action.subActions &&
      action.subActions.find((subAction) => subAction.type === ActionType.specialTarget && ('' + subAction.value).startsWith('self'));
    const hasSelfSubAction = selfSubAction !== undefined;
    switch (action.type) {
      case ActionType.heal:
        return (
          hasSelfSubAction && action.subActions.every((subAction) => subAction === selfSubAction || subAction.type === ActionType.condition)
        );
      case ActionType.condition:
        return hasSelfSubAction && action.subActions.length === 1;
      case ActionType.sufferDamage:
        return !action.subActions || action.subActions.length === 0 || (hasSelfSubAction && action.subActions.length === 1);
      case ActionType.damage:
        return hasSelfSubAction && action.subActions.length === 1;
      case ActionType.switchType:
      case ActionType.element:
        return true;
      case ActionType.spawn:
      case ActionType.summon:
        return this.getMonsterSpawnData(action).length > 0 || this.getObjectiveSpawnData(action).length > 0;
    }

    return false;
  }

  isInteractiveApplicableAction(entity: Entity, action: Action, index: string): boolean {
    if (
      !this.isInteractiveAction(action) ||
      !gameManager.entityManager.isAlive(entity, true) ||
      entity.tags.indexOf(this.roundTag(action, index)) !== -1
    ) {
      return false;
    }

    switch (action.type) {
      case ActionType.heal:
        return (
          (entity.health > 0 && entity.health < EntityValueFunction(entity.maxHealth)) ||
          action.subActions.find(
            (subAction) =>
              subAction.type === ActionType.condition &&
              new Condition(subAction.value as ConditionName).types.includes(ConditionType.positive)
          ) !== undefined
        );
      case ActionType.condition:
        return !gameManager.conditionManager.hasCondition(entity, new Condition('' + action.value));
      case ActionType.switchType:
        return entity instanceof MonsterEntity && (entity.type === MonsterType.elite || entity.type === MonsterType.normal);
      case ActionType.element:
        const values = this.getValues(action);
        if (!action.valueType || action.valueType === ActionValueType.plus || action.valueType === ActionValueType.fixed) {
          return gameManager.game.elementBoard.some(
            (element) =>
              (action.value === Element.wild || values.includes(element.type)) &&
              (element.state === ElementState.inert ||
                element.state === ElementState.waning ||
                element.state === ElementState.consumed ||
                element.state === ElementState.partlyConsumed)
          );
        } else if (action.valueType === ActionValueType.minus) {
          const elements = this.getElementsToConsume(action);
          if (elements.length === values.length) {
            return (
              !action.subActions ||
              action.subActions.every((subAction) => !this.isInteractiveAction(subAction)) ||
              action.subActions.some((subAction, i) =>
                this.isInteractiveApplicableAction(entity, subAction, (index ? index + '-' : '') + i)
              )
            );
          }
        }
        return false;
      case ActionType.damage:
      case ActionType.sufferDamage:
      case ActionType.spawn:
      case ActionType.summon:
        return true;
    }

    return false;
  }

  getInteractiveActions(entity: Entity, figure: Figure, actions: Action[], preIndex: string): InteractiveAction[] {
    const result: InteractiveAction[] = [];
    if (!gameManager.entityManager.isAlive(entity, true)) {
      return [];
    }

    actions.forEach((action, i) => {
      const index = (preIndex ? preIndex + '-' : '') + i;
      const tag = this.roundTag(action, index);
      const hasTag = entity.tags.includes(tag);
      if (this.isInteractiveApplicableAction(entity, action, index) && !hasTag) {
        result.push({ action: action, index: index });
      }

      if (
        action.subActions &&
        ((action.type !== ActionType.monsterType && !this.isInteractiveAction(action)) ||
          hasTag ||
          this.subactionElement(action, entity, index) ||
          this.subactionsMonsterType(action, entity))
      ) {
        result.push(...this.getInteractiveActions(entity, figure, action.subActions, index));
      }

      if (action.type === ActionType.special && entity instanceof MonsterEntity && figure instanceof Monster) {
        const stats = figure.stats.find((stat) => stat.level === figure.level && stat.type === entity.type);
        if (stats) {
          result.push(...this.getInteractiveActions(entity, figure, stats.special[EntityValueFunction(action.value) - 1], index));
        }
      }
    });

    return result;
  }

  getAllInteractiveActions(figure: Figure, actions: Action[], preIndex: string): InteractiveAction[] {
    const interactiveActions: InteractiveAction[] = [];
    if (figure instanceof Monster || figure instanceof ObjectiveContainer) {
      figure.entities.forEach((entity) => {
        gameManager.actionsManager.getInteractiveActions(entity, figure, actions, preIndex).forEach((interactiveAction) => {
          if (interactiveActions.find((other) => other.index === interactiveAction.index) === undefined) {
            interactiveActions.push(interactiveAction);
          }
        });
      });
    }
    return interactiveActions;
  }

  subactionElement(action: Action, entity: Entity, index: string): boolean {
    return (
      action.type === ActionType.element &&
      (action.valueType !== ActionValueType.minus || this.isInteractiveApplicableAction(entity, action, index))
    );
  }

  subactionsMonsterType(action: Action, entity: Entity): boolean {
    return action.type === ActionType.monsterType && entity instanceof MonsterEntity && entity.type === (action.value as MonsterType);
  }

  hasMultiTarget(action: Action): boolean {
    if (action.multiTarget === false) {
      return false;
    }
    return action.multiTarget || (action.subActions && action.subActions.some((subAction) => this.isMultiTarget(subAction, true)));
  }

  isMultiTarget(action: Action, includeHex: boolean = true): boolean {
    if (action.multiTarget === false) {
      return false;
    }

    const result =
      (action.type === ActionType.target && EntityValueFunction(action.value) > 1) ||
      this.isMultiTargetSpecial(action) ||
      (includeHex && action.type === ActionType.area);

    return (
      result ||
      action.multiTarget ||
      (action.subActions && action.subActions.some((subAction) => this.isMultiTarget(subAction, includeHex)))
    );
  }

  isMultiTargetSpecial(action: Action): boolean {
    return (
      action.type === ActionType.specialTarget &&
      typeof action.value === 'string' &&
      [
        ActionSpecialTarget.all,
        ActionSpecialTarget.allCharacters,
        ActionSpecialTarget.allies,
        ActionSpecialTarget.alliesAdjacent,
        ActionSpecialTarget.alliesAdjacentAffect,
        ActionSpecialTarget.alliesAffect,
        ActionSpecialTarget.alliesEnemies,
        ActionSpecialTarget.alliesRange,
        ActionSpecialTarget.alliesRangeAffect,
        ActionSpecialTarget.enemies,
        ActionSpecialTarget.enemiesAdjacent,
        ActionSpecialTarget.enemiesMovedThrough,
        ActionSpecialTarget.enemiesMovedThroughAdjacent,
        ActionSpecialTarget.enemiesRange,
        ActionSpecialTarget.enemiesRangeAffect,
        ActionSpecialTarget.enemiesRangeAffectExact,
        ActionSpecialTarget.enemiesRangeExact,
        ActionSpecialTarget.figures,
        ActionSpecialTarget.figuresAdjacent,
        ActionSpecialTarget.figuresRange,
        ActionSpecialTarget.selfAllies,
        ActionSpecialTarget.selfAlliesAdjacentAffect,
        ActionSpecialTarget.selfAlliesAffect,
        ActionSpecialTarget.selfAlliesAffectRange,
        ActionSpecialTarget.selfAlliesRange,
        ActionSpecialTarget.targets
      ].includes(action.value.split(':')[0] as ActionSpecialTarget)
    );
  }

  // entities of an active figure with interactive actions, only the first one unless they get combined
  interactiveEntities(figure: Monster | ObjectiveContainer, actions: Action[], preIndex: string): (MonsterEntity | ObjectiveEntity)[] {
    if (!settingsManager.settings.interactiveAbilities || !figure.active) {
      return [];
    }
    let entities: (MonsterEntity | ObjectiveEntity)[] = figure.entities.filter(
      (entity) => this.getInteractiveActions(entity, figure, actions, preIndex).length
    );
    if (figure instanceof Monster) {
      entities = (entities as MonsterEntity[]).sort(gameManager.monsterManager.sortEntities);
    }
    return entities.filter((_, index) => settingsManager.settings.combineInteractiveAbilities || index === 0);
  }

  interactiveActionsOf(entities: Entity[], figure: Figure, actions: Action[], preIndex: string): InteractiveAction[] {
    const interactiveActions: InteractiveAction[] = [];
    entities.forEach((entity) => {
      this.getInteractiveActions(entity, figure, actions, preIndex).forEach((interactiveAction) => {
        if (!interactiveActions.find((other) => other.index === interactiveAction.index)) {
          interactiveActions.push(interactiveAction);
        }
      });
    });
    return interactiveActions;
  }

  // ward or brittle could change whether entities survive damage when only one of them gets applied automatically
  interactiveDamageWarning(entities: Entity[], interactiveActions: InteractiveAction[]): boolean {
    const autoApplied = (name: ConditionName) =>
      settingsManager.settings.applyConditions &&
      settingsManager.settings.activeApplyConditions &&
      settingsManager.settings.activeApplyConditionsAuto.includes(name) &&
      !settingsManager.settings.activeApplyConditionsExcludes.includes(name);
    const wardEnabled = autoApplied(ConditionName.ward);
    const brittleEnabled = autoApplied(ConditionName.brittle);
    return (
      !(wardEnabled && brittleEnabled) &&
      interactiveActions
        .filter((interactiveAction) => interactiveAction.action.type === ActionType.sufferDamage)
        .some((interactiveAction) => {
          const damage = EntityValueFunction(interactiveAction.action.value);
          const result = (ward: boolean, brittle: boolean) => Math.floor((damage * (brittle ? 2 : 1)) / (ward ? 2 : 1));
          return entities.some((entity) => {
            const ward = gameManager.conditionManager.hasCondition(entity, new Condition(ConditionName.ward));
            const brittle = gameManager.conditionManager.hasCondition(entity, new Condition(ConditionName.brittle));
            const shouldDie = entity.health - result(ward, brittle) <= 0;
            const wouldDie = entity.health - result(ward && wardEnabled, brittle && brittleEnabled) <= 0;
            return shouldDie != wouldDie;
          });
        })
    );
  }

  // actions selected by default: with a damage warning, actions after the damage are toggled off
  defaultInteractiveActions(
    entities: Entity[],
    interactiveActions: InteractiveAction[]
  ): { selected: InteractiveAction[]; toggledOff: InteractiveAction[] } {
    if (this.interactiveDamageWarning(entities, interactiveActions)) {
      const damageIndex = interactiveActions.findIndex((interactiveAction) => interactiveAction.action.type === ActionType.sufferDamage);
      if (damageIndex !== -1) {
        return { selected: interactiveActions.slice(0, damageIndex + 1), toggledOff: interactiveActions.slice(damageIndex + 1) };
      }
    }
    return { selected: interactiveActions, toggledOff: [] };
  }

  wildElementsToConsume(chosen: string[], chooseAction: InteractiveAction | undefined, interactiveActions: InteractiveAction[]): Element[] {
    return gameManager.game.elementBoard
      .filter(
        (element) =>
          element.state !== ElementState.inert &&
          element.state !== ElementState.new &&
          element.state !== ElementState.consumed &&
          !chosen.includes(element.type) &&
          (!chooseAction || !this.getValues(chooseAction.action).includes(element.type)) &&
          !interactiveActions.find(
            (interactiveAction) =>
              interactiveAction.action.type === ActionType.element &&
              interactiveAction.action.valueType === ActionValueType.minus &&
              interactiveAction.action.value === element.type
          )
      )
      .map((element) => element.type);
  }

  wildElementsToCreate(chosen: string[], chooseAction: InteractiveAction | undefined): Element[] {
    return gameManager.game.elementBoard
      .filter(
        (element) =>
          element.state !== ElementState.new &&
          element.state !== ElementState.strong &&
          element.state !== ElementState.always &&
          !chosen.includes(element.type) &&
          (!chooseAction || !this.getValues(chooseAction.action).includes(element.type))
      )
      .map((element) => element.type);
  }

  /**
   * apply interactive actions of the entities one after another, `selected` limits the applied actions (all if undefined).
   * Actions neither selected nor `toggledOff` get marked as handled for this round.
   */
  applyInteractiveActions(
    figure: Monster | ObjectiveContainer,
    entities: (MonsterEntity | ObjectiveEntity)[],
    actions: Action[],
    preIndex: string,
    elements: string[] = [],
    selected: InteractiveAction[] | undefined = undefined,
    toggledOff: InteractiveAction[] = []
  ) {
    let chooseElementValues = [...elements];
    const isSelected = (interactiveAction: InteractiveAction) =>
      !selected || selected.some((other) => other.index === interactiveAction.index);
    entities.forEach((entity) => {
      const next = () => this.getInteractiveActions(entity, figure, actions, preIndex).filter(isSelected);
      let interactiveAction: InteractiveAction | undefined = next()[0];
      while (interactiveAction) {
        this.applyInteractiveAction(entity, figure, interactiveAction, chooseElementValues);
        if (interactiveAction.action.type === ActionType.element) {
          chooseElementValues = [];
        }
        const processed: InteractiveAction = interactiveAction;
        const remaining = next();
        if (remaining.some((other) => other.index === processed.index)) {
          console.warn('Interactive Action already processed, should not happen', processed);
          break;
        }
        interactiveAction = remaining[0];
      }

      if (selected) {
        this.getInteractiveActions(entity, figure, actions, preIndex)
          .filter((interactiveAction) => !isSelected(interactiveAction))
          .filter((interactiveAction) => !toggledOff.some((other) => other.index === interactiveAction.index))
          .forEach((interactiveAction) => {
            const tag = this.roundTag(interactiveAction.action, interactiveAction.index);
            if (!entity.tags.includes(tag)) {
              entity.tags.push(tag);
            }
          });
      }
    });
  }

  applyInteractiveAction(
    entity: Entity,
    figure: Figure,
    interactiveAction: InteractiveAction,
    additionalValues: string[] = [],
    force: boolean = false
  ) {
    const action = interactiveAction.action;
    const index = interactiveAction.index;
    if (!this.isInteractiveApplicableAction(entity, action, index) && !force) {
      return;
    }

    const tag = this.roundTag(action, index);
    if (entity.tags.includes(tag)) {
      return;
    }

    switch (action.type) {
      case ActionType.heal:
        let heal = EntityValueFunction(action.value, figure.level);
        if (entity.health + heal > EntityValueFunction(entity.maxHealth)) {
          heal = EntityValueFunction(entity.maxHealth) - entity.health;
        }
        entity.health += heal;
        const healCondition = new EntityCondition(ConditionName.heal, heal);
        gameManager.conditionManager.addCondition(entity, figure, healCondition);
        if (action.subActions) {
          action.subActions
            .filter((subAction) => subAction.type === ActionType.condition)
            .forEach((subAction) => {
              gameManager.conditionManager.addCondition(entity, figure, new Condition('' + subAction.value));
            });
        }
        gameManager.conditionManager.applyCondition(entity, figure, healCondition, true);
        break;
      case ActionType.condition:
        gameManager.conditionManager.addCondition(entity, figure, new Condition('' + action.value));
        break;
      case ActionType.damage:
      case ActionType.sufferDamage:
        gameManager.entityManager.changeHealth(entity, figure, -EntityValueFunction(action.value, figure.level), true);
        break;
      case ActionType.switchType:
        if (figure instanceof Monster && entity instanceof MonsterEntity) {
          const normalStat = figure.stats.find((stat) => stat.level === figure.level && stat.type === MonsterType.normal);
          const eliteStat = figure.stats.find((stat) => stat.level === figure.level && stat.type === MonsterType.elite);
          if (normalStat && eliteStat) {
            entity.type = entity.type === MonsterType.elite ? MonsterType.normal : MonsterType.elite;
            entity.maxHealth = EntityValueFunction(entity.type === MonsterType.normal ? normalStat.health : eliteStat.health, figure.level);
            if (entity.health > entity.maxHealth) {
              entity.health = entity.maxHealth;
            } else if (
              entity.health < entity.maxHealth &&
              entity.health === EntityValueFunction(entity.type === MonsterType.normal ? eliteStat.health : normalStat.health, entity.level)
            ) {
              entity.health = entity.maxHealth;
            }
          }
        }
        break;
      case ActionType.element:
        if (figure instanceof Monster) {
          // interactive element action only apply once per monster
          figure.entities.forEach((monsterEntity) => {
            if (monsterEntity !== entity) {
              monsterEntity.tags.push(tag);
            }
          });
        }
        if (action.valueType === ActionValueType.minus) {
          let elements: Element[] = this.getValues(action).map((value) => value as Element);
          const toConsume: Element[] = this.getElementsToConsume(action).map((value) => value.type);
          elements = elements
            .map((value) => {
              if (value === Element.wild) {
                return additionalValues.shift() || toConsume.shift();
              }
              toConsume.shift();
              return value;
            })
            .map((value) => value as Element);
          elements.forEach((element) => {
            gameManager.game.elementBoard.forEach((elementModel) => {
              if (
                elementModel.type === element &&
                (elementModel.state === ElementState.strong || elementModel.state === ElementState.waning)
              ) {
                elementModel.state = ElementState.partlyConsumed;
                if (figure instanceof Monster && entity instanceof MonsterEntity) {
                  const entities = figure.entities.filter((entity) => this.isInteractiveApplicableAction(entity, action, index));
                  if (entities.length && entities.indexOf(entity) === entities.length - 1) {
                    elementModel.state = ElementState.consumed;
                  }
                } else if (figure instanceof ObjectiveContainer && entity instanceof ObjectiveEntity) {
                  const entities = figure.entities.filter((entity) => this.isInteractiveApplicableAction(entity, action, index));
                  if (entities.length && entities.indexOf(entity) === entities.length - 1) {
                    elementModel.state = ElementState.consumed;
                  }
                } else {
                  elementModel.state = ElementState.consumed;
                }
              }
            });
          });
        } else {
          this.getValues(action).forEach((value, index) => {
            const element = (additionalValues[index] ? additionalValues[index] : value) as Element;
            gameManager.game.elementBoard.forEach((elementModel) => {
              if (elementModel.type === element) {
                if (elementModel.state !== ElementState.always) {
                  elementModel.state = ElementState.new;
                  if (figure instanceof Character) {
                    gameManager.personalQuestManager.trackPersonalQuestProgress(figure, PersonalQuestAutotrackType.element, element);
                  }
                }
              }
            });
          });
        }
        break;
      case ActionType.spawn:
      case ActionType.summon:
        const monsterSpawns = this.getMonsterSpawnData(action);
        for (const spawn of monsterSpawns) {
          if (spawn.monster && spawn.monster.type) {
            const edition =
              figure instanceof Monster
                ? figure.edition
                : gameManager.game.scenario
                  ? gameManager.game.scenario.edition
                  : gameManager.editionManager.currentEdition();
            const monster = gameManager.monsterManager.addMonsterByName(spawn.monster.name, edition);
            if (monster) {
              const spawnCount: number =
                typeof spawn.count === 'string'
                  ? EntityValueFunction(
                      spawn.count.replaceAll('HP', '' + entity.health).replaceAll('H', '' + EntityValueFunction(entity.maxHealth)),
                      entity.level
                    )
                  : spawn.count || 1;
              const count = Math.min(
                gameManager.monsterManager.monsterStandeeMax(monster) - gameManager.monsterManager.monsterStandeeCount(monster),
                spawnCount
              );
              for (let i = 0; i < count; i++) {
                const spawnEntity = gameManager.monsterManager.spawnMonsterEntity(
                  monster,
                  spawn.monster.type,
                  monster.isAlly,
                  monster.isAllied,
                  monster.drawExtra,
                  action.type === ActionType.summon
                );
                if (spawnEntity) {
                  if (spawn.monster.marker) {
                    spawnEntity.marker = spawn.monster.marker;
                  }
                  if (spawn.monster.health) {
                    let health = spawn.monster.health;
                    if (typeof health === 'string') {
                      health = health.replaceAll('H', '' + entity.health);
                    }

                    spawnEntity.health = EntityValueFunction(health);

                    if (spawnEntity.health > spawnEntity.maxHealth) {
                      spawnEntity.health = spawnEntity.maxHealth;
                    }
                  }
                  if (spawnEntity.marker || spawnEntity.tags.length > 0) {
                    gameManager.entityCounterManager.addEntityCount(monster, spawnEntity);
                  }
                }
              }
            }
          }
        }
        const objectiveSpawns = this.getObjectiveSpawnData(action);
        for (const spawn of objectiveSpawns) {
          if (figure instanceof Monster) {
            const count: number = !spawn.count ? 1 : EntityValueFunction(spawn.count);
            const objectiveContainer =
              (gameManager.game.figures.find(
                (f) =>
                  f instanceof ObjectiveContainer &&
                  gameManager.entityManager.additionalIdentifier(figure).equals(f.objectiveId as AdditionalIdentifier)
              ) as ObjectiveContainer) ||
              gameManager.objectiveManager.addObjective(
                spawn.objective,
                spawn.objective.name,
                gameManager.entityManager.additionalIdentifier(figure)
              );
            if (count > 1) {
              for (let i = 0; i < count; i++) {
                const spawnEntity = gameManager.objectiveManager.addObjectiveEntity(objectiveContainer);
                if (spawnEntity) {
                  if (spawn.objective.marker) {
                    spawnEntity.marker = spawn.objective.marker;
                  }
                  if (spawn.objective.health) {
                    let health = spawn.objective.health;
                    if (typeof health === 'string') {
                      health = health.replaceAll('H', '' + entity.health);
                    }

                    spawnEntity.health = EntityValueFunction(health);

                    if (spawnEntity.health > spawnEntity.maxHealth) {
                      spawnEntity.health = spawnEntity.maxHealth;
                    }
                  }
                  if (spawnEntity.marker || spawnEntity.tags.length > 0) {
                    gameManager.entityCounterManager.addEntityCount(objectiveContainer, spawnEntity);
                  }
                }
              }
            }
          }
        }
        break;
    }

    entity.tags.push(tag);
  }

  getMonsterSpawnData(action: Action): MonsterSpawnData[] {
    let result: MonsterSpawnData[] = [];

    if (!action || !action.type || (action.type !== ActionType.spawn && action.type !== ActionType.summon)) {
      return result;
    }

    if (action.value === 'monsterStandee') {
      result = (JSON.parse(JSON.stringify(action.valueObject)) as MonsterSpawnData[]).map((value) => value as MonsterSpawnData);
      const charCount = gameManager.levelManager.characterCountVariable();
      result = result.filter((spawn) => {
        if (spawn.monster.type) {
          return true;
        } else if (charCount < 3 && spawn.monster.player2) {
          return true;
        } else if (charCount === 3 && spawn.monster.player3) {
          return true;
        } else if (charCount > 3 && spawn.monster.player4) {
          return true;
        }
        return !settingsManager.settings.calculate;
      });

      result.forEach((spawn) => {
        if (!spawn.monster.type) {
          if (charCount < 3 && spawn.monster.player2) {
            spawn.monster.type = spawn.monster.player2;
          } else if (charCount === 3 && spawn.monster.player3) {
            spawn.monster.type = spawn.monster.player3;
          } else if (charCount > 3 && spawn.monster.player4) {
            spawn.monster.type = spawn.monster.player4;
          }
        }
      });
    }
    return result;
  }

  getObjectiveSpawnData(action: Action): ObjectiveSpawnData[] {
    let result: ObjectiveSpawnData[] = [];

    if (!action || !action.type || (action.type !== ActionType.spawn && action.type !== ActionType.summon)) {
      return result;
    }
    if (action.value === 'objectiveSpawn') {
      result = (JSON.parse(JSON.stringify(action.valueObject)) as ObjectiveSpawnData[]).map((value) => value as ObjectiveSpawnData);
      result = result.filter((spawn) => !spawn.count || EntityValueFunction(spawn.count) > 0);
    }

    return result;
  }

  getElementsToConsume(action: Action): ElementModel[] {
    const elements: ElementModel[] = [];
    if (!action || !action.type || (action.type === ActionType.element && action.valueType === ActionValueType.minus)) {
      const values = this.getValues(action);
      values.forEach((value, index, self) => {
        const elementModel = gameManager.game.elementBoard.find(
          (element) =>
            (element.type === value || (value === Element.wild && !self.includes(element.type))) &&
            element.state !== ElementState.inert &&
            element.state !== ElementState.new &&
            element.state !== ElementState.consumed &&
            !elements.includes(element)
        );
        if (elementModel) {
          elements.push(elementModel);
        }
      });
    }
    return elements;
  }

  copyAction(action: Action): Action {
    return new Action(
      action.type,
      action.value,
      action.valueType,
      !!action.subActions ? action.subActions.map((subAction) => this.copyAction(subAction)) : [],
      action.small,
      action.hidden
    );
  }

  extraActions(entity: Entity, persistent: boolean = false): Action[] {
    return persistent ? entity.extraActionsPersistent : entity.extraActions;
  }

  extraActionIndex(entity: Entity, type: string, value: string | number, persistent: boolean = false): number {
    return this.extraActions(entity, persistent).findIndex((action) => action.type === type && '' + action.value === '' + value);
  }

  private setExtraActions(entity: Entity, actions: Action[], persistent: boolean) {
    if (persistent) {
      entity.extraActionsPersistent = actions;
    } else {
      entity.extraActions = actions;
    }
  }

  // extra actions left after removing the one at index
  extraActionsWithout(entity: Entity, index: number, persistent: boolean = false): Action[] {
    return this.extraActions(entity, persistent).filter((_, i) => i !== index);
  }

  canRemoveExtraAction(entity: Entity, index: number, persistent: boolean = false): boolean {
    return Number.isInteger(index) && index >= 0 && index < this.extraActions(entity, persistent).length;
  }

  removeExtraAction(entity: Entity, index: number, persistent: boolean = false): boolean {
    if (!this.canRemoveExtraAction(entity, index, persistent)) {
      return false;
    }
    this.setExtraActions(entity, this.extraActionsWithout(entity, index, persistent), persistent);
    return true;
  }

  canResolveExtraAction(entity: Entity, index: number, persistent: boolean = false): boolean {
    return this.canRemoveExtraAction(entity, index, persistent) && this.extraActions(entity, persistent)[index].type === ActionType.extra;
  }

  // an accepted extra action is replaced by its sub actions, a declined one is only removed
  resolveExtraAction(entity: Entity, index: number, accept: boolean, persistent: boolean = false): boolean {
    if (!this.canResolveExtraAction(entity, index, persistent)) {
      return false;
    }
    const action = this.extraActions(entity, persistent)[index];
    const actions = this.extraActionsWithout(entity, index, persistent);
    if (accept && action.subActions) {
      actions.push(...action.subActions);
    }
    this.setExtraActions(entity, actions, persistent);
    return true;
  }

  // damage and heal of a trap, shown like extra actions
  trapActions(summon: Summon): Action[] {
    const actions: Action[] = [];
    if (summon.trap) {
      if (summon.movement) {
        actions.push(new Action(ActionType.damage, summon.movement));
      }
      if (summon.attack) {
        actions.push(new Action(ActionType.heal, summon.attack));
      }
    }
    return actions;
  }

  private retaliateRange(action: Action): number {
    const rangeSubAction = (action.subActions || []).find((subAction) => subAction.type === ActionType.range);
    const range = rangeSubAction ? EntityValueFunction(rangeSubAction.value) : 1;
    return range <= 1 ? 1 : range;
  }

  // extra actions an action hint is built from, retaliates also need the same range
  private matchesActionHint(action: Action, actionHint: ActionHint): boolean {
    if (action.type !== actionHint.type) {
      return false;
    }
    return actionHint.type !== ActionType.retaliate || this.retaliateRange(action) === (actionHint.range > 1 ? actionHint.range : 1);
  }

  canRemoveActionHint(entity: Entity, actionHint: ActionHint): boolean {
    return [...entity.extraActions, ...entity.extraActionsPersistent].some((action) => this.matchesActionHint(action, actionHint));
  }

  removeActionHint(entity: Entity, actionHint: ActionHint): boolean {
    if (!this.canRemoveActionHint(entity, actionHint)) {
      return false;
    }
    entity.extraActions = entity.extraActions.filter((action) => !this.matchesActionHint(action, actionHint));
    entity.extraActionsPersistent = entity.extraActionsPersistent.filter((action) => !this.matchesActionHint(action, actionHint));
    return true;
  }

  extraActionLabel(action: Action): string {
    return (
      '%game.action.' +
      action.type +
      '% ' +
      EntityValueFunction(action.value) +
      (action.subActions &&
      action.subActions[0] &&
      action.subActions[0].type === ActionType.range &&
      EntityValueFunction(action.subActions[0].value) > 1
        ? ' %game.action.range% ' + EntityValueFunction(action.subActions[0].value)
        : '')
    );
  }
}
