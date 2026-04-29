import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Monster } from 'src/app/game/model/Monster';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';

export class ShieldRetaliateHelper {
  constructor(private component: EntitiesMenuDialogComponent) {}

  private actionList(persistent: boolean) {
    return persistent ? 'extraActionsPersistent' : 'extraActions';
  }

  private createRangeAction(value: string | number = 1): Action {
    const rangeAction = new Action(ActionType.range, value);
    rangeAction.small = true;
    return rangeAction;
  }

  private createRetaliateAction(value: string | number, range: string | number = 1): Action {
    const numericValue = EntityValueFunction(value);
    const retaliateAction = new Action(ActionType.retaliate, Math.abs(numericValue));
    if (numericValue < 0) {
      retaliateAction.valueType = ActionValueType.minus;
    }
    retaliateAction.subActions = [];

    if (EntityValueFunction(range) !== 1) {
      retaliateAction.subActions.push(this.createRangeAction(range));
    }

    return retaliateAction;
  }

  private shieldAction(entity: any, persistent: boolean): Action | undefined {
    return entity[this.actionList(persistent)].find((action: Action) => action.type === ActionType.shield);
  }

  private retaliateActions(entity: any, persistent: boolean): Action[] {
    return entity[this.actionList(persistent)].filter((action: Action) => action.type === ActionType.retaliate);
  }

  private rangeValue(action: Action): string | number {
    const rangeSubAction = action.subActions.find((subAction) => subAction.type === ActionType.range);
    return rangeSubAction ? rangeSubAction.value : 1;
  }

  private sameRetaliateProfile(first: Action, second: Action): boolean {
    return JSON.stringify(first.subActions) === JSON.stringify(second.subActions);
  }

  private effectiveActionValue(action: Action | undefined): number {
    if (!action) return 0;
    const val = EntityValueFunction(action.value);
    return action.valueType === ActionValueType.minus ? -val : val;
  }

  private setShieldAction(entity: any, persistent: boolean, value: string | number, additive: boolean) {
    const actionList = this.actionList(persistent);
    const shieldAction = this.shieldAction(entity, persistent);
    const numericValue = EntityValueFunction(value);

    if (additive && shieldAction) {
      const newEffective = this.effectiveActionValue(shieldAction) + numericValue;
      if (newEffective < 0) {
        shieldAction.valueType = ActionValueType.minus;
        shieldAction.value = -newEffective;
      } else {
        shieldAction.valueType = ActionValueType.fixed;
        shieldAction.value = newEffective;
      }
    } else {
      entity[actionList] = entity[actionList].filter((action: Action) => action.type !== ActionType.shield);
      if (numericValue !== 0) {
        const newAction = new Action(ActionType.shield, Math.abs(numericValue));
        if (numericValue < 0) {
          newAction.valueType = ActionValueType.minus;
        }
        entity[actionList].push(gameManager.actionsManager.copyAction(newAction));
      }
    }

    entity[actionList] = entity[actionList].filter(
      (action: Action) => action.type !== ActionType.shield || this.effectiveActionValue(action) !== 0
    );
  }

  private setRetaliateActions(entity: any, persistent: boolean, retaliateActions: Action[], additive: boolean) {
    const actionList = this.actionList(persistent);

    if (additive) {
      retaliateActions.forEach((retaliateAction) => {
        const existing = this.retaliateActions(entity, persistent).find((action) => this.sameRetaliateProfile(action, retaliateAction));
        if (existing) {
          const newEffective = this.effectiveActionValue(existing) + this.effectiveActionValue(retaliateAction);
          if (newEffective < 0) {
            existing.valueType = ActionValueType.minus;
            existing.value = -newEffective;
          } else {
            existing.valueType = ActionValueType.fixed;
            existing.value = newEffective;
          }
        } else {
          entity[actionList].push(gameManager.actionsManager.copyAction(retaliateAction));
        }
      });
    } else {
      entity[actionList] = entity[actionList].filter((action: Action) => action.type !== ActionType.retaliate);
      retaliateActions.forEach((retaliateAction) => entity[actionList].push(gameManager.actionsManager.copyAction(retaliateAction)));
    }

    entity[actionList] = entity[actionList].filter(
      (action: Action) => action.type !== ActionType.retaliate || EntityValueFunction(action.value) !== 0
    );
  }

