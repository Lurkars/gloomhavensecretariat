import { Condition, ConditionName, ConditionType, EntityCondition, EntityConditionState } from "../model/Condition";
import { Entity, EntityValueFunction } from "../model/Entity";
import { Game } from "../model/Game";

export class EntityManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  changeHealth(entity: Entity, value: number) {
    entity.health += value;

    if (value < 0) {
      entity.entityConditions.filter((entityCondition: EntityCondition) => entityCondition.name == ConditionName.poison || entityCondition.name == ConditionName.poison_x).forEach((entityCondition: EntityCondition, index: number) => {
        setTimeout(() => {
          entityCondition.highlight = true;
          setTimeout(() => {
            entityCondition.highlight = false;
          }, 1000);
        }, 1000 * index);
      })
    } else if (entity.health == entity.maxHealth) {
      entity.entityConditions.filter((entityCondition: EntityCondition) => (entityCondition.name == ConditionName.wound || entityCondition.name == ConditionName.wound_x) && entityCondition.state == EntityConditionState.turn).forEach((entityCondition: EntityCondition, index: number) => {
        setTimeout(() => {
          entityCondition.highlight = true;
          setTimeout(() => {
            entityCondition.highlight = false;
          }, 1000);
        }, 1000 * index);
      })
    }

    if (entity.health > entity.maxHealth) {
      entity.health = EntityValueFunction("" + entity.maxHealth);
    } else if (entity.health < 0) {
      entity.health = 0;
    }
  }

  hasCondition(entity: Entity, condition: Condition) {
    return entity.entityConditions.some((entityCondition: EntityCondition) => entityCondition.name == condition.name && !entityCondition.expired);
  }

  toggleCondition(entity: Entity, condition: Condition, active: boolean, off: boolean) {
    if (!this.hasCondition(entity, condition)) {
      let entityCondition: EntityCondition | undefined = entity.entityConditions.find((entityCondition: EntityCondition) => entityCondition.name == condition.name);
      if (!entityCondition) {
        entityCondition = new EntityCondition(condition.name, condition.value);
        entity.entityConditions.push(entityCondition);
      } else {
        entityCondition.expired = false;
        entityCondition.state = EntityConditionState.normal;
      }

      if (!active && entityCondition.types.indexOf(ConditionType.expire) != -1) {
        entityCondition.state = EntityConditionState.expire;
      }

      if (off && entityCondition.types.indexOf(ConditionType.turn) != -1) {
        entityCondition.state = EntityConditionState.expire;
      }
    } else {
      entity.entityConditions = entity.entityConditions.filter((entityCondition: EntityCondition) => entityCondition.name != condition.name);
    }
  }

  restoreConditions(entity: Entity) {
    entity.entityConditions.forEach((entityCondition: EntityCondition) => {

      if (entityCondition.name == ConditionName.chill) {
        if (entityCondition.expired) {
          entityCondition.expired = false;
        } else {
          entityCondition.value++;
        }
      }

      if (entityCondition.types.indexOf(ConditionType.expire) != -1) {
        if (entityCondition.expired) {
          entityCondition.expired = false;
        } else if (entityCondition.state == EntityConditionState.expire) {
          entityCondition.state = EntityConditionState.normal;
        }
      }
    })

  }

  expireConditions(entity: Entity) {
    entity.entityConditions.forEach((entityCondition: EntityCondition) => {
      if (entityCondition.name == ConditionName.chill) {
        if (entityCondition.value == 1) {
          entityCondition.expired = true;
        } else {
          entityCondition.value--;
        }
      }
    })

    entity.entityConditions.forEach((entityCondition: EntityCondition) => {
      if (entityCondition.types.indexOf(ConditionType.expire) != -1) {
        if (entityCondition.state == EntityConditionState.normal) {
          entityCondition.state = EntityConditionState.expire;
        } else if (entityCondition.state == EntityConditionState.expire) {
          entityCondition.expired = true;
        }
      }
    })
  }

  applyConditions(entity: Entity) {
    entity.entityConditions.filter((entityCondition: EntityCondition) => entityCondition.state == EntityConditionState.normal && entityCondition.types.indexOf(ConditionType.turn) != -1).forEach((entityCondition: EntityCondition, index: number) => {
      entityCondition.state = EntityConditionState.turn;
      if (entityCondition.name == ConditionName.wound || entityCondition.name == ConditionName.wound_x) {
        entity.health = entity.health - entityCondition.value;
        if (entity.health < 0) {
          entity.health = 0;
        }

        setTimeout(() => {
          entityCondition.highlight = true;
          setTimeout(() => {
            entityCondition.highlight = false;
          }, 1000);
        }, 1000 * index);
      }
    })
  }

  unapplyConditions(entity: Entity) {
    entity.entityConditions.filter((entityCondition: EntityCondition) => entityCondition.state == EntityConditionState.turn && entityCondition.types.indexOf(ConditionType.turn) != -1).forEach((entityCondition: EntityCondition) => {
      entityCondition.state = EntityConditionState.normal;
      if (entityCondition.name == ConditionName.wound || entityCondition.name == ConditionName.wound_x) {
        entity.health = entity.health + entityCondition.value;
        if (entity.health > EntityValueFunction("" + entity.maxHealth)) {
          entity.health = EntityValueFunction("" + entity.maxHealth);
        }
      }
    })
  }

  highlightedConditions(entity: Entity): EntityCondition[] {
    return entity.entityConditions.filter((entityCondition: EntityCondition) => entityCondition.highlight);
  }

  hasMarker(entity: Entity, marker: string) {
    return entity.markers && entity.markers.indexOf(marker) != -1;
  }

  toggleMarker(entity: Entity, marker: string) {
    if (this.hasMarker(entity, marker)) {
      entity.markers.splice(entity.markers.indexOf(marker), 1);
    } else {
      entity.markers.push(marker);
    }
  }

}