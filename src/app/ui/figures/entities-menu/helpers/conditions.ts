import { gameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { ConditionName, ConditionType, EntityConditionState } from "src/app/game/model/data/Condition";
import type { EntitiesMenuDialogComponent } from '../entities-menu-dialog';

export class ConditionHelper {

    constructor(private component: EntitiesMenuDialogComponent) { }

    update() {
        this.component.entityConditions = [];

        this.component.entities.forEach((entity, index, self) => {
            entity.entityConditions.forEach((entityCondition) => {
                if (!this.component.entityConditions.find((other) => other.name == entityCondition.name) && self.every((otherEntity) => otherEntity.entityConditions.find((other) => other.name == entityCondition.name && other.state == entityCondition.state))) {
                    this.component.entityConditions.push(JSON.parse(JSON.stringify(entityCondition)));
                }
            })

            entity.immunities.forEach((immunity) => {
                if (!this.component.entityImmunities.find((other) => other == immunity) && self.every((otherEntity) => otherEntity.immunities.find((other) => other == immunity))) {
                    this.component.entityImmunities.push(immunity);
                    this.component.initialImmunities.push(immunity);
                }
            })
        })
    }

    close() {
        this.component.initialImmunities.filter((immunity) => !this.component.entityImmunities.includes(immunity)).forEach((immunity) => {
            this.component.before('removeImmunity', immunity);
            this.component.entities.forEach((entity) => {
                entity.immunities = entity.immunities.filter((existing) => existing != immunity);
            })
            gameManager.stateManager.after();
        })

        this.component.entityImmunities.filter((immunity) => !this.component.initialImmunities.includes(immunity)).forEach((immunity) => {
            this.component.before('addImmunity', immunity);
            this.component.entities.forEach((entity) => {
                entity.immunities.push(immunity);
            })
            gameManager.stateManager.after();
        })

        this.component.entityConditions.filter((entityCondition) => entityCondition.state == EntityConditionState.new && this.component.entities.some((entity) => !gameManager.entityManager.isImmune(entity, this.component.figureForEntity(entity), entityCondition.name)) || (entityCondition.state == EntityConditionState.roundExpire && !entityCondition.expired || entityCondition.state == EntityConditionState.expire && !entityCondition.expired) && this.component.entities.some((entity) => !entity.entityConditions.some((condition) => condition.name == entityCondition.name && condition.state == entityCondition.state)) || entityCondition.state == EntityConditionState.removed && this.component.entities.some((entity) => gameManager.entityManager.hasCondition(entity, entityCondition, entityCondition.permanent))).forEach((entityCondition) => {
            this.component.before(entityCondition.state == EntityConditionState.removed ? "removeCondition" : "addCondition", entityCondition.name);
            this.component.entities.forEach((entity) => {
                const figure = this.component.figureForEntity(entity);
                if (entityCondition.state == EntityConditionState.new || entityCondition.state == EntityConditionState.roundExpire || entityCondition.state == EntityConditionState.expire || gameManager.entityManager.hasCondition(entity, entityCondition, entityCondition.permanent)) {
                    if (entity instanceof Character && entityCondition.name == ConditionName.muddle && entityCondition.state == EntityConditionState.new &&
                        entity.progress.equippedItems.find((identifier) => identifier.edition == 'gh' && identifier.name == '108')) {
                        entityCondition.name = ConditionName.strengthen;
                    }

                    entityCondition.expired = entityCondition.state == EntityConditionState.new;

                    if (entityCondition.state == EntityConditionState.removed) {
                        gameManager.entityManager.removeCondition(entity, figure, entityCondition, entityCondition.permanent);
                    } else if (!gameManager.entityManager.isImmune(entity, figure, entityCondition.name)) {
                        if (entityCondition.state == EntityConditionState.new || !gameManager.entityManager.hasCondition(entity, entityCondition, entityCondition.permanent)) {
                            gameManager.entityManager.addCondition(entity, figure, entityCondition, entityCondition.permanent);
                        }

                        if (entityCondition.state == EntityConditionState.roundExpire || entityCondition.state == EntityConditionState.expire) {
                            entity.entityConditions.forEach((condition) => {
                                if (condition.name == entityCondition.name && !entityCondition.expired) {
                                    condition.state = entityCondition.state;
                                    condition.lastState = entityCondition.lastState;
                                }
                            })
                        }

                        if (entity instanceof Character && entity.name == 'shackles' && !entity.absent && entity.tags.includes('delayed_malady') && entityCondition.types.includes(ConditionType.negative) && !entity.immunities.includes(entityCondition.name)) {
                            entity.immunities.push(entityCondition.name);
                            this.component.entityImmunities.push(entityCondition.name);
                        }
                    }
                }
            })
            gameManager.stateManager.after();

        })

        this.component.entityConditions.filter((condition) => this.component.entities.some((entity) => {
            const entityCondition = entity.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired);
            return condition.types.includes(ConditionType.stack) || condition.types.includes(ConditionType.upgrade) && entityCondition && entityCondition.value != condition.value;
        })).forEach((condition) => {
            this.component.before('setConditionValue', condition.name, condition.value);
            this.component.entities.forEach((entity) => {
                const entityCondition = entity.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired);
                if ((condition.types.includes(ConditionType.stack) || condition.types.includes(ConditionType.upgrade)) && entityCondition && entityCondition.value != condition.value) {
                    entityCondition.value = condition.value;
                }
            })
            gameManager.stateManager.after();
        })
    }
}
