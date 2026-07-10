import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { ConditionName, ConditionType, EntityCondition, EntityConditionState } from 'src/app/game/model/data/Condition';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';

export class ConditionHelper {
  constructor(private component: EntitiesMenuDialogComponent) {}

  update() {
    this.component.entityConditions = [];
    this.component.entityImmunities = [];
    this.component.initialImmunities = [];

    this.component.entities.forEach((entity, index, self) => {
      entity.entityConditions.forEach((entityCondition) => {
        const existing = this.component.entityConditions.find((other) => other.name === entityCondition.name);
        if (
          !existing &&
          self.every((otherEntity) =>
            otherEntity.entityConditions.find(
              (other) =>
                other.name === entityCondition.name &&
                other.state === entityCondition.state &&
                (!entityCondition.types.includes(ConditionType.upgrade) || other.value === entityCondition.value)
            )
          )
        ) {
          const condition = new EntityCondition(entityCondition.name, entityCondition.value);
          condition.state = entityCondition.state;
          condition.lastState = entityCondition.lastState;
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
    this.component.initialImmunities
      .filter((immunity) => !this.component.entityImmunities.includes(immunity))
      .forEach((immunity) => {
        this.component.before('removeImmunity', immunity);
        this.component.entities.forEach((entity) => {
          entity.immunities = entity.immunities.filter((existing) => existing !== immunity);
        });
        gameManager.stateManager.after();
      });

    this.component.entityImmunities
      .filter((immunity) => !this.component.initialImmunities.includes(immunity))
      .forEach((immunity) => {
        this.component.before('addImmunity', immunity);
        this.component.entities.forEach((entity) => {
          entity.immunities.push(immunity);
        });
        gameManager.stateManager.after();
      });

    this.component.entityConditions
      .filter(
        (condition) =>
          condition.types.includes(ConditionType.stack) &&
          condition.state !== EntityConditionState.new &&
          condition.value != 0 &&
          this.component.entities.some((entity) =>
            entity.entityConditions.find((entityCondition) => entityCondition.name === condition.name && !entityCondition.expired)
          )
      )
      .forEach((condition) => {
        this.component.before('setConditionValue', condition.name, condition.value);
        this.component.entities.forEach((entity) => {
          const figure = this.component.figureForEntity(entity);
          const entityCondition = entity.entityConditions.find(
            (entityCondition) => entityCondition.name === condition.name && !entityCondition.expired
          );
          if (condition.types.includes(ConditionType.stack) && entityCondition) {
            if (condition.value < 0) {
              entityCondition.value += condition.value;
            } else if (condition.value > 0) {
              gameManager.entityManager.addCondition(entity, figure, condition);
            }
            if (entityCondition.value <= 0) {
              gameManager.entityManager.removeCondition(entity, figure, entityCondition);
            }
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
        const sample = this.component.entities[0]?.entityConditions.find(
          (entityCondition) => entityCondition.name === condition.name && !entityCondition.expired
        );
        return (
          sample &&
          sample.value !== condition.value &&
          this.component.entities.every((entity) =>
            entity.entityConditions.some(
              (entityCondition) =>
                entityCondition.name === condition.name && !entityCondition.expired && entityCondition.value === sample.value
            )
          )
        );
      })
      .forEach((condition) => {
        this.component.before('setConditionValue', condition.name, condition.value);
        this.component.entities.forEach((entity) => {
          const figure = this.component.figureForEntity(entity);
          const entityCondition = entity.entityConditions.find(
            (entityCondition) => entityCondition.name === condition.name && !entityCondition.expired
          );
          if (entityCondition && condition.value < entityCondition.value) {
            entityCondition.value = condition.value;
          } else {
            gameManager.entityManager.addCondition(entity, figure, condition);
          }
        });
        gameManager.stateManager.after();
      });

    this.component.entityConditions
      .filter(
        (entityCondition) =>
          (entityCondition.state === EntityConditionState.new &&
            this.component.entities.some(
              (entity) => !gameManager.entityManager.isImmune(entity, this.component.figureForEntity(entity), entityCondition.name)
            ) &&
            entityCondition.value >= 0) ||
          (((entityCondition.state === EntityConditionState.roundExpire && !entityCondition.expired) ||
            (entityCondition.state === EntityConditionState.expire && !entityCondition.expired)) &&
            this.component.entities.some(
              (entity) =>
                !entity.entityConditions.some(
                  (condition) => condition.name === entityCondition.name && condition.state === entityCondition.state
                )
            )) ||
          (entityCondition.state === EntityConditionState.removed &&
            this.component.entities.some((entity) =>
              gameManager.entityManager.hasCondition(entity, entityCondition, entityCondition.permanent)
            ))
      )
      .forEach((entityCondition) => {
        this.component.before(
          entityCondition.state === EntityConditionState.removed ? 'removeCondition' : 'addCondition',
          entityCondition.name
        );
        this.component.entities.forEach((entity) => {
          const figure = this.component.figureForEntity(entity);
          if (
            entityCondition.state === EntityConditionState.new ||
            entityCondition.state === EntityConditionState.roundExpire ||
            entityCondition.state === EntityConditionState.expire ||
            gameManager.entityManager.hasCondition(entity, entityCondition, entityCondition.permanent)
          ) {
            if (
              entity instanceof Character &&
              entityCondition.name === ConditionName.muddle &&
              entityCondition.state === EntityConditionState.new &&
              entity.progress.equippedItems.find((identifier) => identifier.edition === 'gh' && identifier.name === '108')
            ) {
              entityCondition.name = ConditionName.strengthen;
            }

            entityCondition.expired = entityCondition.state === EntityConditionState.new;

            if (entityCondition.state === EntityConditionState.removed) {
              gameManager.entityManager.removeCondition(entity, figure, entityCondition, entityCondition.permanent);
            } else {
              const shacklesImmunity =
                entity instanceof Character &&
                entity.name === 'shackles' &&
                !entity.absent &&
                entity.tags.includes('delayed_malady') &&
                entityCondition.types.includes(ConditionType.negative) &&
                !entityCondition.types.includes(ConditionType.amDeck);
              if (
                entityCondition.state === EntityConditionState.new ||
                !gameManager.entityManager.hasCondition(entity, entityCondition, entityCondition.permanent)
              ) {
                gameManager.entityManager.addCondition(entity, figure, entityCondition, entityCondition.permanent, shacklesImmunity);
              }

              if (entityCondition.state === EntityConditionState.roundExpire || entityCondition.state === EntityConditionState.expire) {
                entity.entityConditions.forEach((condition) => {
                  if (condition.name === entityCondition.name && !entityCondition.expired) {
                    condition.state = entityCondition.state;
                    condition.lastState = entityCondition.lastState;
                  }
                });
              }

              if (shacklesImmunity && !entity.immunities.includes(entityCondition.name)) {
                entity.immunities.push(entityCondition.name);
                this.component.entityImmunities.push(entityCondition.name);
              }
            }
          }
        });
        gameManager.stateManager.after();
      });
  }
}
