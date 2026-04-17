import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { ActionType } from 'src/app/game/model/data/Action';
import { Condition, ConditionName, ConditionType, EntityCondition, EntityConditionState } from 'src/app/game/model/data/Condition';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { Entity, EntityValueFunction } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { Game, GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { Summon, SummonState } from 'src/app/game/model/Summon';

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
      entities = figure.entities.filter((entity) => this.isAlive(entity, acting) || (!acting && entity.dormant));
    } else if (figure instanceof ObjectiveContainer) {
      entities = figure.entities.filter((entity) => this.isAlive(entity, acting) || (!acting && entity.dormant));
    }
    return entities;
  }

  entitiesAll(figure: Figure, alive: boolean = true, acting: boolean = false): Entity[] {
    const entities: Entity[] = [];
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

  getIndexedEntities(sort: boolean = false): { entity: Entity; figure: Figure }[] {
    const result: { entity: Entity; figure: Figure }[] = [];

    const figures: Figure[] = Object.assign([], this.game.figures);

    figures
      .sort((a, b) => {
        if (sort) {
          return gameManager.sortFiguresByTypeAndName(a, b);
        } else {
          return 0;
        }
      })
      .forEach((figure) => {
        if (figure instanceof Character) {
          result.push({ entity: figure, figure: figure });
          figure.summons.forEach((summon) => {
            result.push({ entity: summon, figure: figure });
          });
        } else if (figure instanceof Monster) {
          figure.entities.forEach((monsterEntity) => {
            result.push({ entity: monsterEntity, figure: figure });
          });
        } else if (figure instanceof ObjectiveContainer) {
          figure.entities.forEach((objectiveEntity) => {
            result.push({ entity: objectiveEntity, figure: figure });
          });
        }
      });

    return result;
  }

  getIndexForEntity(entity: Entity, sort: boolean = false): number {
    let index = -1;
    this.getIndexedEntities(sort).forEach((value, i) => {
      if (value.entity == entity) {
        index = i;
        return;
      }
    });

    return index;
  }

  isAlive(entity: Entity, acting: boolean = false): boolean {
    if (
      (entity.health <= 0 &&
        EntityValueFunction(entity.maxHealth) > 0 &&
        !entity.entityConditions.find((condition) => condition.highlight && condition.types.includes(ConditionType.apply))) ||
      (acting &&
        entity.entityConditions.find(
          (entityCondition) =>
            entityCondition.name == ConditionName.stun &&
            entityCondition.state != EntityConditionState.new &&
            entityCondition.lastState != EntityConditionState.new &&
            entityCondition.state != EntityConditionState.removed
        ))
    ) {
      return false;
    }

    const cast =
      !(entity instanceof Character) &&
      !(entity instanceof MonsterEntity) &&
      !(entity instanceof Summon) &&
      !(entity instanceof ObjectiveEntity);

    if (entity instanceof Character || (cast && 'progress' in entity)) {
      const character = entity as Character;
      return !character.exhausted && !character.absent;
    }

    if (entity instanceof MonsterEntity || (cast && 'number' in entity && 'type' in entity)) {
      const monsterEntity = entity as MonsterEntity;
      return !monsterEntity.dead && !monsterEntity.dormant && (!acting || monsterEntity.summon != SummonState.new);
    }

    if (
      entity instanceof Summon ||
      (cast && 'name' in entity && ('attack' in entity || 'move' in entity || 'range' in entity || 'action' in entity))
    ) {
      const summon = entity as Summon;
      return (
        !summon.dead &&
        !summon.dormant &&
        (!acting ||
          ((!summon.passive || !settingsManager.settings.passiveSummons || !settingsManager.settings.activeSummons) &&
            summon.state != SummonState.new))
      );
    }

    if (entity instanceof ObjectiveEntity || (cast && 'uuid' in entity && 'marker' in entity)) {
      const objectiveEntity = entity as ObjectiveEntity;
      return !objectiveEntity.dead && !objectiveEntity.dormant;
    }

    return false;
  }

  checkHealth(entity: Entity, figure: Figure) {
    let maxHealth = EntityValueFunction(entity.maxHealth);

    if (
      entity instanceof Character &&
      !entity.absent &&
      entity.name == 'lightning' &&
      entity.tags.find((tag) => tag === 'unbridled-power')
    ) {
      maxHealth = Math.max(maxHealth, 26);
    }

    if (maxHealth > 0 && entity.health > maxHealth) {
      entity.health = maxHealth;
    }

    if (
      maxHealth > 0 &&
      entity.health <= 0 &&
      !entity.entityConditions.find(
        (condition) =>
          settingsManager.settings.applyConditions &&
          settingsManager.settings.activeApplyConditions &&
          condition.highlight &&
          condition.types.includes(ConditionType.apply) &&
          !settingsManager.settings.activeApplyConditionsExcludes.includes(condition.name) &&
          !settingsManager.settings.activeApplyConditionsAuto.includes(condition.name)
      )
    ) {
      if (entity instanceof Character && (!entity.off || !entity.exhausted)) {
        entity.off = true;
        entity.exhausted = true;
      } else if ((entity instanceof MonsterEntity || entity instanceof Summon || entity instanceof ObjectiveEntity) && !entity.dead) {
        entity.dead = true;
        setTimeout(
          () => {
            gameManager.triggerUiChange(false);
          },
          settingsManager.settings.animations ? 1500 * settingsManager.settings.animationSpeed : 0
        );
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

    if (entity instanceof ObjectiveEntity && figure instanceof ObjectiveContainer && figure.objectiveId) {
      const objectiveData = gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(figure.objectiveId);
      if (!!objectiveData && objectiveData.trackDamage && entity.health <= 0) {
        entity.health = 0;
      }
    }
  }

  changeHealth(entity: Entity, figure: Figure, value: number, damageOnly: boolean = false) {
    this.changeHealthHighlightConditions(entity, figure, value, damageOnly);
    entity.health += value;
    this.checkHealth(entity, figure);
    if (settingsManager.settings.scenarioStats && value != 0) {
      if (value > 0) {
        gameManager.scenarioStatsManager.applyHeal(entity, figure, value);
      } else {
        gameManager.scenarioStatsManager.applyDamage(entity, figure, value * -1);
      }
    }

    if (
      value < 1 &&
      entity instanceof Character &&
      !entity.absent &&
      gameManager.trialsManager.apply &&
      gameManager.trialsManager.trialsEnabled &&
      entity.progress.trial &&
      entity.progress.trial.edition == 'fh' &&
      entity.progress.trial.name == '356' &&
      !entity.tags.includes('trial-fh-356')
    ) {
      entity.tags.push('trial-fh-356');
    }
  }

  changeHealthHighlightConditions(entity: Entity, figure: Figure, value: number, damageOnly: boolean = false) {
    if (settingsManager.settings.applyConditions) {
      const regenerate = entity.entityConditions.find(
        (entityCondition) =>
          !entityCondition.expired &&
          entityCondition.state != EntityConditionState.new &&
          !entityCondition.permanent &&
          entityCondition.name == ConditionName.regenerate &&
          !this.isImmune(entity, figure, entityCondition.name) &&
          !settingsManager.settings.applyConditionsExcludes.includes(entityCondition.name)
      );

      if (regenerate && value < 0) {
        regenerate.expired = true;
      }

      this.sufferDamageHighlightConditions(entity, figure, value, damageOnly);

      if (
        regenerate &&
        entity.entityConditions.find(
          (entityCondition) =>
            !entityCondition.expired &&
            entityCondition.state != EntityConditionState.new &&
            entityCondition.name == ConditionName.ward &&
            entityCondition.highlight &&
            !this.isImmune(entity, figure, entityCondition.name)
        )
      ) {
        regenerate.expired = false;
      }

      if (entity.health + value > entity.health) {
        const clearHeal = entity.entityConditions.find(
          (condition) =>
            condition.types.includes(ConditionType.clearHeal) && !condition.expired && !this.isImmune(entity, figure, condition.name)
        );
        let heal = entity.entityConditions.find((condition) => condition.name == ConditionName.heal);
        if (clearHeal && (!heal || heal.expired || !heal.highlight)) {
          if (!heal) {
            heal = new EntityCondition(ConditionName.heal, value);
            entity.entityConditions.push(heal);
          }
          heal.expired = false;
          heal.highlight = true;
          heal.value = value;

          if (
            settingsManager.settings.applyConditions &&
            settingsManager.settings.activeApplyConditions &&
            settingsManager.settings.activeApplyConditionsAuto.includes(ConditionName.heal)
          ) {
            this.applyCondition(entity, figure, ConditionName.heal, true);
          }
        }
      }
    }
  }

  sufferDamageHighlightConditions(entity: Entity, figure: Figure, value: number, damageOnly: boolean = false) {
    if (settingsManager.settings.applyConditions) {
      if (value < 0 && !damageOnly) {
        let shieldValue = 0;
        [ConditionName.retaliate, ConditionName.shield].forEach((shieldRetaliateCondition) => {
          let shieldRetaliate = entity.entityConditions.find((condition) => condition.name == shieldRetaliateCondition);
          if (!shieldRetaliate || shieldRetaliate.expired || !shieldRetaliate.highlight) {
            if (!shieldRetaliate) {
              shieldRetaliate = new EntityCondition(shieldRetaliateCondition, 0);
              entity.entityConditions.push(shieldRetaliate);
            }

            shieldRetaliate.value = 0;

            const actionHints = gameManager.actionsManager.calcActionHints(figure, entity);
            actionHints.forEach((actionHint) => {
              if (
                shieldRetaliate &&
                ((shieldRetaliateCondition == ConditionName.shield && actionHint.type == ActionType.shield) ||
                  (shieldRetaliateCondition == ConditionName.retaliate && actionHint.type == ActionType.retaliate))
              ) {
                shieldRetaliate.value += actionHint.value;
              }
            });

            if (
              shieldRetaliateCondition == ConditionName.shield &&
              shieldRetaliate.value &&
              entity.health + value + shieldRetaliate.value > 0
            ) {
              shieldRetaliate.expired = false;
              shieldRetaliate.highlight = true;
              shieldValue = shieldRetaliate.value;
              if (
                settingsManager.settings.applyConditions &&
                settingsManager.settings.activeApplyConditions &&
                settingsManager.settings.activeApplyConditionsAuto.includes(shieldRetaliateCondition)
              ) {
                this.applyCondition(entity, figure, shieldRetaliateCondition, true, true);
                this.sufferDamageHighlightConditions(entity, figure, value + shieldRetaliate.value, true);
                return;
              }
            } else if (shieldRetaliateCondition == ConditionName.retaliate && shieldRetaliate.value) {
              shieldRetaliate.expired = false;
              shieldRetaliate.highlight = true;
              this.applyCondition(entity, figure, shieldRetaliateCondition, true, true);
              this.sufferDamageHighlightConditions(entity, figure, value + shieldRetaliate.value, true);
              return;
            }
          }
        });

        entity.entityConditions
          .filter((entityCondition) => entityCondition.name == ConditionName.poison || entityCondition.name == ConditionName.poison_x)
          .forEach((entityCondition) => {
            if (
              value < 0 &&
              !entityCondition.expired &&
              entityCondition.state != EntityConditionState.new &&
              entity.health + value > -shieldValue &&
              !this.isImmune(entity, figure, entityCondition.name)
            ) {
              entityCondition.highlight = true;
            } else {
              entityCondition.highlight = false;
            }
          });
      }

      const ward = entity.entityConditions.find(
        (entityCondition) =>
          !entityCondition.expired &&
          entityCondition.state != EntityConditionState.new &&
          entityCondition.name == ConditionName.ward &&
          !this.isImmune(entity, figure, entityCondition.name)
      );
      const brittle = entity.entityConditions.find(
        (entityCondition) =>
          !entityCondition.expired &&
          entityCondition.state != EntityConditionState.new &&
          entityCondition.name == ConditionName.brittle &&
          !this.isImmune(entity, figure, entityCondition.name)
      );

      const ignorePoison =
        (!entity.entityConditions.find(
          (entityCondition) =>
            !entityCondition.expired &&
            entityCondition.state != EntityConditionState.new &&
            entityCondition.name == ConditionName.poison &&
            !this.isImmune(entity, figure, entityCondition.name)
        ) ||
          settingsManager.settings.applyConditionsExcludes.includes(ConditionName.poison)) &&
        (!entity.entityConditions.find(
          (entityCondition) =>
            !entityCondition.expired &&
            entityCondition.state != EntityConditionState.new &&
            entityCondition.name == ConditionName.poison_x &&
            !this.isImmune(entity, figure, entityCondition.name)
        ) ||
          settingsManager.settings.applyConditionsExcludes.includes(ConditionName.poison_x));

      if (value < 0 && ward && !brittle && entity.health + value - Math.floor(value / 2) > 0) {
        ward.value = value * -1;
        ward.highlight = true;

        if (
          settingsManager.settings.applyConditions &&
          settingsManager.settings.activeApplyConditions &&
          settingsManager.settings.activeApplyConditionsAuto.includes(ConditionName.ward) &&
          ignorePoison
        ) {
          this.applyCondition(entity, figure, ConditionName.ward, true, true);
        }
      } else if (ward) {
        ward.highlight = false;
      }

      if (brittle && !ward && value < 0 && entity.health + value > 0) {
        brittle.value = value * -1;
        brittle.highlight = true;

        if (
          settingsManager.settings.applyConditions &&
          settingsManager.settings.activeApplyConditions &&
          settingsManager.settings.activeApplyConditionsAuto.includes(ConditionName.brittle) &&
          ignorePoison
        ) {
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
          ward.expired = true;
        }
      }

      if ((brittle && brittle.highlight) || (ward && ward.highlight)) {
        gameManager.triggerUiChange(false);
      }
    }

    if (
      value < 0 &&
      !damageOnly &&
      settingsManager.settings.calculateAdvantageStats &&
      settingsManager.settings.animations &&
      this.game.figures.find((figure) => figure instanceof Character && figure.active) &&
      figure instanceof Monster &&
      entity instanceof MonsterEntity
    ) {
      const character = this.game.figures.find((figure) => figure instanceof Character && figure.active) as Character;
      const existingMuddle = character.entityConditions.find((e) => e.name == ConditionName.muddle && !e.expired);
      const existingStrengthen = character.entityConditions.find((e) => e.name == ConditionName.strengthen && !e.expired);
      if (
        existingMuddle ||
        (gameManager.monsterManager.getStat(figure, entity.type).actions &&
          gameManager.monsterManager.getStat(figure, entity.type).actions.find((action) => action.value == '%game.custom.disadvantage%'))
      ) {
        if (!existingStrengthen) {
          const muddle = existingMuddle ? existingMuddle : new EntityCondition(ConditionName.muddle);
          muddle.highlight = true;
          if (!existingMuddle) {
            muddle.types.push(ConditionType.hidden);
            character.entityConditions.push(muddle);
          }
          setTimeout(() => {
            muddle.highlight = false;
            if (!existingMuddle) {
              character.entityConditions.splice(character.entityConditions.indexOf(muddle), 1);
            }
            gameManager.triggerUiChange(false);
          }, 1000 * settingsManager.settings.animationSpeed);
        }
      } else if (existingStrengthen && !existingMuddle) {
        existingStrengthen.highlight = true;
        setTimeout(() => {
          existingStrengthen.highlight = false;
          gameManager.triggerUiChange(false);
        }, 1000 * settingsManager.settings.animationSpeed);
      }
    }
  }

  hasCondition(entity: Entity, condition: Condition, permanent: boolean = false): boolean {
    return entity.entityConditions.some(
      (entityCondition) =>
        entityCondition.name == condition.name &&
        entityCondition.state != EntityConditionState.removed &&
        !entityCondition.expired &&
        (!permanent || entityCondition.permanent)
    );
  }

  activeConditions(entity: Entity, expiredIndicator: boolean = false, hidden: boolean = false): EntityCondition[] {
    return entity.entityConditions.filter(
      (value) =>
        (!value.expired || (expiredIndicator && value.types.includes(ConditionType.expiredIndicator))) &&
        (hidden || !value.types.includes(ConditionType.hidden))
    );
  }

  isImmune(entity: Entity, figure: Figure, conditionName: ConditionName, ignoreManual: boolean = false): boolean {
    let immune: boolean = false;

    if (entity instanceof ObjectiveEntity && figure instanceof ObjectiveContainer && !figure.escort) {
      return true;
    }

    if (entity.immunities && entity.immunities.includes(conditionName) && !ignoreManual) {
      return true;
    } else if (figure instanceof Monster && entity instanceof MonsterEntity) {
      const stat = gameManager.monsterManager.getStat(figure, entity.type);
      immune = stat != undefined && stat.immunities != undefined && stat.immunities.includes(conditionName);
    } else if (entity instanceof Character) {
      const immunities: ConditionName[] = [];
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

      if (entity.perks) {
        entity.perks.forEach((perk) => {
          const index = entity.perks.indexOf(perk);
          if (
            perk.immunity &&
            ((perk.combined && entity.progress.perks[index] >= perk.count) || (!perk.combined && entity.progress.perks[index] >= 1))
          ) {
            immunities.push(perk.immunity as ConditionName);
          }
        });
      }

      immune = immunities.includes(conditionName);
    } else if (entity instanceof Summon) {
      if (figure instanceof Character && !figure.absent && figure.name == 'prism' && entity.tags.includes('prism_mode')) {
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
        return (
          this.isImmune(entity, figure, ConditionName.immobilize, ignoreManual) ||
          this.isImmune(entity, figure, ConditionName.muddle, ignoreManual)
        );
      }
    }

    if (
      !immune &&
      !new Condition(conditionName).types.includes(ConditionType.entity) &&
      !new Condition(conditionName).types.includes(ConditionType.hidden)
    ) {
      let type: ConditionType | undefined;
      if (entity instanceof Character) {
        type = ConditionType.character;
      } else if (entity instanceof MonsterEntity || entity instanceof Summon) {
        type = ConditionType.monster;
      } else if (entity instanceof ObjectiveEntity && figure instanceof ObjectiveContainer && figure.escort) {
        type = ConditionType.objective;
      }

      if (!type || !new Condition(conditionName).types.includes(type)) {
        immune = true;
      }
    }

    return immune;
  }

  addCondition(entity: Entity, figure: Figure, condition: Condition, permanent: boolean = false) {
    let entityCondition: EntityCondition | undefined = entity.entityConditions.find(
      (entityCondition) => entityCondition.name == condition.name
    );
    if (!entityCondition) {
      entityCondition = new EntityCondition(condition.name, condition.value);
      entity.entityConditions.push(entityCondition);
    } else {
      entityCondition.expired = false;
      entityCondition.lastState = entityCondition.state;
      entityCondition.state = EntityConditionState.normal;
    }

    if (!figure.active && entityCondition.types.includes(ConditionType.expire)) {
      if (!figure.off && !figure.active) {
        entityCondition.lastState = entityCondition.state;
      }
      entityCondition.state = EntityConditionState.expire;
    } else if (figure.active && entityCondition.types.includes(ConditionType.turn)) {
      entityCondition.lastState = entityCondition.state;
      entityCondition.state = EntityConditionState.turn;
    } else if (figure.active && entityCondition.types.includes(ConditionType.afterTurn)) {
      entityCondition.state = EntityConditionState.new;
    } else if (!figure.active && entityCondition.types.includes(ConditionType.afterTurn)) {
      entityCondition.lastState = EntityConditionState.normal;
    }

    if (figure.off && entityCondition.types.includes(ConditionType.turn)) {
      entityCondition.lastState = entityCondition.state;
      entityCondition.state = EntityConditionState.expire;
    }

    entityCondition.permanent = permanent;
    entityCondition.highlight = false;

    // apply Challenge #1487
    if (
      gameManager.challengesManager.apply &&
      gameManager.challengesManager.isActive(1487, 'fh') &&
      entityCondition.types.includes(ConditionType.negative) &&
      entityCondition.name != ConditionName.wound &&
      entity instanceof Character &&
      !this.isImmune(entity, entity, ConditionName.wound)
    ) {
      this.addCondition(entity, figure, new Condition(ConditionName.wound));
    }

    if (
      settingsManager.settings.applyConditions &&
      !settingsManager.settings.applyConditionsExcludes.includes(ConditionName.safeguard) &&
      this.hasCondition(entity, new Condition(ConditionName.safeguard)) &&
      entityCondition.types.includes(ConditionType.negative)
    ) {
      this.removeCondition(entity, figure, entityCondition);
      this.removeCondition(entity, figure, new Condition(ConditionName.safeguard));
    }
  }

  removeCondition(entity: Entity, figure: Figure, condition: Condition, permanent: boolean = false) {
    entity.entityConditions = entity.entityConditions.filter(
      (entityCondition) => entityCondition.name != condition.name || entityCondition.permanent != permanent
    );

    // apply Challenge #1525
    if (
      gameManager.challengesManager.apply &&
      gameManager.challengesManager.isActive(1525, 'fh') &&
      condition.types.includes(ConditionType.negative) &&
      entity instanceof MonsterEntity
    ) {
      this.addCondition(entity, figure, new Condition(ConditionName.strengthen));
    }
  }

  applyCondition(entity: Entity, figure: Figure, name: ConditionName, highlight: boolean = false, autoApply: boolean = false) {
    const condition = entity.entityConditions.find(
      (entityCondition) =>
        entityCondition.name == name &&
        !entityCondition.expired &&
        (entityCondition.types.includes(ConditionType.apply) || entityCondition.types.includes(ConditionType.highlightOnly))
    );

    if (condition && !this.isImmune(entity, figure, condition.name)) {
      if (condition.name == ConditionName.poison || condition.name == ConditionName.poison_x) {
        entity.health -= condition.value;

        const ward = entity.entityConditions.find(
          (entityCondition) =>
            !entityCondition.expired &&
            entityCondition.state != EntityConditionState.new &&
            entityCondition.name == ConditionName.ward &&
            !this.isImmune(entity, figure, entityCondition.name)
        );
        const brittle = entity.entityConditions.find(
          (entityCondition) =>
            !entityCondition.expired &&
            entityCondition.state != EntityConditionState.new &&
            entityCondition.name == ConditionName.brittle &&
            !this.isImmune(entity, figure, entityCondition.name)
        );

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
            const regenerate = entity.entityConditions.find(
              (entityCondition) =>
                !entityCondition.expired &&
                entityCondition.state != EntityConditionState.new &&
                !entityCondition.permanent &&
                entityCondition.name == ConditionName.regenerate &&
                !this.isImmune(entity, figure, entityCondition.name) &&
                !settingsManager.settings.applyConditionsExcludes.includes(entityCondition.name)
            );
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

        const ward = entity.entityConditions.find(
          (entityCondition) =>
            !entityCondition.expired &&
            entityCondition.state != EntityConditionState.new &&
            entityCondition.name == ConditionName.ward &&
            !this.isImmune(entity, figure, entityCondition.name)
        );
        if (ward && ward.highlight) {
          ward.value -= condition.value;
        }
        const brittle = entity.entityConditions.find(
          (entityCondition) =>
            !entityCondition.expired &&
            entityCondition.state != EntityConditionState.new &&
            entityCondition.name == ConditionName.brittle &&
            !this.isImmune(entity, figure, entityCondition.name)
        );
        if (brittle && brittle.highlight) {
          brittle.value -= condition.value;
        }
      }

      if (condition.name == ConditionName.retaliate) {
        condition.expired = true;
      }

      if (condition.name == ConditionName.heal) {
        const preventHeal = entity.entityConditions.find(
          (condition) =>
            condition.types.includes(ConditionType.preventHeal) &&
            condition.state != EntityConditionState.expire &&
            !condition.expired &&
            !this.isImmune(entity, figure, condition.name)
        );
        if (preventHeal) {
          entity.health -= condition.value;
        }

        let clearHeal = entity.entityConditions.find(
          (condition) => condition.types.includes(ConditionType.clearHeal) && !condition.permanent && !condition.expired
        );
        while (clearHeal) {
          clearHeal.lastState = clearHeal.state;
          clearHeal.state = EntityConditionState.expire;
          clearHeal.expired = true;
          clearHeal = entity.entityConditions.find(
            (condition) => condition.types.includes(ConditionType.clearHeal) && !condition.permanent && !condition.expired
          );
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
          gameManager.triggerUiChange(false);
        }, 1000 * settingsManager.settings.animationSpeed);
      } else {
        condition.highlight = false;
      }

      if (condition.permanent) {
        condition.expired = false;
      }
    }
  }

  declineApplyCondition(entity: Entity, figure: Figure, name: ConditionName) {
    const condition = entity.entityConditions.find(
      (entityCondition) => entityCondition.name == name && !entityCondition.expired && entityCondition.types.includes(ConditionType.apply)
    );
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

      if (entityCondition.types.includes(ConditionType.expire)) {
        if (entityCondition.expired) {
          entityCondition.expired = false;
        }
      }
    });
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
    });

    let negativeCondition = false;

    entity.entityConditions.forEach((entityCondition) => {
      if (entityCondition.types.includes(ConditionType.expire)) {
        if (entityCondition.state == EntityConditionState.expire && !entityCondition.permanent) {
          entityCondition.expired = true;
          if (entityCondition.types.includes(ConditionType.negative)) {
            negativeCondition = true;
          }
        }
      }
    });

    if (
      gameManager.challengesManager.apply &&
      negativeCondition &&
      figure instanceof Monster &&
      !figure.isAlly &&
      entity instanceof MonsterEntity
    ) {
      // apply Challenge #1524
      if (gameManager.challengesManager.isActive(1524, 'fh')) {
        this.changeHealth(entity, figure, -1, true);
      }

      // apply Challenge #1525
      if (gameManager.challengesManager.isActive(1525, 'fh')) {
        this.addCondition(entity, figure, new Condition(ConditionName.strengthen));
      }
    }
  }

  applyConditionsTurn(entity: Entity, figure: Figure) {
    const regenerateCondition = entity.entityConditions.find(
      (entityCondition) =>
        !entityCondition.expired &&
        entityCondition.state == EntityConditionState.normal &&
        entityCondition.name == ConditionName.regenerate &&
        !this.isImmune(entity, figure, entityCondition.name) &&
        !settingsManager.settings.applyConditionsExcludes.includes(entityCondition.name)
    );

    if (regenerateCondition) {
      const maxHealth = EntityValueFunction(entity.maxHealth);
      const heal =
        entity.entityConditions.every(
          (entityCondition) =>
            entityCondition.expired ||
            !entityCondition.types.includes(ConditionType.preventHeal) ||
            this.isImmune(entity, figure, entityCondition.name)
        ) && entity.health < maxHealth;

      entity.entityConditions
        .filter(
          (entityCondition) =>
            !entityCondition.expired && entityCondition.types.includes(ConditionType.clearHeal) && !entityCondition.permanent
        )
        .forEach((entityCondition) => {
          entityCondition.expired = true;
          entityCondition.lastState = entityCondition.state;
          entityCondition.state = EntityConditionState.removed;
        });

      if (heal) {
        let clearHeal = entity.entityConditions.find(
          (condition) =>
            condition.types.includes(ConditionType.clearHeal) &&
            condition.state != EntityConditionState.expire &&
            condition.state != EntityConditionState.new &&
            !condition.permanent &&
            !condition.expired
        );
        while (clearHeal) {
          clearHeal.lastState = clearHeal.state;
          clearHeal.state = EntityConditionState.expire;
          clearHeal.expired = true;
          clearHeal = entity.entityConditions.find(
            (condition) =>
              condition.types.includes(ConditionType.clearHeal) &&
              condition.state != EntityConditionState.expire &&
              condition.state != EntityConditionState.new &&
              !condition.permanent &&
              !condition.expired
          );
        }
        regenerateCondition.lastState = regenerateCondition.state;
        regenerateCondition.state = EntityConditionState.expire;
        entity.health += regenerateCondition.value;
        this.checkHealth(entity, figure);
      }

      regenerateCondition.highlight = true;
      setTimeout(() => {
        regenerateCondition.highlight = false;
      }, 1000 * settingsManager.settings.animationSpeed);
    }

    if (
      entity instanceof Character &&
      entity.progress.equippedItems.find((identifier) => identifier.edition == 'fh' && identifier.name == '178') &&
      entity.initiative >= 60 &&
      !entity.longRest
    ) {
      entity.health = entity.health + 1;
      entity.entityConditions.push(new EntityCondition(ConditionName.heal, 1));
      this.applyCondition(entity, figure, ConditionName.heal, true);
    }

    entity.entityConditions
      .filter(
        (entityCondition) =>
          !entityCondition.expired &&
          entityCondition.state == EntityConditionState.normal &&
          entityCondition.types.includes(ConditionType.turn)
      )
      .forEach((entityCondition) => {
        if (
          !this.isImmune(entity, figure, entityCondition.name) &&
          !settingsManager.settings.applyConditionsExcludes.includes(entityCondition.name)
        ) {
          entityCondition.lastState = entityCondition.state;
          entityCondition.state = EntityConditionState.turn;
          if (entityCondition.name == ConditionName.wound || entityCondition.name == ConditionName.wound_x) {
            entity.health = entity.health - entityCondition.value;

            if (
              figure instanceof Monster &&
              !figure.isAlly &&
              gameManager.characterManager.getActiveCharacters().find((c) => c.tags.includes('call-of-the-grave'))
            ) {
              entity.health = entity.health - 1;
            }

            if (
              entity instanceof Character &&
              entity.progress.equippedItems.find((identifier) => identifier.edition == 'cs' && identifier.name == '71')
            ) {
              entity.health = entity.health + entityCondition.value + 1;
              entity.entityConditions.push(new EntityCondition(ConditionName.heal, 1));
              this.applyCondition(entity, figure, ConditionName.heal, true);
            }

            this.checkHealth(entity, figure);

            entityCondition.highlight = true;
            setTimeout(() => {
              entityCondition.highlight = false;
              if (
                !(entity instanceof Character) ||
                !entity.progress.equippedItems.find((identifier) => identifier.edition == 'cs' && identifier.name == '71')
              ) {
                this.sufferDamageHighlightConditions(entity, figure, -entityCondition.value, true);
                this.checkHealth(entity, figure);
              }
            }, 1000 * settingsManager.settings.animationSpeed);
          }
        }
      });

    entity.entityConditions
      .filter(
        (entityCondition) =>
          !entityCondition.expired && entityCondition.types.includes(ConditionType.afterTurn) && !entityCondition.permanent
      )
      .forEach((entityCondition) => {
        if (entityCondition.state == EntityConditionState.normal) {
          entityCondition.lastState = entityCondition.state;
          entityCondition.state = EntityConditionState.turn;
        } else if (entityCondition.state == EntityConditionState.new && entityCondition.lastState != EntityConditionState.new) {
          entityCondition.lastState = entityCondition.state;
          entityCondition.state = EntityConditionState.normal;
        }
      });

    entity.entityConditions
      .filter(
        (entityCondition) => !entityCondition.expired && entityCondition.types.includes(ConditionType.expire) && !entityCondition.permanent
      )
      .forEach((entityCondition) => {
        if (entityCondition.state == EntityConditionState.expire && entityCondition.lastState == EntityConditionState.new) {
          entityCondition.lastState = EntityConditionState.normal;
        }
      });
  }

  unapplyConditionsTurn(entity: Entity, figure: Figure) {
    entity.entityConditions
      .filter(
        (entityCondition) =>
          entityCondition.state == EntityConditionState.turn &&
          entityCondition.types.includes(ConditionType.turn) &&
          !settingsManager.settings.applyConditionsExcludes.includes(entityCondition.name)
      )
      .forEach((entityCondition) => {
        if (entityCondition.expired) {
          entityCondition.expired = false;
        } else {
          entityCondition.lastState = entityCondition.state;
          entityCondition.state = EntityConditionState.normal;
          if (entityCondition.name == ConditionName.wound || entityCondition.name == ConditionName.wound_x) {
            entity.health = entity.health + entityCondition.value;
            if (
              figure instanceof Monster &&
              !figure.isAlly &&
              gameManager.characterManager.getActiveCharacters().find((c) => c.tags.includes('call-of-the-grave'))
            ) {
              entity.health = entity.health + 1;
            }
            this.checkHealth(entity, figure);
          }
        }
      });

    const regenerateCondition = entity.entityConditions.find(
      (entityCondition) =>
        entityCondition.name == ConditionName.regenerate && !settingsManager.settings.applyConditionsExcludes.includes(entityCondition.name)
    );

    if (regenerateCondition) {
      const heal =
        entity.entityConditions.every((entityCondition) => !entityCondition.types.includes(ConditionType.preventHeal)) &&
        regenerateCondition.state == EntityConditionState.expire;

      entity.entityConditions
        .filter((entityCondition) => entityCondition.expired && entityCondition.types.includes(ConditionType.clearHeal))
        .forEach((entityCondition) => (entityCondition.expired = false));

      if (heal) {
        regenerateCondition.lastState = regenerateCondition.state;
        regenerateCondition.state = EntityConditionState.normal;
        entity.health -= regenerateCondition.value;
        this.checkHealth(entity, figure);
      }
    }

    if (
      entity instanceof Character &&
      entity.progress.equippedItems.find((identifier) => identifier.edition == 'fh' && identifier.name == '178') &&
      entity.initiative >= 60 &&
      !entity.longRest &&
      entity.entityConditions.find((condition) => condition.name == ConditionName.heal && condition.value == 1 && condition.expired)
    ) {
      entity.entityConditions = entity.entityConditions.filter(
        (condition) => condition.name != ConditionName.heal || condition.value != 1 || !condition.expired
      );
      entity.health = entity.health - 1;
    }
  }

  applyConditionsAfter(entity: Entity, figure: Figure) {
    entity.entityConditions
      .filter((entityCondition) => !entityCondition.expired && entityCondition.types.includes(ConditionType.afterTurn))
      .forEach((entityCondition) => {
        if (
          !this.isImmune(entity, figure, entityCondition.name) &&
          !settingsManager.settings.applyConditionsExcludes.includes(entityCondition.name)
        ) {
          if (entityCondition.state == EntityConditionState.turn) {
            if (entityCondition.name == ConditionName.bane) {
              this.changeHealth(entity, figure, -10, true);
              entityCondition.expired = true;
              entityCondition.highlight = true;
              setTimeout(() => {
                entityCondition.highlight = false;
              }, 1000 * settingsManager.settings.animationSpeed);
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
      });
  }

  unapplyConditionsAfter(entity: Entity, figure: Figure) {
    entity.entityConditions
      .filter(
        (entityCondition) =>
          entityCondition.state != EntityConditionState.removed &&
          entityCondition.types.includes(ConditionType.afterTurn) &&
          !settingsManager.settings.applyConditionsExcludes.includes(entityCondition.name)
      )
      .forEach((entityCondition) => {
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
      });
  }

  highlightedConditions(entity: Entity): EntityCondition[] {
    return entity.entityConditions
      .filter((entityCondition) => entityCondition.highlight)
      .sort((a, b) => b.types.indexOf(ConditionType.double) - a.types.indexOf(ConditionType.double));
  }

  hasMarker(entity: Entity, marker: string) {
    return entity.markers && entity.markers.includes(marker);
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

  figureForEntity(entity: Entity): Figure {
    let result: Figure | undefined;
    if (entity instanceof Character) {
      result = entity;
    } else if (entity instanceof Summon) {
      result = this.game.figures.find((figure) => figure instanceof Character && figure.summons.includes(entity));
    } else if (entity instanceof MonsterEntity) {
      result = this.game.figures.find((figure) => figure instanceof Monster && figure.entities.includes(entity));
    } else if (entity instanceof ObjectiveEntity) {
      result = this.game.figures.find((figure) => figure instanceof ObjectiveContainer && figure.entities.includes(entity));
    }

    if (!result) {
      console.warn('No figure found for entity:', entity);
      return new Monster(new MonsterData());
    }
    return result;
  }

  before(entity: Entity | undefined, figure: Figure | undefined, info: string, ...values: (string | number | boolean)[]) {
    this.beforeEntities(entity, figure, [], info, ...values);
  }

  beforeEntities(
    entity: Entity | undefined,
    figure: Figure | undefined,
    entities: Entity[],
    info: string,
    ...values: (string | number | boolean)[]
  ) {
    let type = '';
    if (entity instanceof MonsterEntity) {
      type = '.monsterEntity';
    } else if (entity instanceof Character) {
      type = '.character';
    } else if (entity instanceof Summon) {
      type = '.summon';
    } else if (entity instanceof ObjectiveEntity) {
      type = '.objectiveEntity';
    } else if (figure instanceof Monster) {
      type = '.monsters';
    } else if (figure instanceof Character) {
      type = '.summons';
    } else if (figure instanceof ObjectiveContainer && entities.length > 1) {
      type = '.objectives';
    } else if (figure instanceof ObjectiveContainer) {
      type = '.objective';
    }

    gameManager.stateManager.before(
      'entities.' + info + type,
      ...values,
      ...this.titleInfo(entity, figure),
      entities.map((entity) => this.titleInfo(entity, undefined)).join(', ')
    );
  }

  undoInfos(entity: Entity | undefined, figure: Figure, prefix: string): (string | number | boolean)[] {
    const infos: (string | number | boolean)[] = [];
    if (entity instanceof Character && figure instanceof Character) {
      infos.push(prefix + '.char');
    } else if (entity instanceof Summon && figure instanceof Character) {
      infos.push(prefix + '.summon');
    } else if (figure instanceof ObjectiveContainer && entity instanceof ObjectiveEntity) {
      infos.push(prefix + '.objectiveContainer');
    } else if (figure instanceof Monster && entity instanceof MonsterEntity) {
      infos.push(prefix + '.monster');
    } else if (figure instanceof Monster) {
      infos.push(prefix + '.monsterEntities');
    }

    infos.push(...this.titleInfo(entity, figure));

    return infos;
  }

  titleInfo(entity: Entity | undefined = undefined, figure: Figure | undefined = undefined): (string | number | boolean)[] {
    const statEffect = figure instanceof Monster && !!figure.statEffect && figure.statEffect.name;
    if (entity instanceof Character) {
      return [gameManager.characterManager.characterName(entity, true, true)];
    } else if (entity instanceof Summon && figure instanceof Character) {
      return [
        gameManager.characterManager.characterName(figure, true, true),
        entity.name ? '%data.summon.' + entity.name + '%' : entity.number
      ];
    } else if (entity instanceof Summon) {
      return ['%data.summon.' + entity.name + '%'];
    } else if (figure instanceof ObjectiveContainer && entity instanceof ObjectiveEntity) {
      return [
        '%game.objectiveIcon.' +
          (figure.escort ? 'escort' : 'objective') +
          '% ' +
          (figure.title || (figure.name && '%data.objective.' + figure.name + '%') || (figure.escort ? '%escort%' : '%objective%')),
        '%game.objectiveMarker.' + entity.number + '%'
      ];
    } else if (entity instanceof ObjectiveEntity) {
      return ['%game.objectiveMarker.' + entity.number + '%'];
    } else if (figure instanceof Monster && entity instanceof MonsterEntity) {
      return [
        (statEffect ? '%data.monster.' + statEffect + '%&nbsp(' : '') + '%data.monster.' + figure.name + '%' + (statEffect ? ')' : ''),
        '%game.monsterType.' + entity.type + '.' + entity.number + '%'
      ];
    }
    if (entity instanceof MonsterEntity) {
      return ['%game.monsterType.' + entity.type + '.' + entity.number + '%'];
    } else if (figure instanceof Character) {
      return [gameManager.characterManager.characterName(figure, true, true)];
    } else if (figure instanceof Monster) {
      return [
        (statEffect ? '%data.monster.' + statEffect + '%&nbsp(' : '') + '%data.monster.' + figure.name + '%' + (statEffect ? ')' : '')
      ];
    } else if (figure instanceof ObjectiveContainer) {
      return [
        '%game.objectiveIcon.' +
          (figure.escort ? 'escort' : 'objective') +
          '% ' +
          (figure.title || (figure.name && '%data.objective.' + figure.name + '%') || (figure.escort ? '%escort%' : '%objective%'))
      ];
    }

    return [];
  }

  next() {
    this.game.figures.forEach((figure) => {
      this.entitiesAll(figure).forEach((entity) => {
        if (settingsManager.settings.expireConditions) {
          entity.entityConditions.forEach((entityCondition) => {
            if (entityCondition.state == EntityConditionState.roundExpire && !entityCondition.permanent) {
              entityCondition.expired = true;
            }
          });

          entity.entityConditions = entity.entityConditions.filter((entityCondition) => !entityCondition.expired);
          entity.entityConditions.forEach((entityCondition) => {
            if (entityCondition.types.includes(ConditionType.expire) && !entityCondition.permanent) {
              if (entityCondition.state == EntityConditionState.normal) {
                entityCondition.lastState = entityCondition.state;
                entityCondition.state = EntityConditionState.expire;
              }
            }
          });
        }

        if (settingsManager.settings.applyConditions) {
          entity.entityConditions
            .filter(
              (entityCondition) =>
                entityCondition.types.includes(ConditionType.turn) ||
                (entityCondition.types.includes(ConditionType.afterTurn) && !this.isImmune(entity, figure, entityCondition.name))
            )
            .forEach((entityCondition) => {
              entityCondition.lastState = entityCondition.state;
              entityCondition.state = EntityConditionState.normal;
            });
        }

        entity.shield = undefined;
        entity.retaliate = [];
      });
    });
  }
}
