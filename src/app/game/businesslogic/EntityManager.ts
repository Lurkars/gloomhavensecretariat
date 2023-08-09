import { Character } from "../model/Character";
import { Condition, ConditionName, ConditionType, EntityCondition, EntityConditionState } from "../model/data/Condition";
import { Entity, EntityValueFunction } from "../model/Entity";
import { Figure } from "../model/Figure";
import { Game, GameState } from "../model/Game";
import { Monster } from "../model/Monster";
import { MonsterEntity } from "../model/MonsterEntity";
import { Objective } from "../model/Objective";
import { ObjectiveEntity } from "../model/ObjectiveEntity";
import { Summon, SummonState } from "../model/Summon";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class EntityManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  entities(figure: Figure, acting: boolean = false): Entity[] {
    let entities: Entity[] = [];
    if (figure instanceof Character || figure instanceof Objective) {
      if (this.isAlive(figure, acting)) {
        entities.push(figure);
      }
    } else if (figure instanceof Monster) {
      entities = figure.entities.filter((entity) => this.isAlive(entity, acting) || !acting && entity.dormant);
    }
    return entities;
  }

  entitiesAll(figure: Figure, alive: boolean = true, acting: boolean = false): Entity[] {
    let entities: Entity[] = [];
    if (figure instanceof Character && (!alive || this.isAlive(figure, acting))) {
      entities.push(figure);
      entities.push(...figure.summons.filter((summon) => !alive || this.isAlive(summon, acting)));
    } else if (figure instanceof Objective && (!alive || this.isAlive(figure, acting))) {
      entities.push(figure);
    } else if (figure instanceof Monster) {
      entities.push(...figure.entities.filter((entity) => !alive || this.isAlive(entity, acting)));
    }
    return entities;
  }

  isAlive(entity: Entity, acting: boolean = false): boolean {
    if ((entity.health <= 0 && EntityValueFunction(entity.maxHealth) > 0) && !entity.entityConditions.find((condition) => condition.highlight && condition.types.indexOf(ConditionType.apply) != -1) || acting && entity.entityConditions.find((entityCondition) => entityCondition.name == ConditionName.stun && entityCondition.state != EntityConditionState.new && entityCondition.lastState != EntityConditionState.new && entityCondition.state != EntityConditionState.removed)) {
      return false;
    }

    if (entity instanceof Character) {
      return !entity.exhausted && !entity.absent;
    }
    if (entity instanceof Objective) {
      return !entity.exhausted;
    }

    if (entity instanceof MonsterEntity) {
      return !entity.dead && !entity.dormant && (!acting || entity.summon != SummonState.new);
    }

    if (entity instanceof Summon) {
      return !entity.dead && !entity.dormant && (!acting || entity.state != SummonState.new);
    }

    if (entity instanceof ObjectiveEntity) {
      return !entity.dead && !entity.dormant;
    }

    return false;
  }

  checkHealth(entity: Entity, figure: Figure,) {
    const maxHealth = EntityValueFunction(entity.maxHealth);
    if (entity.health > maxHealth) {
      entity.health = maxHealth;
    }

    if (entity.health < 0) {
      entity.health = 0;
    }

    if (entity.health == 0 && !entity.entityConditions.find((condition) => condition.highlight && condition.types.indexOf(ConditionType.apply) != -1)) {
      if ((entity instanceof Character || entity instanceof Objective) && (!entity.off || !entity.exhausted)) {
        entity.off = true;
        entity.exhausted = true;
      } else if ((entity instanceof MonsterEntity || entity instanceof Summon) && !entity.dead) {
        entity.dead = true;
        setTimeout(() => {
          gameManager.uiChange.emit();
        }, settingsManager.settings.disableAnimations ? 0 : 1500);
      }
    }

    if (entity.health > 0) {
      if ((entity instanceof Character || entity instanceof Objective) && entity.exhausted) {
        entity.off = false;
        entity.exhausted = false;
      } else if ((entity instanceof MonsterEntity || entity instanceof Summon) && entity.dead) {
        entity.dead = false;
      }
    }
  }

  changeHealth(entity: Entity, figure: Figure, value: number) {
    this.changeHealthHighlightConditions(entity, figure, value);
    entity.health += value;
    this.checkHealth(entity, figure);
  }

  changeHealthHighlightConditions(entity: Entity, figure: Figure, value: number) {
    if (settingsManager.settings.applyConditions) {
      entity.entityConditions.filter((entityCondition) => entityCondition.name == ConditionName.poison || entityCondition.name == ConditionName.poison_x).forEach((entityCondition) => {
        if (value < 0 && !entityCondition.expired && entityCondition.state != EntityConditionState.new && (entity.health + value > 0) && !this.isImmune(entity, figure, entityCondition.name)) {
          entityCondition.highlight = true;
        } else {
          entityCondition.highlight = false;
        }
      });

      const regenerate = entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state != EntityConditionState.new && !entityCondition.permanent && entityCondition.name == ConditionName.regenerate);

      if (regenerate && value < 0) {
        regenerate.expired = true;
      }

      this.sufferDamageHighlightConditions(entity, figure, value);

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

  sufferDamageHighlightConditions(entity: Entity, figure: Figure, value: number) {
    if (settingsManager.settings.applyConditions) {
      const ward = entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state != EntityConditionState.new && entityCondition.name == ConditionName.ward && !this.isImmune(entity, figure, entityCondition.name));
      const brittle = entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state != EntityConditionState.new && entityCondition.name == ConditionName.brittle && !this.isImmune(entity, figure, entityCondition.name));

      if (value < 0 && ward && !brittle && (entity.health + value - Math.floor(value / 2)) > 0) {
        ward.value = value * -1;
        ward.highlight = true;
      } else if (ward) {
        ward.highlight = false;
      }

      if (brittle && !ward && value < 0 && (entity.health + value > 0)) {
        brittle.value = value * -1;
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
    }
  }

  hasCondition(entity: Entity, condition: Condition, permanent: boolean = false): boolean {
    return entity.entityConditions.some((entityCondition) => entityCondition.name == condition.name && entityCondition.state != EntityConditionState.removed && !entityCondition.expired && (!permanent || entityCondition.permanent));
  }

  activeConditions(entity: Entity, expiredIndicator: boolean = false, hidden: boolean = false): EntityCondition[] {
    return entity.entityConditions.filter((value) => (!value.expired || expiredIndicator && value.types.indexOf(ConditionType.expiredIndicator) != -1) && (hidden || value.types.indexOf(ConditionType.hidden) == -1));
  }

  isImmune(entity: Entity, figure: Figure, conditionName: ConditionName): boolean {
    let immune: boolean = false;

    if (entity.immunities && entity.immunities.indexOf(conditionName) != -1) {
      return true;
    } else if (figure instanceof Monster && entity instanceof MonsterEntity) {
      const stat = figure.stats.find((monsterStat) => monsterStat.level == entity.level && monsterStat.type == entity.type);
      immune = stat != undefined && stat.immunities != undefined && stat.immunities.indexOf(conditionName) != -1;
    } else if (figure instanceof Character) {
      let immunities: ConditionName[] = [];
      if (figure.progress.equippedItems.find((identifier) => identifier.edition == 'gh' && identifier.name == '38')) {
        immunities.push(ConditionName.stun, ConditionName.muddle);
      }
      if (figure.progress.equippedItems.find((identifier) => identifier.edition == 'gh' && identifier.name == '52')) {
        immunities.push(ConditionName.poison, ConditionName.wound);
      }
      if (figure.progress.equippedItems.find((identifier) => identifier.edition == 'gh' && identifier.name == '103')) {
        immunities.push(ConditionName.poison, ConditionName.wound);
      }
      if (figure.progress.equippedItems.find((identifier) => identifier.edition == 'cs' && identifier.name == '57')) {
        immunities.push(ConditionName.muddle);
      }
      if (figure.progress.equippedItems.find((identifier) => identifier.edition == 'fh' && identifier.name == '138')) {
        immunities.push(ConditionName.disarm, ConditionName.stun, ConditionName.muddle);
      }

      if (figure.name == 'blinkblade' && figure.edition == 'fh' && figure.progress.perks[10]) {
        immunities.push(ConditionName.immobilize);
      } else if (figure.name == 'coral' && figure.edition == 'fh' && figure.progress.perks[7]) {
        immunities.push(ConditionName.impair);
      } else if (figure.name == 'prism' && figure.edition == 'fh' && figure.progress.perks[9]) {
        immunities.push(ConditionName.wound);
      }

      immune = immunities.indexOf(conditionName) != -1;
    }

    if (!immune) {
      if (conditionName == ConditionName.wound_x) {
        return this.isImmune(entity, figure, ConditionName.wound);
      } else if (conditionName == ConditionName.poison_x) {
        return this.isImmune(entity, figure, ConditionName.poison);
      } else if (conditionName == ConditionName.rupture) {
        return this.isImmune(entity, figure, ConditionName.wound);
      } else if (conditionName == ConditionName.infect) {
        return this.isImmune(entity, figure, ConditionName.poison);
      } else if (conditionName == ConditionName.chill) {
        return this.isImmune(entity, figure, ConditionName.immobilize) || this.isImmune(entity, figure, ConditionName.muddle);
      }
    }

    return immune;
  }

  addCondition(entity: Entity, condition: Condition, active: boolean, off: boolean, permanent: boolean = false, immunity: boolean = false) {
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
    } else if (active && entityCondition.types.indexOf(ConditionType.afterTurn) != -1) {
      entityCondition.state = EntityConditionState.new;
    } else if (!active && entityCondition.types.indexOf(ConditionType.afterTurn) != -1) {
      entityCondition.lastState = EntityConditionState.normal;
    }

    if (off && entityCondition.types.indexOf(ConditionType.turn) != -1) {
      entityCondition.lastState = entityCondition.state;
      entityCondition.state = EntityConditionState.expire;
    }

    entityCondition.permanent = permanent;
  }

  removeCondition(entity: Entity, condition: Condition, permanent: boolean = false) {
    entity.entityConditions = entity.entityConditions.filter((entityCondition) => entityCondition.name != condition.name || entityCondition.permanent != permanent);
  }

  applyCondition(entity: Entity, figure: Figure, name: ConditionName, highlight: boolean = false) {
    const condition = entity.entityConditions.find((entityCondition) => entityCondition.name == name && !entityCondition.expired && entityCondition.types.indexOf(ConditionType.apply) != -1);

    if (condition && !this.isImmune(entity, figure, condition.name)) {
      if (condition.name == ConditionName.poison || condition.name == ConditionName.poison_x) {
        entity.health -= condition.value;
        condition.highlight = false;
        this.checkHealth(entity, figure);
      }

      if (condition.name == ConditionName.ward) {
        entity.health += condition.value;
        this.checkHealth(entity, figure);
        entity.health -= Math.floor(condition.value / 2);
        condition.value = 1;
        condition.expired = true;
        condition.highlight = false;
        this.checkHealth(entity, figure);
      }

      if (condition.name == ConditionName.brittle) {
        entity.health += condition.value;
        this.checkHealth(entity, figure);
        entity.health -= condition.value * 2;
        condition.value = 1;
        condition.expired = true;
        condition.highlight = false;
        this.checkHealth(entity, figure);
      }

      if (condition.name == ConditionName.heal) {
        const preventHeal = entity.entityConditions.find((condition) => condition.types.indexOf(ConditionType.preventHeal) != -1 && condition.state != EntityConditionState.expire && !condition.expired);
        if (preventHeal) {
          entity.health -= condition.value;
        }

        let clearHeal = entity.entityConditions.find((condition) => condition.types.indexOf(ConditionType.clearHeal) != -1 && condition.state != EntityConditionState.expire && condition.state != EntityConditionState.new && !condition.permanent && !condition.expired);
        while (clearHeal) {
          clearHeal.lastState = clearHeal.state;
          clearHeal.state = EntityConditionState.expire;
          clearHeal.expired = true;
          clearHeal = entity.entityConditions.find((condition) => condition.types.indexOf(ConditionType.clearHeal) != -1 && condition.state != EntityConditionState.expire && condition.state != EntityConditionState.new && !condition.permanent && !condition.expired);
        }
        if (highlight) {
          condition.highlight = true;
        }

        if (!preventHeal && entity.health - condition.value >= EntityValueFunction(entity.maxHealth)) {
          condition.highlight = false;
        }

        this.checkHealth(entity, figure);
        setTimeout(() => {
          condition.expired = !condition.permanent;
          condition.highlight = false;
        }, highlight ? 1000 : 0);
      }

      if (condition.permanent) {
        condition.expired = false;
      }
    }
  }

  declineApplyCondition(entity: Entity, name: ConditionName) {
    const condition = entity.entityConditions.find((entityCondition) => entityCondition.name == name && !entityCondition.expired && entityCondition.types.indexOf(ConditionType.apply) != -1);
    if (condition) {
      condition.highlight = false;

      if (!condition.permanent) {
        if (condition.name == ConditionName.heal) {
          condition.expired = true;
        }

        if (condition.name == ConditionName.ward || condition.name == ConditionName.brittle) {
          condition.value = 1;
          condition.expired = true;
        }
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
        }
      }
    })

  }

  expireConditions(entity: Entity) {
    entity.entityConditions.forEach((entityCondition) => {
      if (entityCondition.name == ConditionName.chill) {
        if (entityCondition.value == 1 && !entityCondition.permanent) {
          entityCondition.expired = true;
        } else {
          entityCondition.value--;
        }
      }
    })

    entity.entityConditions.forEach((entityCondition) => {
      if (entityCondition.types.indexOf(ConditionType.expire) != -1) {
        if (entityCondition.state == EntityConditionState.expire && !entityCondition.permanent) {
          entityCondition.expired = true;
        }
      }
    })
  }

  applyConditionsTurn(entity: Entity, figure: Figure) {

    const regenerateCondition = entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state == EntityConditionState.normal && entityCondition.name == ConditionName.regenerate && !this.isImmune(entity, figure, entityCondition.name));

    if (regenerateCondition) {
      const maxHealth = EntityValueFunction(entity.maxHealth);
      const heal = entity.entityConditions.every((entityCondition) => entityCondition.expired || entityCondition.types.indexOf(ConditionType.preventHeal) == -1) && entity.health < maxHealth;

      entity.entityConditions.filter((entityCondition) => !entityCondition.expired && entityCondition.types.indexOf(ConditionType.clearHeal) != -1 && !entityCondition.permanent).forEach((entityCondition) => {
        entityCondition.expired = true;
        entityCondition.lastState = entityCondition.state;
        entityCondition.state = EntityConditionState.removed;
      });

      if (heal) {
        let clearHeal = entity.entityConditions.find((condition) => condition.types.indexOf(ConditionType.clearHeal) != -1 && condition.state != EntityConditionState.expire && condition.state != EntityConditionState.new && !condition.permanent && !condition.expired);
        while (clearHeal) {
          clearHeal.lastState = clearHeal.state;
          clearHeal.state = EntityConditionState.expire;
          clearHeal.expired = true;
          clearHeal = entity.entityConditions.find((condition) => condition.types.indexOf(ConditionType.clearHeal) != -1 && condition.state != EntityConditionState.expire && condition.state != EntityConditionState.new && !condition.permanent && !condition.expired);
        }
        regenerateCondition.lastState = regenerateCondition.state;
        regenerateCondition.state = EntityConditionState.expire;
        entity.health += regenerateCondition.value;
        this.checkHealth(entity, figure);
      }

      regenerateCondition.highlight = true;
      setTimeout(() => {
        regenerateCondition.highlight = false;
      }, 1000);
    }

    if (entity instanceof Character && entity.progress.equippedItems.find((identifier) => identifier.edition == 'fh' && identifier.name == '178') && entity.initiative >= 60 && !entity.longRest) {
      entity.health = entity.health + 1;
      entity.entityConditions.push(new EntityCondition(ConditionName.heal, 1));
      this.applyCondition(entity, figure, ConditionName.heal, true);
    }

    entity.entityConditions.filter((entityCondition) => !entityCondition.expired && entityCondition.state == EntityConditionState.normal && entityCondition.types.indexOf(ConditionType.turn) != -1).forEach((entityCondition) => {
      if (!this.isImmune(entity, figure, entityCondition.name)) {
        entityCondition.lastState = entityCondition.state;
        entityCondition.state = EntityConditionState.turn;
        if (entityCondition.name == ConditionName.wound || entityCondition.name == ConditionName.wound_x) {
          entity.health = entity.health - entityCondition.value;

          if (entity instanceof Character && entity.progress.equippedItems.find((identifier) => identifier.edition == 'cs' && identifier.name == '71')) {
            entity.health = entity.health + entityCondition.value + 1;
            entity.entityConditions.push(new EntityCondition(ConditionName.heal, 1));
            this.applyCondition(entity, figure, ConditionName.heal, true);
          }

          this.checkHealth(entity, figure);

          entityCondition.highlight = true;
          setTimeout(() => {
            entityCondition.highlight = false;
            if (!(entity instanceof Character) || !entity.progress.equippedItems.find((identifier) => identifier.edition == 'cs' && identifier.name == '71')) {
              this.sufferDamageHighlightConditions(entity, figure, - entityCondition.value);
              this.checkHealth(entity, figure);
            }
          }, 1000);
        }
      }
    })

    entity.entityConditions.filter((entityCondition) => !entityCondition.expired && entityCondition.types.indexOf(ConditionType.afterTurn) != -1 && !entityCondition.permanent).forEach((entityCondition) => {
      if (entityCondition.state == EntityConditionState.normal) {
        entityCondition.lastState = entityCondition.state;
        entityCondition.state = EntityConditionState.turn;
      } else if (entityCondition.state == EntityConditionState.new && entityCondition.lastState != EntityConditionState.new) {
        entityCondition.lastState = entityCondition.state;
        entityCondition.state = EntityConditionState.normal;
      }
    })
  }

  unapplyConditionsTurn(entity: Entity, figure: Figure) {
    entity.entityConditions.filter((entityCondition) => entityCondition.state == EntityConditionState.turn && entityCondition.types.indexOf(ConditionType.turn) != -1).forEach((entityCondition) => {
      if (entityCondition.expired) {
        entityCondition.expired = false;
      } else {
        entityCondition.lastState = entityCondition.state;
        entityCondition.state = EntityConditionState.normal;
        if (entityCondition.name == ConditionName.wound || entityCondition.name == ConditionName.wound_x) {
          entity.health = entity.health + entityCondition.value;
          this.checkHealth(entity, figure);
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
        this.checkHealth(entity, figure);
      }
    }

    if (entity instanceof Character && entity.progress.equippedItems.find((identifier) => identifier.edition == 'fh' && identifier.name == '178') && entity.initiative >= 60 && !entity.longRest && entity.entityConditions.find((condition) => condition.name == ConditionName.heal && condition.value == 1 && condition.expired)) {
      entity.entityConditions = entity.entityConditions.filter((condition) => condition.name != ConditionName.heal || condition.value != 1 || !condition.expired)
      entity.health = entity.health - 1;
    }
  }

  applyConditionsAfter(entity: Entity, figure: Figure,) {
    entity.entityConditions.filter((entityCondition) => !entityCondition.expired && entityCondition.types.indexOf(ConditionType.afterTurn) != -1).forEach((entityCondition) => {
      if (!this.isImmune(entity, figure, entityCondition.name)) {
        if (entityCondition.state == EntityConditionState.turn) {
          if (entityCondition.name == ConditionName.bane) {
            this.changeHealth(entity, figure, -10);
            entityCondition.expired = true;
            entityCondition.highlight = true;
            setTimeout(() => {
              entityCondition.highlight = false;
            }, 1000);
          }
        } else if (entityCondition.state == EntityConditionState.normal) {
          entityCondition.lastState = entityCondition.state;
          entityCondition.state = EntityConditionState.turn;
        } else if (entityCondition.state == EntityConditionState.new && entityCondition.lastState != EntityConditionState.new) {
          entityCondition.lastState = entityCondition.state;
          entityCondition.state = EntityConditionState.normal;
        } else if (entityCondition.state == EntityConditionState.new && entityCondition.lastState == EntityConditionState.new) {
          entityCondition.lastState = EntityConditionState.new;
          entityCondition.state = EntityConditionState.normal;
        }
      }
    })
  }

  unapplyConditionsAfter(entity: Entity, figure: Figure) {
    entity.entityConditions.filter((entityCondition) => entityCondition.state != EntityConditionState.removed && entityCondition.types.indexOf(ConditionType.afterTurn) != -1).forEach((entityCondition) => {
      if (entityCondition.expired) {
        if (entityCondition.name == ConditionName.bane) {
          entity.health = entity.health + 10;
          this.checkHealth(entity, figure);
        }

        entityCondition.highlight = false;
        entityCondition.expired = false;
      } else if (entityCondition.state == EntityConditionState.normal && entityCondition.lastState == EntityConditionState.new) {
        entityCondition.state = EntityConditionState.new;
      } else if (entityCondition.state == EntityConditionState.new && entityCondition.lastState != EntityConditionState.new) {
        entityCondition.lastState = entityCondition.state;
      }
    })
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

  toggleActive(figure: Figure, entity: Entity) {
    if (this.game.state == GameState.next) {
      if (figure.active) {
        entity.active = !entity.active;
        if (this.entities(figure).every((entity) => !this.isAlive(entity) || !entity.active)) {
          gameManager.roundManager.toggleFigure(figure);
        }
      } else if (entity.active) {
        entity.active = false;
        if (this.entities(figure).every((entity) => !this.isAlive(entity, true) || !entity.active)) {
          figure.off = true;
        }
      } else {
        figure.off = false;
        entity.active = true;
      }

      if (entity.active) {
        entity.off = false;
        if (!figure.active && this.game.figures.every((figure) => !figure.active)) {
          figure.active = true;
        }
      } else {
        entity.off = true;
      }
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

  next() {
    this.game.figures.forEach((figure) => {
      this.entitiesAll(figure).forEach((entity) => {
        if (settingsManager.settings.expireConditions) {
          entity.entityConditions = entity.entityConditions.filter((entityCondition) => !entityCondition.expired);
          entity.entityConditions.forEach((entityCondition) => {
            if (entityCondition.types.indexOf(ConditionType.expire) != -1 && !entityCondition.permanent) {
              if (entityCondition.state == EntityConditionState.normal) {
                entityCondition.lastState = entityCondition.state;
                entityCondition.state = EntityConditionState.expire;
              }
            }
          })
        }

        if (settingsManager.settings.applyConditions) {
          entity.entityConditions.filter((entityCondition) => entityCondition.types.indexOf(ConditionType.turn) != -1 || entityCondition.types.indexOf(ConditionType.afterTurn) != -1 && !this.isImmune(entity, figure, entityCondition.name)).forEach((entityCondition) => {
            entityCondition.lastState = entityCondition.state;
            entityCondition.state = EntityConditionState.normal;
          });
        }
      })
    })
  }

}
