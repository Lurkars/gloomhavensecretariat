import { Character } from "../model/Character";
import { ActionType } from "../model/data/Action";
import { Condition, ConditionName, ConditionType, EntityCondition, EntityConditionState } from "../model/data/Condition";
import { Entity, EntityValueFunction } from "../model/Entity";
import { Figure } from "../model/Figure";
import { Game, GameState } from "../model/Game";
import { Monster } from "../model/Monster";
import { MonsterEntity } from "../model/MonsterEntity";
import { ObjectiveContainer } from "../model/ObjectiveContainer";
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
    if (figure instanceof Character) {
      if (this.isAlive(figure, acting)) {
        entities.push(figure);
      }
    } else if (figure instanceof Monster) {
      entities = figure.entities.filter((entity) => this.isAlive(entity, acting) || !acting && entity.dormant);
    } else if (figure instanceof ObjectiveContainer) {
      entities = figure.entities.filter((entity) => this.isAlive(entity, acting) || !acting && entity.dormant);
    }
    return entities;
  }

  entitiesAll(figure: Figure, alive: boolean = true, acting: boolean = false): Entity[] {
    let entities: Entity[] = [];
    if (figure instanceof Character && (!alive || this.isAlive(figure, acting))) {
      entities.push(figure);
      entities.push(...figure.summons.filter((summon) => !alive || this.isAlive(summon, acting)));
    } else if (figure instanceof Monster) {
      entities.push(...figure.entities.filter((entity) => !alive || this.isAlive(entity, acting)));
    } else if (figure instanceof ObjectiveContainer) {
      entities.push(...figure.entities.filter((entity) => !alive || this.isAlive(entity, acting)));
    }
    return entities;
  }

  getIndexedEntities(sort: boolean = false): { entity: Entity, figure: Figure }[] {
    let result: { entity: Entity, figure: Figure }[] = [];

    const figures: Figure[] = Object.assign([], this.game.figures);

    figures.sort((a, b) => {
      if (sort) {
        return gameManager.sortFiguresByTypeAndName(a, b);
      } else {
        return 0;
      }
    }).forEach((figure) => {
      if (figure instanceof Character) {
        result.push({ entity: figure, figure: figure });
        figure.summons.forEach((summon) => {
          result.push({ entity: summon, figure: figure });
        })
      } else if (figure instanceof Monster) {
        figure.entities.forEach((monsterEntity) => {
          result.push({ entity: monsterEntity, figure: figure });
        })
      } else if (figure instanceof ObjectiveContainer) {
        figure.entities.forEach((objectiveEntity) => {
          result.push({ entity: objectiveEntity, figure: figure });
        })
      }
    })

    return result;
  }

  getIndexForEntity(entity: Entity, sort: boolean = false,): number {
    let index = -1;
    this.getIndexedEntities(sort).forEach((value, i) => {
      if (value.entity == entity) {
        index = i;
        return;
      }
    })

    return index;
  }

  isAlive(entity: Entity, acting: boolean = false): boolean {
    if ((entity.health <= 0 && EntityValueFunction(entity.maxHealth) > 0) && !entity.entityConditions.find((condition) => condition.highlight && condition.types.indexOf(ConditionType.apply) != -1) || acting && entity.entityConditions.find((entityCondition) => entityCondition.name == ConditionName.stun && entityCondition.state != EntityConditionState.new && entityCondition.lastState != EntityConditionState.new && entityCondition.state != EntityConditionState.removed)) {
      return false;
    }

    if (entity instanceof Character) {
      return !entity.exhausted && !entity.absent;
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
    let maxHealth = EntityValueFunction(entity.maxHealth);

    if (entity instanceof Character && entity.name == 'lightning' && entity.tags.find((tag) => tag === 'unbridled-power')) {
      maxHealth = Math.max(maxHealth, 26);
    }

    if (entity.health > maxHealth) {
      entity.health = maxHealth;
    }

    if (entity.health < 0) {
      entity.health = 0;
    }

    if (entity.health == 0 && !entity.entityConditions.find((condition) => settingsManager.settings.applyConditions && settingsManager.settings.activeApplyConditions && condition.highlight && condition.types.indexOf(ConditionType.apply) != -1 && settingsManager.settings.activeApplyConditionsExcludes.indexOf(condition.name) == -1)) {
      if ((entity instanceof Character) && (!entity.off || !entity.exhausted)) {
        entity.off = true;
        entity.exhausted = true;
      } else if ((entity instanceof MonsterEntity || entity instanceof Summon || entity instanceof ObjectiveEntity) && !entity.dead) {
        entity.dead = true;
        setTimeout(() => {
          gameManager.uiChange.emit();
        }, !settingsManager.settings.animations ? 0 : 1500);
      }
    }

    if (entity.health > 0) {
      if (entity instanceof Character && entity.exhausted) {
        entity.off = false;
        entity.exhausted = false;
      } else if ((entity instanceof MonsterEntity || entity instanceof Summon || entity instanceof ObjectiveEntity) && entity.dead) {
        entity.dead = false;
      }
    }
  }

  changeHealth(entity: Entity, figure: Figure, value: number) {
    this.changeHealthHighlightConditions(entity, figure, value);
    entity.health += value;
    this.checkHealth(entity, figure);
    if (settingsManager.settings.scenarioStats && value != 0) {
      if (value > 0) {
        gameManager.scenarioStatsManager.applyHeal(entity, figure, value);
      } else {
        gameManager.scenarioStatsManager.applyDamage(entity, figure, value * -1);
      }
    }

    if (value < 1 && entity instanceof Character && gameManager.trialsManager.apply && gameManager.trialsManager.trialsEnabled && entity.progress.trial && entity.progress.trial.edition == 'fh' && entity.progress.trial.name == '356' && entity.tags.indexOf('trial-fh-356') == -1) {
      entity.tags.push('trial-fh-356');
    }
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

      const regenerate = entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state != EntityConditionState.new && !entityCondition.permanent && entityCondition.name == ConditionName.regenerate && !this.isImmune(entity, figure, entityCondition.name) && settingsManager.settings.applyConditionsExcludes.indexOf(entityCondition.name) == -1);

      if (regenerate && value < 0) {
        regenerate.expired = true;
      }

      this.sufferDamageHighlightConditions(entity, figure, value);

      if (regenerate && entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state != EntityConditionState.new && entityCondition.name == ConditionName.ward && entityCondition.highlight && !this.isImmune(entity, figure, entityCondition.name))) {
        regenerate.expired = false;
      }

      if (entity.health + value > entity.health) {
        const clearHeal = entity.entityConditions.find((condition) => condition.types.indexOf(ConditionType.clearHeal) != -1 && !condition.expired && !this.isImmune(entity, figure, condition.name));
        let heal = entity.entityConditions.find((condition) => condition.name == ConditionName.heal);
        if ((clearHeal) && (!heal || heal.expired || !heal.highlight)) {
          if (!heal) {
            heal = new EntityCondition(ConditionName.heal, value);
            entity.entityConditions.push(heal);
          }
          heal.expired = false;
          heal.highlight = true;
          heal.value = value;

          if (settingsManager.settings.applyConditions && settingsManager.settings.activeApplyConditions && settingsManager.settings.activeApplyConditionsAuto.indexOf(ConditionName.heal) != -1) {
            this.applyCondition(entity, figure, ConditionName.heal, true);
          }
        }
      }
    }
  }

  sufferDamageHighlightConditions(entity: Entity, figure: Figure, value: number) {
    if (settingsManager.settings.applyConditions) {
      const ward = entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state != EntityConditionState.new && entityCondition.name == ConditionName.ward && !this.isImmune(entity, figure, entityCondition.name));
      const brittle = entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state != EntityConditionState.new && entityCondition.name == ConditionName.brittle && !this.isImmune(entity, figure, entityCondition.name));

      let ignorePoison = (!entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state != EntityConditionState.new && entityCondition.name == ConditionName.poison && !this.isImmune(entity, figure, entityCondition.name)) || settingsManager.settings.applyConditionsExcludes.indexOf(ConditionName.poison) != -1) && (!entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state != EntityConditionState.new && entityCondition.name == ConditionName.poison_x && !this.isImmune(entity, figure, entityCondition.name)) || settingsManager.settings.applyConditionsExcludes.indexOf(ConditionName.poison_x) != -1);

      if (value < 0 && ward && !brittle && (entity.health + value - Math.floor(value / 2)) > 0) {
        ward.value = value * -1;
        ward.highlight = true;

        if (settingsManager.settings.applyConditions && settingsManager.settings.activeApplyConditions && settingsManager.settings.activeApplyConditionsAuto.indexOf(ConditionName.ward) != -1 && ignorePoison) {
          this.applyCondition(entity, figure, ConditionName.ward, true, true);
        }

      } else if (ward) {
        ward.highlight = false;
      }

      if (brittle && !ward && value < 0 && (entity.health + value > 0)) {
        brittle.value = value * -1;
        brittle.highlight = true;

        if (settingsManager.settings.applyConditions && settingsManager.settings.activeApplyConditions && settingsManager.settings.activeApplyConditionsAuto.indexOf(ConditionName.brittle) != -1 && ignorePoison) {
          this.applyCondition(entity, figure, ConditionName.brittle, true, true);
        }

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

      if (value < 0) {
        [ConditionName.retaliate, ConditionName.shield].forEach((shieldRetaliateCondition) => {
          let shieldRetaliate = entity.entityConditions.find((condition) => condition.name == shieldRetaliateCondition);
          if (!shieldRetaliate || shieldRetaliate.expired || !shieldRetaliate.highlight) {
            if (!shieldRetaliate) {
              shieldRetaliate = new EntityCondition(shieldRetaliateCondition, 0);
              entity.entityConditions.push(shieldRetaliate);
            }

            shieldRetaliate.value = 0;

            if (entity instanceof MonsterEntity && figure instanceof Monster) {
              let actionHints = gameManager.actionsManager.calcActionHints(figure, entity);
              actionHints.forEach((actionHint) => {
                if (shieldRetaliate && (shieldRetaliateCondition == ConditionName.shield && actionHint.type == ActionType.shield || shieldRetaliateCondition == ConditionName.retaliate && actionHint.type == ActionType.retaliate)) {
                  shieldRetaliate.value += actionHint.value;
                }
              })
            } else if (entity instanceof Character) {
              if (shieldRetaliateCondition == ConditionName.shield && entity.shield && EntityValueFunction(entity.shield.value)) {
                shieldRetaliate.value = EntityValueFunction(entity.shield.value);
              } else if (shieldRetaliateCondition == ConditionName.retaliate && entity.retaliate.length) {
                shieldRetaliate.value = entity.retaliate.map((action) => EntityValueFunction(action.value)).reduce((a, b) => a + b);
              }
            }

            if (shieldRetaliateCondition == ConditionName.shield && shieldRetaliate.value && (entity.health + value + shieldRetaliate.value) >= 0) {
              shieldRetaliate.expired = false;
              shieldRetaliate.highlight = true;
              if (settingsManager.settings.applyConditions && settingsManager.settings.activeApplyConditions && settingsManager.settings.activeApplyConditionsAuto.indexOf(shieldRetaliateCondition) != -1) {
                this.applyCondition(entity, figure, shieldRetaliateCondition, true, true);
              }
            } else if (shieldRetaliateCondition == ConditionName.retaliate) {
              shieldRetaliate.expired = false;
              shieldRetaliate.highlight = true;
              this.applyCondition(entity, figure, shieldRetaliateCondition, true, true);
            }
          }
        })
      }
    }
  }

  hasCondition(entity: Entity, condition: Condition, permanent: boolean = false): boolean {
    return entity.entityConditions.some((entityCondition) => entityCondition.name == condition.name && entityCondition.state != EntityConditionState.removed && !entityCondition.expired && (!permanent || entityCondition.permanent));
  }

  activeConditions(entity: Entity, expiredIndicator: boolean = false, hidden: boolean = false): EntityCondition[] {
    return entity.entityConditions.filter((value) => (!value.expired || expiredIndicator && value.types.indexOf(ConditionType.expiredIndicator) != -1) && (hidden || value.types.indexOf(ConditionType.hidden) == -1));
  }

  isImmune(entity: Entity, figure: Figure, conditionName: ConditionName, ignoreManual: boolean = false): boolean {
    let immune: boolean = false;

    if (entity.immunities && entity.immunities.indexOf(conditionName) != -1 && !ignoreManual) {
      return true;
    } else if (figure instanceof Monster && entity instanceof MonsterEntity) {
      const stat = gameManager.monsterManager.getStat(figure, entity.type);
      immune = stat != undefined && stat.immunities != undefined && stat.immunities.indexOf(conditionName) != -1;
    } else if (entity instanceof Character) {
      let immunities: ConditionName[] = [];
      if (entity.progress.equippedItems.find((identifier) => identifier.edition == 'gh' && identifier.name == '38')) {
        immunities.push(ConditionName.stun, ConditionName.muddle);
      }
      if (entity.progress.equippedItems.find((identifier) => identifier.edition == 'gh' && identifier.name == '52')) {
        immunities.push(ConditionName.poison, ConditionName.wound);
      }
      if (entity.progress.equippedItems.find((identifier) => identifier.edition == 'gh' && identifier.name == '103')) {
        immunities.push(ConditionName.poison, ConditionName.wound);
      }
      if (entity.progress.equippedItems.find((identifier) => identifier.edition == 'cs' && identifier.name == '57')) {
        immunities.push(ConditionName.muddle);
      }
      if (entity.progress.equippedItems.find((identifier) => identifier.edition == 'fh' && identifier.name == '138')) {
        immunities.push(ConditionName.disarm, ConditionName.stun, ConditionName.muddle);
      }

      if (entity.name == 'blinkblade' && entity.edition == 'fh' && entity.progress.perks[10]) {
        immunities.push(ConditionName.immobilize);
      } else if (entity.name == 'coral' && entity.edition == 'fh' && entity.progress.perks[7]) {
        immunities.push(ConditionName.impair);
      } else if (entity.name == 'prism' && entity.edition == 'fh' && entity.progress.perks[9]) {
        immunities.push(ConditionName.wound);
      }

      immune = immunities.indexOf(conditionName) != -1;
    } else if (entity instanceof Summon) {
      if (figure instanceof Character && figure.name == 'prism' && entity.tags.indexOf('prism_mode') != -1) {
        return true;
      }
    }

    if (!immune) {
      if (conditionName == ConditionName.wound_x) {
        return this.isImmune(entity, figure, ConditionName.wound, ignoreManual);
      } else if (conditionName == ConditionName.poison_x) {
        return this.isImmune(entity, figure, ConditionName.poison, ignoreManual);
      } else if (conditionName == ConditionName.rupture) {
        return this.isImmune(entity, figure, ConditionName.wound, ignoreManual);
      } else if (conditionName == ConditionName.infect) {
        return this.isImmune(entity, figure, ConditionName.poison, ignoreManual);
      } else if (conditionName == ConditionName.chill) {
        return this.isImmune(entity, figure, ConditionName.immobilize, ignoreManual) || this.isImmune(entity, figure, ConditionName.muddle, ignoreManual);
      }
    }

    return immune;
  }

  addCondition(entity: Entity, figure: Figure, condition: Condition, permanent: boolean = false) {
    let entityCondition: EntityCondition | undefined = entity.entityConditions.find((entityCondition) => entityCondition.name == condition.name);
    if (!entityCondition) {
      entityCondition = new EntityCondition(condition.name, condition.value);
      entity.entityConditions.push(entityCondition);
    } else {
      entityCondition.expired = false;
      entityCondition.lastState = entityCondition.state;
      entityCondition.state = EntityConditionState.normal;
    }

    if (!figure.active && entityCondition.types.indexOf(ConditionType.expire) != -1) {
      if (!figure.off && !figure.active) {
        entityCondition.lastState = entityCondition.state;
      }
      entityCondition.state = EntityConditionState.expire;
    } else if (figure.active && entityCondition.types.indexOf(ConditionType.turn) != -1) {
      entityCondition.lastState = entityCondition.state;
      entityCondition.state = EntityConditionState.turn;
    } else if (figure.active && entityCondition.types.indexOf(ConditionType.afterTurn) != -1) {
      entityCondition.state = EntityConditionState.new;
    } else if (!figure.active && entityCondition.types.indexOf(ConditionType.afterTurn) != -1) {
      entityCondition.lastState = EntityConditionState.normal;
    }

    if (figure.off && entityCondition.types.indexOf(ConditionType.turn) != -1) {
      entityCondition.lastState = entityCondition.state;
      entityCondition.state = EntityConditionState.expire;
    }

    entityCondition.permanent = permanent;
    entityCondition.highlight = false;

    // apply Challenge #1487
    if (gameManager.challengesManager.apply && gameManager.challengesManager.isActive(1487, 'fh') && entityCondition.types.indexOf(ConditionType.negative) != -1 && entityCondition.name != ConditionName.wound && entity instanceof Character && !this.isImmune(entity, entity, ConditionName.wound)) {
      this.addCondition(entity, figure, new Condition(ConditionName.wound));
    }

  }

  removeCondition(entity: Entity, figure: Figure, condition: Condition, permanent: boolean = false) {
    entity.entityConditions = entity.entityConditions.filter((entityCondition) => entityCondition.name != condition.name || entityCondition.permanent != permanent);

    // apply Challenge #1525
    if (gameManager.challengesManager.apply && gameManager.challengesManager.isActive(1525, 'fh') && condition.types.indexOf(ConditionType.negative) != -1 && entity instanceof MonsterEntity) {
      this.addCondition(entity, figure, new Condition(ConditionName.strengthen));
    }
  }

  applyCondition(entity: Entity, figure: Figure, name: ConditionName, highlight: boolean = false, autoApply: boolean = false) {
    const condition = entity.entityConditions.find((entityCondition) => entityCondition.name == name && !entityCondition.expired && (entityCondition.types.indexOf(ConditionType.apply) != -1 || entityCondition.types.indexOf(ConditionType.highlightOnly) != -1));

    if (condition && !this.isImmune(entity, figure, condition.name)) {
      if (condition.name == ConditionName.poison || condition.name == ConditionName.poison_x) {
        entity.health -= condition.value;

        const ward = entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state != EntityConditionState.new && entityCondition.name == ConditionName.ward && !this.isImmune(entity, figure, entityCondition.name));
        const brittle = entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state != EntityConditionState.new && entityCondition.name == ConditionName.brittle && !this.isImmune(entity, figure, entityCondition.name));

        if (ward && !brittle) {
          ward.value += condition.value;
        }

        if (brittle && !ward) {
          brittle.value += condition.value;
        }

        this.checkHealth(entity, figure);
      }

      if (condition.name == ConditionName.ward) {
        const value = Math.floor(condition.value / 2);
        if (autoApply) {
          entity.health += condition.value - value;
        } else {
          entity.health += condition.value;
          if (!autoApply) {
            this.checkHealth(entity, figure);
            entity.health -= value;
            const regenerate = entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state != EntityConditionState.new && !entityCondition.permanent && entityCondition.name == ConditionName.regenerate && !this.isImmune(entity, figure, entityCondition.name) && settingsManager.settings.applyConditionsExcludes.indexOf(entityCondition.name) == -1);
            if (regenerate && value > 0) {
              regenerate.expired = true;
            }
            this.checkHealth(entity, figure);
          }
        }
        condition.value = 1;
        condition.expired = true;
      }

      if (condition.name == ConditionName.brittle) {
        if (autoApply) {
          entity.health -= condition.value;
        } else {
          entity.health += condition.value;
          this.checkHealth(entity, figure);
          entity.health -= condition.value * 2;
          this.checkHealth(entity, figure);
        }
        condition.value = 1;
        condition.expired = true;
      }

      if (condition.name == ConditionName.shield) {
        entity.health += condition.value;
        if (!autoApply) {
          this.checkHealth(entity, figure);
        }
        condition.expired = true;
      }

      if (condition.name == ConditionName.retaliate) {
        condition.expired = true;
      }

      if (condition.name == ConditionName.heal) {
        const preventHeal = entity.entityConditions.find((condition) => condition.types.indexOf(ConditionType.preventHeal) != -1 && condition.state != EntityConditionState.expire && !condition.expired && !this.isImmune(entity, figure, condition.name));
        if (preventHeal) {
          entity.health -= condition.value;
        }

        let clearHeal = entity.entityConditions.find((condition) => condition.types.indexOf(ConditionType.clearHeal) != -1 && !condition.permanent && !condition.expired);
        while (clearHeal) {
          clearHeal.lastState = clearHeal.state;
          clearHeal.state = EntityConditionState.expire;
          clearHeal.expired = true;
          clearHeal = entity.entityConditions.find((condition) => condition.types.indexOf(ConditionType.clearHeal) != -1 && !condition.permanent && !condition.expired);
        }

        if (!preventHeal && entity.health - condition.value >= EntityValueFunction(entity.maxHealth)) {
          condition.highlight = false;
        }
        this.checkHealth(entity, figure);
        condition.expired = true;
      }

      if (highlight && settingsManager.settings.animations) {
        condition.highlight = true;
        setTimeout(() => {
          condition.highlight = false;
          gameManager.uiChange.emit();
        }, 1000);
      } else {
        condition.highlight = false;
      }

      if (condition.permanent) {
        condition.expired = false;
      }
    }
  }

  declineApplyCondition(entity: Entity, figure: Figure, name: ConditionName) {
    const condition = entity.entityConditions.find((entityCondition) => entityCondition.name == name && !entityCondition.expired && entityCondition.types.indexOf(ConditionType.apply) != -1);
    if (condition) {
      condition.highlight = false;

      if (!condition.permanent) {
        if (condition.name == ConditionName.heal) {
          condition.expired = true;
        }
        if (condition.name == ConditionName.shield) {
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

  expireConditions(entity: Entity, figure: Figure) {
    entity.entityConditions.forEach((entityCondition) => {
      if (entityCondition.name == ConditionName.chill) {
        if (entityCondition.value == 1 && !entityCondition.permanent) {
          entityCondition.expired = true;
        } else {
          entityCondition.value--;
        }
      }
    })

    let negativeCondition = false;

    entity.entityConditions.forEach((entityCondition) => {
      if (entityCondition.types.indexOf(ConditionType.expire) != -1) {
        if (entityCondition.state == EntityConditionState.expire && !entityCondition.permanent) {
          entityCondition.expired = true;
          if (entityCondition.types.indexOf(ConditionType.negative) != -1) {
            negativeCondition = true;
          }
        }
      }
    })

    if (gameManager.challengesManager.apply && negativeCondition && figure instanceof Monster && !figure.isAlly && entity instanceof MonsterEntity) {
      // apply Challenge #1524
      if (gameManager.challengesManager.isActive(1524, 'fh')) {
        this.changeHealth(entity, figure, -1);
      }

      // apply Challenge #1525
      if (gameManager.challengesManager.isActive(1525, 'fh')) {
        this.addCondition(entity, figure, new Condition(ConditionName.strengthen));
      }
    }
  }

  applyConditionsTurn(entity: Entity, figure: Figure) {

    const regenerateCondition = entity.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.state == EntityConditionState.normal && entityCondition.name == ConditionName.regenerate && !this.isImmune(entity, figure, entityCondition.name) && settingsManager.settings.applyConditionsExcludes.indexOf(entityCondition.name) == -1);

    if (regenerateCondition) {
      const maxHealth = EntityValueFunction(entity.maxHealth);
      const heal = entity.entityConditions.every((entityCondition) => entityCondition.expired || entityCondition.types.indexOf(ConditionType.preventHeal) == -1 || this.isImmune(entity, figure, entityCondition.name)) && entity.health < maxHealth;

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
      if (!this.isImmune(entity, figure, entityCondition.name) && settingsManager.settings.applyConditionsExcludes.indexOf(entityCondition.name) == -1) {
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

    entity.entityConditions.filter((entityCondition) => !entityCondition.expired && entityCondition.types.indexOf(ConditionType.expire) != -1 && !entityCondition.permanent).forEach((entityCondition) => {
      if (entityCondition.state == EntityConditionState.expire && entityCondition.lastState == EntityConditionState.new) {
        entityCondition.lastState = EntityConditionState.normal;
      }
    })
  }

  unapplyConditionsTurn(entity: Entity, figure: Figure) {
    entity.entityConditions.filter((entityCondition) => entityCondition.state == EntityConditionState.turn && entityCondition.types.indexOf(ConditionType.turn) != -1 && settingsManager.settings.applyConditionsExcludes.indexOf(entityCondition.name) == -1).forEach((entityCondition) => {
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

    const regenerateCondition = entity.entityConditions.find((entityCondition) => entityCondition.name == ConditionName.regenerate && settingsManager.settings.applyConditionsExcludes.indexOf(entityCondition.name) == -1);

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
      if (!this.isImmune(entity, figure, entityCondition.name) && settingsManager.settings.applyConditionsExcludes.indexOf(entityCondition.name) == -1) {
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
    entity.entityConditions.filter((entityCondition) => entityCondition.state != EntityConditionState.removed && entityCondition.types.indexOf(ConditionType.afterTurn) != -1 && settingsManager.settings.applyConditionsExcludes.indexOf(entityCondition.name) == -1).forEach((entityCondition) => {
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
      infos.push(prefix + ".char", gameManager.characterManager.characterName(entity))
    } else if (entity instanceof Summon && figure instanceof Character) {
      infos.push(prefix + ".summon", gameManager.characterManager.characterName(figure), "data.summon." + entity.name)
    } else if (figure instanceof ObjectiveContainer && entity instanceof ObjectiveEntity) {
      infos.push(prefix + ".objectiveContainer", figure.title || figure.name && 'data.objective.' + figure.name || figure.escort ? 'escort' : 'objective', "" + entity.number)
    } else if (figure instanceof Monster && entity instanceof MonsterEntity) {
      infos.push(prefix + ".monster", "data.monster." + figure.name, "" + entity.number)
    } else if (figure instanceof Monster) {
      infos.push(prefix + ".monsterEntities", "data.monster." + figure.name)
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

        entity.shield = undefined;
        entity.retaliate = [];
      })
    })
  }

}
