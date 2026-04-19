import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Monster } from 'src/app/game/model/Monster';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';

export class ShieldRetaliateHelper {
  constructor(private component: EntitiesMenuDialogComponent) {}

  update() {
    this.component.shieldAndRetaliate =
      (settingsManager.settings.characterShieldRetaliate &&
        (this.component.figures.find((figure) => figure instanceof Character) !== undefined ||
          this.component.figures.find((figure) => figure instanceof ObjectiveContainer && figure.escort) !== undefined)) ||
      (settingsManager.settings.standeeShieldRetaliate && this.component.figures.find((figure) => figure instanceof Monster) !== undefined);

    if (this.component.shieldAndRetaliate && this.component.entity) {
      if (this.component.entity.shield) {
        this.component.entityShield.value = this.component.entity.shield.value;
      }

      if (this.component.entity.shieldPersistent) {
        this.component.entityShieldPersistent.value = this.component.entity.shieldPersistent.value;
      }

      this.component.entity.retaliate.forEach((retaliate, index) => {
        if (!this.component.entityRetaliate[index]) {
          this.component.entityRetaliate[index] = new Action(ActionType.retaliate, retaliate.value);
        } else {
          this.component.entityRetaliate[index].value = retaliate.value;
        }

        if (!this.component.entityRetaliateRange[index]) {
          this.component.entityRetaliateRange[index] = new Action(ActionType.range, 1);
          this.component.entityRetaliateRange[index].small = true;
        }

        const rangeSubAction = retaliate.subActions.find((subAction) => subAction.type === ActionType.range);
        if (rangeSubAction) {
          this.component.entityRetaliateRange[index].value = rangeSubAction.value;
        }
      });

      this.component.entity.retaliatePersistent.forEach((retaliate, index) => {
        if (!this.component.entityRetaliatePersistent[index]) {
          this.component.entityRetaliatePersistent[index] = new Action(ActionType.retaliate, retaliate.value);
        } else {
          this.component.entityRetaliatePersistent[index].value = retaliate.value;
        }

        if (!this.component.entityRetaliateRangePersistent[index]) {
          this.component.entityRetaliateRangePersistent[index] = new Action(ActionType.range, 1);
          this.component.entityRetaliateRangePersistent[index].small = true;
        }

        const rangeSubAction = retaliate.subActions.find((subAction) => subAction.type === ActionType.range);
        if (rangeSubAction) {
          this.component.entityRetaliateRangePersistent[index].value = rangeSubAction.value;
        }
      });
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
    if (
      this.component.entities.some(
        (entity) =>
          (EntityValueFunction(this.component.entityShield.value) > 0 && !entity.shield) ||
          (entity.shield && EntityValueFunction(entity.shield.value) !== EntityValueFunction(this.component.entityShield.value))
      )
    ) {
      this.component.before('changeShield', this.component.entityShield.value);
      this.component.entities.forEach((entity) => {
        if (
          (entity instanceof Character && settingsManager.settings.characterShieldRetaliate) ||
          (!(entity instanceof Character) && settingsManager.settings.standeeShieldRetaliate)
        ) {
          if (!this.component.entity && entity.shield) {
            entity.shield.value = EntityValueFunction(entity.shield.value) + EntityValueFunction(this.component.entityShield.value);
          } else {
            entity.shield = gameManager.actionsManager.copyAction(this.component.entityShield);
          }
          if (EntityValueFunction(entity.shield.value) <= 0) {
            entity.shield = undefined;
          }
        }
      });
      gameManager.stateManager.after();
    }
    if (
      this.component.entities.some(
        (entity) =>
          (EntityValueFunction(this.component.entityShieldPersistent.value) > 0 && !entity.shieldPersistent) ||
          (entity.shieldPersistent &&
            EntityValueFunction(entity.shieldPersistent.value) !== EntityValueFunction(this.component.entityShieldPersistent.value))
      )
    ) {
      this.component.before('changeShieldPersistent', this.component.entityShieldPersistent.value);
      this.component.entities.forEach((entity) => {
        if (
          (entity instanceof Character && settingsManager.settings.characterShieldRetaliate) ||
          (!(entity instanceof Character) && settingsManager.settings.standeeShieldRetaliate)
        ) {
          if (!this.component.entity && entity.shieldPersistent) {
            entity.shieldPersistent.value =
              EntityValueFunction(entity.shieldPersistent.value) + EntityValueFunction(this.component.entityShieldPersistent.value);
          } else {
            entity.shieldPersistent = gameManager.actionsManager.copyAction(this.component.entityShieldPersistent);
          }
          if (EntityValueFunction(entity.shieldPersistent.value) <= 0) {
            entity.shieldPersistent = undefined;
          }
        }
      });
      gameManager.stateManager.after();
    }

    const retaliate = this.component.entityRetaliate.map((action, index) => {
      const retaliateAction = new Action(ActionType.retaliate, action.value);
      retaliateAction.subActions = action.subActions || [];
      if (this.component.entityRetaliateRange[index] && this.component.entityRetaliateRange[index].value !== 1) {
        retaliateAction.subActions.unshift(this.component.entityRetaliateRange[index]);
      }
      return retaliateAction;
    });

    if (
      retaliate.length > 0 &&
      retaliate.some((retaliateAction) =>
        this.component.entities.some(
          (entity) =>
            (EntityValueFunction(retaliateAction.value) > 0 &&
              !entity.retaliate.some((action) => JSON.stringify(retaliateAction) === JSON.stringify(action))) ||
            (entity.retaliate.length &&
              entity.retaliate.some(
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
          if (!this.component.entity && entity.retaliate) {
            retaliate.forEach((retaliateAction) => {
              const existing = entity.retaliate.find(
                (action) => JSON.stringify(action.subActions) === JSON.stringify(retaliateAction.subActions)
              );
              if (existing) {
                existing.value = EntityValueFunction(existing.value) + EntityValueFunction(retaliateAction.value);
              } else {
                entity.retaliate.push(gameManager.actionsManager.copyAction(retaliateAction));
              }
            });
          } else {
            entity.retaliate = retaliate.map((retaliateAction) => gameManager.actionsManager.copyAction(retaliateAction));
          }

          entity.retaliate = entity.retaliate.filter((action) => EntityValueFunction(action.value) > 0);
        }
      });

      gameManager.stateManager.after();
    }

    const retaliatePersistent = this.component.entityRetaliatePersistent.map((action, index) => {
      const retaliateAction = new Action(ActionType.retaliate, action.value);
      retaliateAction.subActions = [];
      if (this.component.entityRetaliateRangePersistent[index] && this.component.entityRetaliateRangePersistent[index].value !== 1) {
        retaliateAction.subActions.push(this.component.entityRetaliateRangePersistent[index]);
      }
      return retaliateAction;
    });

    if (
      retaliatePersistent.length > 0 &&
      retaliatePersistent.some((retaliatePersitentAction) =>
        this.component.entities.some(
          (entity) =>
            (EntityValueFunction(retaliatePersitentAction.value) > 0 &&
              !entity.retaliatePersistent.some((action) => JSON.stringify(retaliatePersitentAction) === JSON.stringify(action))) ||
            (entity.retaliatePersistent.length &&
              entity.retaliatePersistent.some(
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
          if (!this.component.entity && entity.retaliatePersistent) {
            retaliatePersistent.forEach((retaliateAction) => {
              const existing = entity.retaliatePersistent.find(
                (action) => JSON.stringify(action.subActions) === JSON.stringify(retaliateAction.subActions)
              );
              if (existing) {
                existing.value = EntityValueFunction(existing.value) + EntityValueFunction(retaliateAction.value);
              } else {
                entity.retaliatePersistent.push(gameManager.actionsManager.copyAction(retaliateAction));
              }
            });
          } else {
            entity.retaliatePersistent = retaliatePersistent.map((retaliateAction) =>
              gameManager.actionsManager.copyAction(retaliateAction)
            );
          }

          entity.retaliatePersistent = entity.retaliatePersistent.filter((action) => EntityValueFunction(action.value) > 0);
        }
      });

      gameManager.stateManager.after();
    }
  }
}
