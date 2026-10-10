import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { Entity, EntityValueFunction } from 'src/app/game/model/Entity';

type ActionList = 'extraActions' | 'extraActionsPersistent';

function actionList(persistent: boolean): ActionList {
  return persistent ? 'extraActionsPersistent' : 'extraActions';
}

export function shieldRetaliateEnabled(entity: Entity): boolean {
  return (
    (entity instanceof Character && settingsManager.settings.characterShieldRetaliate) ||
    (!(entity instanceof Character) && settingsManager.settings.standeeShieldRetaliate)
  );
}

export function effectiveActionValue(action: Action | undefined): number {
  if (!action) return 0;
  const value = EntityValueFunction(action.value);
  return action.valueType === ActionValueType.minus ? -value : value;
}

export function shieldAction(entity: Entity, persistent: boolean): Action | undefined {
  return entity[actionList(persistent)].find((action) => action.type === ActionType.shield);
}

export function retaliateActions(entity: Entity, persistent: boolean): Action[] {
  return entity[actionList(persistent)].filter((action) => action.type === ActionType.retaliate);
}

export function createRetaliateAction(value: number, range: number = 1): Action {
  const retaliateAction = new Action(ActionType.retaliate, Math.abs(value));
  if (value < 0) {
    retaliateAction.valueType = ActionValueType.minus;
  }
  retaliateAction.subActions = [];
  if (range !== 1) {
    const rangeAction = new Action(ActionType.range, range);
    rangeAction.small = true;
    retaliateAction.subActions.push(rangeAction);
  }
  return retaliateAction;
}

export function setShieldAction(entity: Entity, persistent: boolean, value: number, additive: boolean) {
  const list = actionList(persistent);
  const existing = shieldAction(entity, persistent);

  if (additive && existing) {
    const newEffective = effectiveActionValue(existing) + value;
    existing.valueType = newEffective < 0 ? ActionValueType.minus : ActionValueType.fixed;
    existing.value = Math.abs(newEffective);
  } else {
    entity[list] = entity[list].filter((action) => action.type !== ActionType.shield);
    if (value !== 0) {
      const newAction = new Action(ActionType.shield, Math.abs(value));
      if (value < 0) {
        newAction.valueType = ActionValueType.minus;
      }
      entity[list].push(gameManager.actionsManager.copyAction(newAction));
    }
  }

  entity[list] = entity[list].filter((action) => action.type !== ActionType.shield || effectiveActionValue(action) !== 0);
}

export function setRetaliateActions(entity: Entity, persistent: boolean, retaliate: Action[], additive: boolean) {
  const list = actionList(persistent);

  if (additive) {
    retaliate.forEach((retaliateAction) => {
      const existing = retaliateActions(entity, persistent).find(
        (action) => JSON.stringify(action.subActions) === JSON.stringify(retaliateAction.subActions)
      );
      if (existing) {
        const newEffective = effectiveActionValue(existing) + effectiveActionValue(retaliateAction);
        existing.valueType = newEffective < 0 ? ActionValueType.minus : ActionValueType.fixed;
        existing.value = Math.abs(newEffective);
      } else {
        entity[list].push(gameManager.actionsManager.copyAction(retaliateAction));
      }
    });
  } else {
    entity[list] = entity[list].filter((action) => action.type !== ActionType.retaliate);
    retaliate.forEach((retaliateAction) => entity[list].push(gameManager.actionsManager.copyAction(retaliateAction)));
  }

  entity[list] = entity[list].filter((action) => action.type !== ActionType.retaliate || EntityValueFunction(action.value) !== 0);
}