  update() {
    this.component.shieldAndRetaliate =
      (settingsManager.settings.characterShieldRetaliate &&
        (this.component.figures.find((figure) => figure instanceof Character) !== undefined ||
          this.component.figures.find((figure) => figure instanceof ObjectiveContainer && figure.escort) !== undefined)) ||
      (settingsManager.settings.standeeShieldRetaliate && this.component.figures.find((figure) => figure instanceof Monster) !== undefined);

    if (this.component.shieldAndRetaliate && this.component.entity) {
      this.component.entityShield.value = this.effectiveActionValue(this.shieldAction(this.component.entity, false));
      this.component.entityShieldPersistent.value = this.effectiveActionValue(this.shieldAction(this.component.entity, true));

      const retaliate = this.retaliateActions(this.component.entity, false);
      this.component.entityRetaliate = retaliate.length
        ? retaliate.map((action) => new Action(ActionType.retaliate, this.effectiveActionValue(action)))
        : [new Action(ActionType.retaliate, 0)];
      this.component.entityRetaliateRange = retaliate.length
        ? retaliate.map((action) => this.createRangeAction(this.rangeValue(action)))
        : [this.createRangeAction()];

      const retaliatePersistent = this.retaliateActions(this.component.entity, true);
      this.component.entityRetaliatePersistent = retaliatePersistent.length
        ? retaliatePersistent.map((action) => new Action(ActionType.retaliate, this.effectiveActionValue(action)))
        : [new Action(ActionType.retaliate, 0)];
      this.component.entityRetaliateRangePersistent = retaliatePersistent.length
        ? retaliatePersistent.map((action) => this.createRangeAction(this.rangeValue(action)))
        : [this.createRangeAction()];
    }
  }

  changeShield(value: number) {
    this.component.entityShield.value = EntityValueFunction(this.component.entityShield.value) + value;
    this.component.ghsManager.triggerUiChange();
  }

  changeShieldPersistent(value: number) {
    this.component.entityShieldPersistent.value = EntityValueFunction(this.component.entityShieldPersistent.value) + value;
    this.component.ghsManager.triggerUiChange();
  }

  changeRetaliate(index: number, value: number, range: number, remove: boolean = false) {
    if (!this.component.entityRetaliate[index]) {
      this.component.entityRetaliate[index] = new Action(ActionType.retaliate, 0);
    }
    if (!this.component.entityRetaliateRange[index]) {
      this.component.entityRetaliateRange[index] = new Action(ActionType.range, 1);
      this.component.entityRetaliateRange[index].small = true;
    }

    this.component.entityRetaliate[index].value = EntityValueFunction(this.component.entityRetaliate[index].value) + value;
    this.component.entityRetaliateRange[index].value = EntityValueFunction(this.component.entityRetaliateRange[index].value) + range;

    if (remove && this.component.entityRetaliate.length > 1) {
      this.component.entityRetaliate.splice(index, 1);
      this.component.entityRetaliateRange.splice(index, 1);
    }

    this.component.ghsManager.triggerUiChange();
  }

  changeRetaliatePersistent(index: number, value: number, range: number, remove: boolean = false) {
    if (!this.component.entityRetaliatePersistent[index]) {
      this.component.entityRetaliatePersistent[index] = new Action(ActionType.retaliate, 0);
    }
    if (!this.component.entityRetaliateRangePersistent[index]) {
      this.component.entityRetaliateRangePersistent[index] = new Action(ActionType.range, 1);
      this.component.entityRetaliateRangePersistent[index].small = true;
    }

    this.component.entityRetaliatePersistent[index].value =
      EntityValueFunction(this.component.entityRetaliatePersistent[index].value) + value;
    this.component.entityRetaliateRangePersistent[index].value =
      EntityValueFunction(this.component.entityRetaliateRangePersistent[index].value) + range;

    if (remove && this.component.entityRetaliatePersistent.length > 1) {
      this.component.entityRetaliatePersistent.splice(index, 1);
      this.component.entityRetaliateRangePersistent.splice(index, 1);
    }

    this.component.ghsManager.triggerUiChange();
  }

