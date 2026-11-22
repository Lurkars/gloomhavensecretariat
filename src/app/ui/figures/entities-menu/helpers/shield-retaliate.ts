import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Monster } from 'src/app/game/model/Monster';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';

export class ShieldRetaliateHelper {
  private initialTaunt: boolean = false;
  private initialTauntPersistent: boolean = false;

  constructor(private component: EntitiesMenuDialogComponent) {}

  private shieldChanged(entities: any[], persistent: boolean, value: string | number): boolean {
    const numericValue = EntityValueFunction(value);
    if (!this.component.entity) {
      return numericValue !== 0 && entities.length > 0;
    }
    return entities.some(
      (entity) =>
        gameManager.shieldRetaliateManager.effectiveValue(gameManager.shieldRetaliateManager.shieldAction(entity, persistent)) !==
        numericValue
    );
  }

  private retaliateChanged(entities: any[], persistent: boolean, retaliate: Action[]): boolean {
    if (!this.component.entity) {
      return entities.length > 0 && retaliate.some((retaliateAction) => EntityValueFunction(retaliateAction.value) !== 0);
    }
    return retaliate.some((retaliateAction) =>
      entities.some(
        (entity) =>
          (EntityValueFunction(retaliateAction.value) > 0 &&
            !gameManager.shieldRetaliateManager
              .retaliateActions(entity, persistent)
              .some((action) => JSON.stringify(retaliateAction) === JSON.stringify(action))) ||
          gameManager.shieldRetaliateManager
            .retaliateActions(entity, persistent)
            .some(
              (action) =>
                JSON.stringify(action.subActions) === JSON.stringify(retaliateAction.subActions) &&
                EntityValueFunction(action.value) !== EntityValueFunction(retaliateAction.value)
            )
      )
    );
  }

  private retaliateLabel(retaliate: Action[]): string {
    return retaliate
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
      .join(', ');
  }

  update() {
    this.component.shieldAndRetaliate =
      (settingsManager.settings.characterShieldRetaliate &&
        (this.component.figures.find((figure) => figure instanceof Character) !== undefined ||
          this.component.figures.find((figure) => figure instanceof ObjectiveContainer && figure.escort) !== undefined)) ||
      (settingsManager.settings.standeeShieldRetaliate && this.component.figures.find((figure) => figure instanceof Monster) !== undefined);

    this.component.taunt = this.component.shieldAndRetaliate && gameManager.rpgRules();
    if (this.component.taunt) {
      const entities = this.component.applicableEntities.filter((entity) => gameManager.shieldRetaliateManager.enabled(entity));
      this.initialTaunt = entities.length > 0 && entities.every((entity) => gameManager.shieldRetaliateManager.hasTaunt(entity, false));
      this.initialTauntPersistent =
        entities.length > 0 && entities.every((entity) => gameManager.shieldRetaliateManager.hasTaunt(entity, true));
      this.component.entityTaunt = this.initialTaunt;
      this.component.entityTauntPersistent = this.initialTauntPersistent;
    }

    if (this.component.shieldAndRetaliate && this.component.entity) {
      this.component.entityShield.value = gameManager.shieldRetaliateManager.effectiveValue(
        gameManager.shieldRetaliateManager.shieldAction(this.component.entity, false)
      );
      this.component.entityShieldPersistent.value = gameManager.shieldRetaliateManager.effectiveValue(
        gameManager.shieldRetaliateManager.shieldAction(this.component.entity, true)
      );

      const retaliate = gameManager.shieldRetaliateManager.retaliateActions(this.component.entity, false);
      this.component.entityRetaliate = retaliate.length
        ? retaliate.map((action) => new Action(ActionType.retaliate, gameManager.shieldRetaliateManager.effectiveValue(action)))
        : [new Action(ActionType.retaliate, 0)];
      this.component.entityRetaliateRange = retaliate.length
        ? retaliate.map((action) => gameManager.shieldRetaliateManager.rangeAction(gameManager.shieldRetaliateManager.rangeValue(action)))
        : [gameManager.shieldRetaliateManager.rangeAction()];

      const retaliatePersistent = gameManager.shieldRetaliateManager.retaliateActions(this.component.entity, true);
      this.component.entityRetaliatePersistent = retaliatePersistent.length
        ? retaliatePersistent.map((action) => new Action(ActionType.retaliate, gameManager.shieldRetaliateManager.effectiveValue(action)))
        : [new Action(ActionType.retaliate, 0)];
      this.component.entityRetaliateRangePersistent = retaliatePersistent.length
        ? retaliatePersistent.map((action) =>
            gameManager.shieldRetaliateManager.rangeAction(gameManager.shieldRetaliateManager.rangeValue(action))
          )
        : [gameManager.shieldRetaliateManager.rangeAction()];
    }
  }

  toggleTaunt(persistent: boolean) {
    if (persistent) {
      this.component.entityTauntPersistent = !this.component.entityTauntPersistent;
    } else {
      this.component.entityTaunt = !this.component.entityTaunt;
    }
    this.component.ghsManager.triggerUiChange();
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
    const applicableEntities = this.component.applicableEntities;

    if (this.component.taunt) {
      [false, true].forEach((persistent) => {
        const value = persistent ? this.component.entityTauntPersistent : this.component.entityTaunt;
        const initial = persistent ? this.initialTauntPersistent : this.initialTaunt;
        if (value !== initial) {
          this.component.before(value ? 'addTaunt' : 'removeTaunt', persistent ? '%game.card.persistent% ' : '');
          applicableEntities
            .filter((entity) => gameManager.shieldRetaliateManager.enabled(entity))
            .forEach((entity) => gameManager.shieldRetaliateManager.setTaunt(entity, persistent, value));
          gameManager.stateManager.after();
        }
      });
    }

    const entities = applicableEntities.filter((entity) => gameManager.shieldRetaliateManager.enabled(entity));

    [false, true].forEach((persistent) => {
      const shieldValue = persistent ? this.component.entityShieldPersistent.value : this.component.entityShield.value;
      if (this.shieldChanged(entities, persistent, shieldValue)) {
        this.component.before(persistent ? 'changeShieldPersistent' : 'changeShield', shieldValue);
        entities.forEach((entity) =>
          gameManager.shieldRetaliateManager.setShield(
            entity,
            persistent,
            shieldValue,
            !this.component.entity && !!gameManager.shieldRetaliateManager.shieldAction(entity, persistent)
          )
        );
        gameManager.stateManager.after();
      }
    });

    [false, true].forEach((persistent) => {
      const retaliate = (persistent ? this.component.entityRetaliatePersistent : this.component.entityRetaliate).map((action, index) =>
        gameManager.shieldRetaliateManager.retaliateAction(
          action.value,
          (persistent ? this.component.entityRetaliateRangePersistent : this.component.entityRetaliateRange)[index]?.value || 1
        )
      );
      if (retaliate.length > 0 && this.retaliateChanged(entities, persistent, retaliate)) {
        this.component.before(persistent ? 'changeRetaliatePersistent' : 'changeRetaliate', this.retaliateLabel(retaliate));
        entities.forEach((entity) =>
          gameManager.shieldRetaliateManager.setRetaliate(
            entity,
            persistent,
            retaliate,
            !this.component.entity && gameManager.shieldRetaliateManager.retaliateActions(entity, persistent).length > 0
          )
        );
        gameManager.stateManager.after();
      }
    });
  }
}
