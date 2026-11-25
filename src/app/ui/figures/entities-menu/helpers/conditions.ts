import { gameManager } from 'src/app/game/businesslogic/Managers';
import { ConditionType, EntityCondition, EntityConditionState } from 'src/app/game/model/data/Condition';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';

export class ConditionHelper {
  constructor(private component: EntitiesMenuDialogComponent) {}

  update() {
    this.component.entityConditions = [];
    this.component.entityImmunities = [];
    this.component.initialImmunities = [];

    this.component.applicableEntities.forEach((entity, index, self) => {
      entity.entityConditions.forEach((entityCondition) => {
        const existing = this.component.entityConditions.find((other) => other.name === entityCondition.name);
        if (
          !existing &&
          self.every((otherEntity) =>
            otherEntity.entityConditions.find(
              (other) =>
                other.name === entityCondition.name &&
                other.state === entityCondition.state &&
                other.permanent === entityCondition.permanent &&
                (!entityCondition.types.includes(ConditionType.upgrade) || other.value === entityCondition.value)
            )
          )
        ) {
          const condition = new EntityCondition(entityCondition.name, entityCondition.value);
          condition.state = entityCondition.state;
          condition.lastState = entityCondition.lastState;
          condition.permanent = entityCondition.permanent;
          if (condition.types.includes(ConditionType.stack)) {
            condition.value = 0;
          }
          this.component.entityConditions.push(condition);
        }
      });

      entity.immunities.forEach((immunity) => {
        if (
          !this.component.entityImmunities.find((other) => other === immunity) &&
          self.every((otherEntity) => otherEntity.immunities.find((other) => other === immunity))
        ) {
          this.component.entityImmunities.push(immunity);
          this.component.initialImmunities.push(immunity);
        }
      });
    });
  }

  close() {
    const applicableEntities = this.component.applicableEntities;

    this.component.initialImmunities
      .filter((immunity) => !this.component.entityImmunities.includes(immunity))
      .forEach((immunity) => {
        this.component.before('removeImmunity', immunity);
        gameManager.conditionManager.setImmunity(applicableEntities, immunity, false);
        gameManager.stateManager.after();
      });

    this.component.entityImmunities
      .filter((immunity) => !this.component.initialImmunities.includes(immunity))
      .forEach((immunity) => {
        this.component.before('addImmunity', immunity);
        gameManager.conditionManager.setImmunity(applicableEntities, immunity, true);
        gameManager.stateManager.after();
      });

    this.component.entityConditions
      .filter(
        (condition) =>
          condition.types.includes(ConditionType.stack) &&
          condition.state !== EntityConditionState.new &&
          condition.value != 0 &&
          applicableEntities.some((entity) =>
            entity.entityConditions.find((entityCondition) => entityCondition.name === condition.name && !entityCondition.expired)
          )
      )
      .forEach((condition) => {
        this.component.before('setConditionValue', condition.name, condition.value);
        applicableEntities.forEach((entity) => {
          const figure = this.component.figureForEntity(entity);
          const entityCondition = entity.entityConditions.find(
            (entityCondition) => entityCondition.name === condition.name && !entityCondition.expired
          );
          if (condition.types.includes(ConditionType.stack) && entityCondition) {
            gameManager.conditionManager.setConditionValue(
              entity,
              figure,
              condition.name,
              Math.max(0, entityCondition.value + condition.value)
            );
          }
        });
        gameManager.stateManager.after();
      });

    this.component.entityConditions
      .filter(
        (condition) =>
          condition.types.includes(ConditionType.upgrade) &&
          condition.value > 0 &&
          ![EntityConditionState.new, EntityConditionState.removed].includes(condition.state)
      )
      .filter((condition) => {
        const sample = applicableEntities[0]?.entityConditions.find(
          (entityCondition) => entityCondition.name === condition.name && !entityCondition.expired
        );
        return (
          sample &&
          sample.value !== condition.value &&
          applicableEntities.every((entity) =>
            entity.entityConditions.some(
              (entityCondition) =>
                entityCondition.name === condition.name && !entityCondition.expired && entityCondition.value === sample.value
            )
          )
        );
      })
      .forEach((condition) => {
        this.component.before('setConditionValue', condition.name, condition.value);
        applicableEntities.forEach((entity) => {
          const figure = this.component.figureForEntity(entity);
          const entityCondition = entity.entityConditions.find(
            (entityCondition) => entityCondition.name === condition.name && !entityCondition.expired
          );
          if (entityCondition) {
            gameManager.conditionManager.setConditionValue(entity, figure, condition.name, condition.value);
          } else {
            gameManager.conditionManager.addCondition(entity, figure, condition);
          }
        });
        gameManager.stateManager.after();
      });

    this.component.entityConditions
      .filter(
        (entityCondition) =>
          (entityCondition.state === EntityConditionState.new &&
            applicableEntities.some(
              (entity) => !gameManager.conditionManager.isImmune(entity, this.component.figureForEntity(entity), entityCondition.name)
            ) &&
            entityCondition.value >= 0) ||
          (((entityCondition.state === EntityConditionState.roundExpire && !entityCondition.expired) ||
            (entityCondition.state === EntityConditionState.expire && !entityCondition.expired)) &&
            applicableEntities.some(
              (entity) =>
                !entity.entityConditions.some(
                  (condition) => condition.name === entityCondition.name && condition.state === entityCondition.state
                )
            )) ||
          (entityCondition.state === EntityConditionState.removed &&
            applicableEntities.some((entity) =>
              gameManager.conditionManager.hasCondition(entity, entityCondition, entityCondition.permanent)
            ))
      )
      .forEach((entityCondition) => {
        this.component.before(
          entityCondition.state === EntityConditionState.removed ? 'removeCondition' : 'addCondition',
          entityCondition.name
        );
        applicableEntities.forEach((entity) => {
          const figure = this.component.figureForEntity(entity);
          if (
            entityCondition.state === EntityConditionState.new ||
            entityCondition.state === EntityConditionState.roundExpire ||
            entityCondition.state === EntityConditionState.expire ||
            gameManager.conditionManager.hasCondition(entity, entityCondition, entityCondition.permanent)
          ) {
            if (entityCondition.state === EntityConditionState.new) {
              gameManager.conditionManager.manualCondition(entity, entityCondition);
            }

            entityCondition.expired = entityCondition.state === EntityConditionState.new;

            if (entityCondition.state === EntityConditionState.removed) {
              gameManager.conditionManager.removeCondition(entity, figure, entityCondition, entityCondition.permanent);
            } else {
              const suspended = gameManager.specialActionsManager.isConditionSuspended(entity, entityCondition);
              if (
                entityCondition.state === EntityConditionState.new ||
                !gameManager.conditionManager.hasCondition(entity, entityCondition, entityCondition.permanent)
              ) {
                gameManager.conditionManager.addCondition(entity, figure, entityCondition, entityCondition.permanent, suspended);
              }

              if (entityCondition.state === EntityConditionState.roundExpire || entityCondition.state === EntityConditionState.expire) {
                entity.entityConditions.forEach((condition) => {
                  if (condition.name === entityCondition.name && !entityCondition.expired) {
                    condition.state = entityCondition.state;
                    condition.lastState = entityCondition.lastState;
                  }
                });
              }

              if (suspended && !entity.immunities.includes(entityCondition.name)) {
                gameManager.conditionManager.setImmunity([entity], entityCondition.name, true);
                this.component.entityImmunities.push(entityCondition.name);
              }
            }
          }
        });
        gameManager.stateManager.after();
      });
  }
}