  close() {
    const shieldValue = this.component.entityShield.value;
    if (
      this.component.entities.some(
        (entity) =>
          (EntityValueFunction(shieldValue) !== 0 && !this.shieldAction(entity, false)) ||
          (this.shieldAction(entity, false) &&
            this.effectiveActionValue(this.shieldAction(entity, false)) !== EntityValueFunction(shieldValue))
      )
    ) {
      this.component.before('changeShield', shieldValue);
      this.component.entities.forEach((entity) => {
        if (
          (entity instanceof Character && settingsManager.settings.characterShieldRetaliate) ||
          (!(entity instanceof Character) && settingsManager.settings.standeeShieldRetaliate)
        ) {
          this.setShieldAction(entity, false, shieldValue, !this.component.entity && !!this.shieldAction(entity, false));
        }
      });
      gameManager.stateManager.after();
    }

    const shieldPersistentValue = this.component.entityShieldPersistent.value;
    if (
      this.component.entities.some(
        (entity) =>
          (EntityValueFunction(shieldPersistentValue) !== 0 && !this.shieldAction(entity, true)) ||
          (this.shieldAction(entity, true) &&
            this.effectiveActionValue(this.shieldAction(entity, true)) !== EntityValueFunction(shieldPersistentValue))
      )
    ) {
      this.component.before('changeShieldPersistent', shieldPersistentValue);
      this.component.entities.forEach((entity) => {
        if (
          (entity instanceof Character && settingsManager.settings.characterShieldRetaliate) ||
          (!(entity instanceof Character) && settingsManager.settings.standeeShieldRetaliate)
        ) {
          this.setShieldAction(entity, true, shieldPersistentValue, !this.component.entity && !!this.shieldAction(entity, true));
        }
      });
      gameManager.stateManager.after();
    }

    const retaliate = this.component.entityRetaliate.map((action, index) =>
      this.createRetaliateAction(action.value, this.component.entityRetaliateRange[index]?.value || 1)
    );

    if (
      retaliate.length > 0 &&
      retaliate.some((retaliateAction) =>
        this.component.entities.some(
          (entity) =>
            (EntityValueFunction(retaliateAction.value) > 0 &&
              !this.retaliateActions(entity, false).some((action) => JSON.stringify(retaliateAction) === JSON.stringify(action))) ||
            (this.retaliateActions(entity, false).length &&
              this.retaliateActions(entity, false).some(
                (action) =>
                  JSON.stringify(action.subActions) === JSON.stringify(retaliateAction.subActions) &&
                  EntityValueFunction(action.value) !== EntityValueFunction(retaliateAction.value)
              ))
        )
      )
    ) {
      this.component.before(
        'changeRetaliate',
        retaliate
          .map(
            (action) =>
              '%game.action.retaliate% ' +
              EntityValueFunction(action.value) +
              (action.subActions &&
              action.subActions[0] &&
              action.subActions[0].type === ActionType.range &&
              EntityValueFunction(action.subActions[0].value) > 1
                ? ' %game.action.range% ' + EntityValueFunction(action.subActions[0].value)
                : '')
          )
          .join(', ')
      );
      this.component.entities.forEach((entity) => {
        if (
          (entity instanceof Character && settingsManager.settings.characterShieldRetaliate) ||
          (!(entity instanceof Character) && settingsManager.settings.standeeShieldRetaliate)
        ) {
          this.setRetaliateActions(entity, false, retaliate, !this.component.entity && this.retaliateActions(entity, false).length > 0);
        }
      });

      gameManager.stateManager.after();
    }

    const retaliatePersistent = this.component.entityRetaliatePersistent.map((action, index) =>
      this.createRetaliateAction(action.value, this.component.entityRetaliateRangePersistent[index]?.value || 1)
    );

    if (
      retaliatePersistent.length > 0 &&
      retaliatePersistent.some((retaliatePersitentAction) =>
        this.component.entities.some(
          (entity) =>
            (EntityValueFunction(retaliatePersitentAction.value) > 0 &&
              !this.retaliateActions(entity, true).some((action) => JSON.stringify(retaliatePersitentAction) === JSON.stringify(action))) ||
            (this.retaliateActions(entity, true).length &&
              this.retaliateActions(entity, true).some(
                (action) =>
                  JSON.stringify(action.subActions) === JSON.stringify(retaliatePersitentAction.subActions) &&
                  EntityValueFunction(action.value) !== EntityValueFunction(retaliatePersitentAction.value)
              ))
        )
      )
    ) {
      this.component.before(
        'changeRetaliatePersistent',
        retaliatePersistent
          .map(
            (action) =>
              '%game.action.retaliate% ' +
              EntityValueFunction(action.value) +
              (action.subActions &&
              action.subActions[0] &&
              action.subActions[0].type === ActionType.range &&
              EntityValueFunction(action.subActions[0].value) > 1
                ? ' %game.action.range% ' + EntityValueFunction(action.subActions[0].value)
                : '')
          )
          .join(', ')
      );
      this.component.entities.forEach((entity) => {
        if (
          (entity instanceof Character && settingsManager.settings.characterShieldRetaliate) ||
          (!(entity instanceof Character) && settingsManager.settings.standeeShieldRetaliate)
        ) {
          this.setRetaliateActions(
            entity,
            true,
            retaliatePersistent,
            !this.component.entity && this.retaliateActions(entity, true).length > 0
          );
        }
      });

      gameManager.stateManager.after();
    }
  }
}
