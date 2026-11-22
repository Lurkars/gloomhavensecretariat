import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { Entity, EntityValueFunction } from 'src/app/game/model/Entity';
import { Game } from 'src/app/game/model/Game';

type ActionList = 'extraActions' | 'extraActionsPersistent';

export class ShieldRetaliateManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  private actionList(persistent: boolean): ActionList {
    return persistent ? 'extraActionsPersistent' : 'extraActions';
  }

  enabled(entity: Entity): boolean {
    return (
      (entity instanceof Character && settingsManager.settings.characterShieldRetaliate) ||
      (!(entity instanceof Character) && settingsManager.settings.standeeShieldRetaliate)
    );
  }

  effectiveValue(action: Action | undefined): number {
    if (!action) {
      return 0;
    }
    const value = EntityValueFunction(action.value);
    return action.valueType === ActionValueType.minus ? -value : value;
  }

  shieldAction(entity: Entity, persistent: boolean): Action | undefined {
    return entity[this.actionList(persistent)].find((action) => action.type === ActionType.shield);
  }

  retaliateActions(entity: Entity, persistent: boolean): Action[] {
    return entity[this.actionList(persistent)].filter((action) => action.type === ActionType.retaliate);
  }

  hasTaunt(entity: Entity, persistent: boolean): boolean {
    return entity[this.actionList(persistent)].some((action) => action.type === ActionType.taunt);
  }

  setTaunt(entity: Entity, persistent: boolean, value: boolean) {
    const list = this.actionList(persistent);
    entity[list] = entity[list].filter((action) => action.type !== ActionType.taunt);
    if (value) {
      entity[list].push(new Action(ActionType.taunt));
    }
  }

  rangeAction(value: string | number = 1): Action {
    const rangeAction = new Action(ActionType.range, value);
    rangeAction.small = true;
    return rangeAction;
  }

  rangeValue(action: Action): string | number {
    const range = action.subActions.find((subAction) => subAction.type === ActionType.range);
    return range ? range.value : 1;
  }

  retaliateAction(value: string | number, range: string | number = 1): Action {
    const numericValue = EntityValueFunction(value);
    const retaliateAction = new Action(ActionType.retaliate, Math.abs(numericValue));
    if (numericValue < 0) {
      retaliateAction.valueType = ActionValueType.minus;
    }
    retaliateAction.subActions = [];
    if (EntityValueFunction(range) !== 1) {
      retaliateAction.subActions.push(this.rangeAction(range));
    }
    return retaliateAction;
  }

  setShield(entity: Entity, persistent: boolean, value: string | number, additive: boolean) {
    const list = this.actionList(persistent);
    const existing = this.shieldAction(entity, persistent);
    const numericValue = EntityValueFunction(value);

    if (additive && existing) {
      const newEffective = this.effectiveValue(existing) + numericValue;
      existing.valueType = newEffective < 0 ? ActionValueType.minus : ActionValueType.fixed;
      existing.value = Math.abs(newEffective);
    } else {
      entity[list] = entity[list].filter((action) => action.type !== ActionType.shield);
      if (numericValue !== 0) {
        const newAction = new Action(ActionType.shield, Math.abs(numericValue));
        if (numericValue < 0) {
          newAction.valueType = ActionValueType.minus;
        }
        entity[list].push(gameManager.actionsManager.copyAction(newAction));
      }
    }

    entity[list] = entity[list].filter((action) => action.type !== ActionType.shield || this.effectiveValue(action) !== 0);
  }

  setRetaliate(entity: Entity, persistent: boolean, retaliate: Action[], additive: boolean) {
    const list = this.actionList(persistent);

    if (additive) {
      retaliate.forEach((retaliateAction) => {
        const existing = this.retaliateActions(entity, persistent).find(
          (action) => JSON.stringify(action.subActions) === JSON.stringify(retaliateAction.subActions)
        );
        if (existing) {
          const newEffective = this.effectiveValue(existing) + this.effectiveValue(retaliateAction);
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
}
