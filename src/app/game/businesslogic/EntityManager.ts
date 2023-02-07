import { Character } from "../model/Character";
import { Condition, ConditionName, ConditionType, EntityCondition, EntityConditionState } from "../model/Condition";
import { Entity, EntityValueFunction } from "../model/Entity";
import { Figure } from "../model/Figure";
import { Game } from "../model/Game";
import { Monster } from "../model/Monster";
import { MonsterEntity } from "../model/MonsterEntity";
import { Objective } from "../model/Objective";
import { Summon } from "../model/Summon";
import { settingsManager } from "./SettingsManager";

export class EntityManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  entities(figure: Figure): Entity[] {
    let entities: Entity[] = [];
    if (figure instanceof Character || figure instanceof Objective) {
      entities.push(figure);
    } else if (figure instanceof Monster) {
      entities = figure.entities.filter((entity) => !entity.dead && entity.health > 0);
    }
    return entities;
  }

  changeHealth(entity: Entity, value: number) {
    this.changeHealthHighlightConditions(entity, value);
    entity.health += value;
    const maxHealth = EntityValueFunction(entity.maxHealth);
    if (entity.health > maxHealth) {
      entity.health = maxHealth;
    } else if (entity.health < 0) {
      entity.health = 0;
    }
  }

  changeHealthHighlightConditions(entity: Entity, value: number) {
    if (settingsManager.settings.applyConditions) {
      entity.entityConditions.filter((entityCondition) => entityCondition.name == ConditionName.poison || entityCondition.name == ConditionName.poison_x).forEach((entityCondition) => {
        if (value < 0 && !entityCondition.expired && entityCondition.state != EntityConditionState.new) {
          entityCondition.highlight = true;
        } else {
          entityCondition.highlight = false;
        }
      });

      const regenerate = entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state != EntityConditionState.new && entityCondition.name == ConditionName.regenerate);

      if (regenerate && value < 0) {
        regenerate.expired = true;
      }

      const ward = entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state != EntityConditionState.new && entityCondition.name == ConditionName.ward);
      const brittle = entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state != EntityConditionState.new && entityCondition.name == ConditionName.brittle);

      if (value < 0 && ward && !brittle) {
        ward.value -= value;
        ward.highlight = true;
      } else if (ward) {
        ward.highlight = false;
      }

      if (brittle && !ward && value < 0) {
        brittle.value -= value;
        brittle.highlight = true;
      } else if (brittle) {
        brittle.highlight = false;
      }

      if (brittle && ward) {
        brittle.highlight = false;
        ward.highlight = false;
        if (value < 0) {
          brittle.expired = true;
          ward.expired = true
        }
      }

      if (entity.health + value > entity.health) {
        const clearHeal = entity.entityConditions.find((condition) => condition.types.indexOf(ConditionType.clearHeal) != -1 && condition.state != EntityConditionState.expire && condition.state != EntityConditionState.new && !condition.expired);
        let heal = entity.entityConditions.find((condition) => condition.name == ConditionName.heal);
        if ((clearHeal) && (!heal || heal.expired || !heal.highlight)) {
          if (!heal) {
            heal = new EntityCondition(ConditionName.heal, value);
            entity.entityConditions.push(heal);
          }
          heal.expired = false;
          heal.highlight = true;
          heal.value = value;
        }
      }
    }
  }

  hasCondition(entity: Entity, condition: Condition) {
    return entity.entityConditions.some((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired);
  }

  activeConditions(entity: Entity, hidden: boolean = false) {
    return entity.entityConditions.filter((value) => !value.expired && (hidden || value.types.indexOf(ConditionType.hidden) == -1));
  }

  isImmune(monster: Monster, entity: MonsterEntity, conditionName: ConditionName): boolean {
    const stat = monster.stats.find((monsterStat) => monsterStat.level == entity.level && monsterStat.type == entity.type);

    let immune = stat != undefined && stat.immunities != undefined && stat.immunities.indexOf(conditionName as string) != -1;

    if (!immune) {
      if (conditionName == ConditionName.wound_x) {
        return this.isImmune(monster, entity, ConditionName.wound);
      } else if (conditionName == ConditionName.poison_x) {
        return this.isImmune(monster, entity, ConditionName.poison);
      } else if (conditionName == ConditionName.rupture) {
        return this.isImmune(monster, entity, ConditionName.wound);
      } else if (conditionName == ConditionName.infect) {
        return this.isImmune(monster, entity, ConditionName.poison);
      } else if (conditionName == ConditionName.chill) {
        return this.isImmune(monster, entity, ConditionName.immobilize) || this.isImmune(monster, entity, ConditionName.muddle);
      }
    }

    return immune;
  }

  toggleCondition(entity: Entity, condition: Condition, active: boolean, off: boolean) {
    if (!this.hasCondition(entity, condition)) {
      let entityCondition: EntityCondition | undefined = entity.entityConditions.find((entityCondition) => entityCondition.name == condition.name);
      if (!entityCondition) {
        entityCondition = new EntityCondition(condition.name, condition.value);
        entity.entityConditions.push(entityCondition);
      } else {
        entityCondition.expired = false;
        entityCondition.lastState = entityCondition.state;
        entityCondition.state = EntityConditionState.normal;
      }

      if (!active && entityCondition.types.indexOf(ConditionType.expire) != -1) {
        entityCondition.lastState = entityCondition.state;
        entityCondition.state = EntityConditionState.expire;
      } else if (active && entityCondition.types.indexOf(ConditionType.turn) != -1) {
        entityCondition.lastState = entityCondition.state;
        entityCondition.state = EntityConditionState.turn;
      }

      if (off && entityCondition.types.indexOf(ConditionType.turn) != -1) {
        entityCondition.lastState = entityCondition.state;
        entityCondition.state = EntityConditionState.expire;
      }
    } else {
      entity.entityConditions = entity.entityConditions.filter((entityCondition) => entityCondition.name != condition.name);
    }
  }

  applyCondition(entity: Entity, name: ConditionName) {
    const condition = entity.entityConditions.find((entityCondition) => entityCondition.name == name && !entityCondition.expired && entityCondition.types.indexOf(ConditionType.apply) != -1);

    if (condition) {
      if (condition.name == ConditionName.poison || condition.name == ConditionName.poison_x) {
        entity.health -= condition.value;
        if (entity.health < 0) {
          entity.health = 0;
        }

        if (entity.health == 0 && (entity instanceof MonsterEntity || entity instanceof Summon) && !entity.dead) {
          entity.dead = true;
        }

        condition.highlight = false;
      }

      if (condition.name == ConditionName.ward) {
        entity.health += Math.floor((condition.value - 1) / 2);
        const maxHealth = EntityValueFunction(entity.maxHealth);
        if (entity.health > maxHealth) {
          entity.health = maxHealth;
        }

        if (entity.health > 0 && (entity instanceof MonsterEntity || entity instanceof Summon) && entity.dead) {
          entity.dead = false;
        }

        condition.value = 1;
        condition.expired = true;
        condition.highlight = false;
      }

      if (condition.name == ConditionName.brittle) {
        entity.health -= Math.floor((condition.value - 1) / 2);
        if (entity.health < 0) {
          entity.health = 0;
        }

        if (entity.health == 0 && (entity instanceof MonsterEntity || entity instanceof Summon) && !entity.dead) {
          entity.dead = true;
        }

        condition.value = 1;
        condition.expired = true;
        condition.highlight = false;
      }

      if (condition.name == ConditionName.heal) {
        const preventHeal = entity.entityConditions.find((condition) => condition.types.indexOf(ConditionType.preventHeal) != -1 && condition.state != EntityConditionState.expire && !condition.expired);
        if (preventHeal) {
          entity.health -= condition.value;
        }

        let clearHeal = entity.entityConditions.find((condition) => condition.types.indexOf(ConditionType.clearHeal) != -1 && condition.state != EntityConditionState.expire && condition.state != EntityConditionState.new && !condition.expired);
        while (clearHeal) {
          clearHeal.lastState = clearHeal.state;
          clearHeal.state = EntityConditionState.expire;
          clearHeal.expired = true;
          clearHeal = entity.entityConditions.find((condition) => condition.types.indexOf(ConditionType.clearHeal) != -1 && condition.state != EntityConditionState.expire && condition.state != EntityConditionState.new && !condition.expired);
        }
        condition.expired = true;
        condition.highlight = false;
      }
    }
  }

  declineApplyCondition(entity: Entity, name: ConditionName) {
    const condition = entity.entityConditions.find((entityCondition) => entityCondition.name == name && !entityCondition.expired && entityCondition.types.indexOf(ConditionType.apply) != -1);
    if (condition) {
      condition.highlight = false;

      if (condition.name == ConditionName.heal) {
        condition.expired = true;
      }

      if (condition.name == ConditionName.ward || condition.name == ConditionName.brittle) {
        condition.value = 1;
        condition.expired = true;
      }
    }
  }


  restoreConditions(entity: Entity) {
    entity.entityConditions.forEach((entityCondition) => {

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
          entityCondition.lastState = entityCondition.state;
          entityCondition.state = EntityConditionState.normal;
        }
      }
    })

  }

  expireConditions(entity: Entity) {
    entity.entityConditions.forEach((entityCondition) => {
      if (entityCondition.name == ConditionName.chill) {
        if (entityCondition.value == 1) {
          entityCondition.expired = true;
        } else {
          entityCondition.value--;
        }
      }
    })

    entity.entityConditions.forEach((entityCondition) => {
      if (entityCondition.types.indexOf(ConditionType.expire) != -1) {
        if (entityCondition.state == EntityConditionState.normal) {
          entityCondition.lastState = entityCondition.state;
          entityCondition.state = EntityConditionState.expire;
        } else if (entityCondition.state == EntityConditionState.expire) {
          entityCondition.expired = true;
        }
      }
    })
  }

  applyConditionsTurn(entity: Entity) {

    const regenerateCondition = entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state == EntityConditionState.normal && entityCondition.name == ConditionName.regenerate);

    if (regenerateCondition) {
      const maxHealth = EntityValueFunction(entity.maxHealth);
      const heal = entity.entityConditions.every((entityCondition) => entityCondition.expired || entityCondition.types.indexOf(ConditionType.preventHeal) == -1) && entity.health < maxHealth;

      entity.entityConditions.filter((entityCondition) => !entityCondition.expired && entityCondition.types.indexOf(ConditionType.clearHeal) != -1).forEach((entityCondition) => entityCondition.expired = true);

      if (heal) {
        regenerateCondition.lastState = regenerateCondition.state;
        regenerateCondition.state = EntityConditionState.expire;
        entity.health += regenerateCondition.value;
        if (entity.health > maxHealth) {
          entity.health = maxHealth;
        }
      }

      regenerateCondition.highlight = true;
      setTimeout(() => {
        regenerateCondition.highlight = false;
      }, 1000);
    }

    entity.entityConditions.filter((entityCondition) => !entityCondition.expired && entityCondition.state == EntityConditionState.normal && entityCondition.types.indexOf(ConditionType.turn) != -1).forEach((entityCondition) => {
      entityCondition.lastState = entityCondition.state;
      entityCondition.state = EntityConditionState.turn;
      if (entityCondition.name == ConditionName.wound || entityCondition.name == ConditionName.wound_x) {


        entity.health = entity.health - entityCondition.value;
        if (entity.health < 0) {
          entity.health = 0;
        }

        if (entity.health == 0 && (entity instanceof Character || entity instanceof Objective) && !entity.exhausted) {
          entity.exhausted = true;
        }

        if (entity.health == 0 && (entity instanceof MonsterEntity || entity instanceof Summon) && !entity.dead) {
          entity.dead = true;
        }

        entityCondition.highlight = true;
        setTimeout(() => {
          entityCondition.highlight = false;
        }, 1000);
      }
    })
  }

  unapplyConditionsTurn(entity: Entity) {
    entity.entityConditions.filter((entityCondition) => entityCondition.state == EntityConditionState.turn && entityCondition.types.indexOf(ConditionType.turn) != -1).forEach((entityCondition) => {
      if (entityCondition.expired) {
        entityCondition.expired = false;
      } else {
        entityCondition.lastState = entityCondition.state;
        entityCondition.state = EntityConditionState.normal;
        if (entityCondition.name == ConditionName.wound || entityCondition.name == ConditionName.wound_x) {

          entity.health = entity.health + entityCondition.value;
          const maxHealth = EntityValueFunction(entity.maxHealth);
          if (entity.health > maxHealth) {
            entity.health = maxHealth;
          }

          if (entity.health > 0 && (entity instanceof MonsterEntity || entity instanceof Summon) && entity.dead) {
            entity.dead = false;
          }

        }
      }
    });

    const regenerateCondition = entity.entityConditions.find((entityCondition) => entityCondition.name == ConditionName.regenerate);

    if (regenerateCondition) {
      const heal = entity.entityConditions.every((entityCondition) => entityCondition.types.indexOf(ConditionType.preventHeal) == -1) &&
        regenerateCondition.state == EntityConditionState.expire;

      entity.entityConditions.filter((entityCondition) => entityCondition.expired && entityCondition.types.indexOf(ConditionType.clearHeal) != -1).forEach((entityCondition) => entityCondition.expired = false);

      if (heal) {
        regenerateCondition.lastState = regenerateCondition.state;
        regenerateCondition.state = EntityConditionState.normal;
        entity.health -= regenerateCondition.value;
        if (entity.health < 0) {
          entity.health = 0;
        }

      }
    }
  }

  applyConditionsAfter(entity: Entity) {
    const baneCondition = entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.name == ConditionName.bane);

    if (baneCondition) {

      entity.health = entity.health - 10;
      if (entity.health < 0) {
        entity.health = 0;
      }

      if (entity.health == 0 && (entity instanceof MonsterEntity || entity instanceof Summon) && !entity.dead) {
        entity.dead = true;
      }

      baneCondition.expired = true;
      baneCondition.highlight = true;
      setTimeout(() => {
        baneCondition.highlight = false;
      }, 1000);
    }
  }

  unapplyConditionsAfter(entity: Entity) {
    const baneCondition = entity.entityConditions.find((entityCondition) => entityCondition.expired && entityCondition.name == ConditionName.bane);
    if (baneCondition) {

      entity.health = entity.health + 10;
      const maxHealth = EntityValueFunction(entity.maxHealth);
      if (entity.health > maxHealth) {
        entity.health = maxHealth;
      }

      if (entity.health > 0 && (entity instanceof MonsterEntity || entity instanceof Summon) && entity.dead) {
        entity.dead = false;
      }

      baneCondition.highlight = false;
      baneCondition.expired = false;
    }
  }

  highlightedConditions(entity: Entity): EntityCondition[] {
    return entity.entityConditions.filter((entityCondition) => entityCondition.highlight).sort((a, b) => b.types.indexOf(ConditionType.double) - a.types.indexOf(ConditionType.double));
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

  undoInfos(entity: Entity | undefined, figure: Figure, prefix: string): string[] {
    let infos: string[] = [];
    if (entity instanceof Character && figure instanceof Character) {
      infos.push(prefix + ".char", "data.character." + entity.name)
    } else if (entity instanceof Summon && figure instanceof Character) {
      infos.push(prefix + ".summon", "data.character." + figure.name, "data.summon." + entity.name)
    } else if (entity instanceof Objective) {
      infos.push(prefix + ".objective", entity.title || entity.name)
    } else if (figure instanceof Monster && entity instanceof MonsterEntity) {
      infos.push(prefix + ".monster", "data.monster." + figure.name, "" + entity.number)
    } else if (figure instanceof Monster) {
      infos.push(prefix + ".monsterEntities", "data.monster." + figure.name,)
    }

    return infos;
  }

}