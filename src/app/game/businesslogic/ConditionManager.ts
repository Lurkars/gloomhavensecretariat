import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { AttackModifier, AttackModifierDeck, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import {
  Condition,
  ConditionName,
  Conditions,
  ConditionType,
  EntityCondition,
  EntityConditionState
} from 'src/app/game/model/data/Condition';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { Entity, EntityValueFunction } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { Game } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { Summon } from 'src/app/game/model/Summon';

export class ConditionManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  changeHealthHighlightConditions(entity: Entity, figure: Figure, value: number, damageOnly: boolean = false) {
    if (settingsManager.settings.applyConditions) {
      const regenerate = entity.entityConditions.find(
        (entityCondition) =>
          !entityCondition.expired &&
          entityCondition.state !== EntityConditionState.new &&
          !entityCondition.permanent &&
          entityCondition.name === ConditionName.regenerate &&
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
            entityCondition.state !== EntityConditionState.new &&
            entityCondition.name === ConditionName.ward &&
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
        let heal = entity.entityConditions.find((condition) => condition.name === ConditionName.heal);
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
            this.applyCondition(entity, figure, heal, true);
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
          let shieldRetaliate = entity.entityConditions.find((condition) => condition.name === shieldRetaliateCondition);
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
                ((shieldRetaliateCondition === ConditionName.shield && actionHint.type === ActionType.shield) ||
                  (shieldRetaliateCondition === ConditionName.retaliate && actionHint.type === ActionType.retaliate))
              ) {
                shieldRetaliate.value += actionHint.value;
              }
            });

            if (
              shieldRetaliateCondition === ConditionName.shield &&
              shieldRetaliate.value &&
              entity.health + value + shieldRetaliate.value > 0
            ) {
              shieldRetaliate.expired = false;
              shieldRetaliate.highlight = true;
              if (value + shieldRetaliate.value > 0) {
                shieldRetaliate.highlightValue = shieldRetaliate.value;
                shieldRetaliate.value -= value + shieldRetaliate.value;
              }
              shieldValue = shieldRetaliate.value;
              if (
                settingsManager.settings.applyConditions &&
                settingsManager.settings.activeApplyConditions &&
                settingsManager.settings.activeApplyConditionsAuto.includes(shieldRetaliateCondition)
              ) {
                this.applyCondition(entity, figure, shieldRetaliate, true, true);
                this.sufferDamageHighlightConditions(entity, figure, value + shieldRetaliate.value, true);
                return;
              }
            } else if (shieldRetaliateCondition === ConditionName.retaliate && shieldRetaliate.value) {
              shieldRetaliate.expired = false;
              shieldRetaliate.highlight = true;
              this.applyCondition(entity, figure, shieldRetaliate, true, true);
              this.sufferDamageHighlightConditions(entity, figure, value + shieldRetaliate.value, true);
              return;
            }
          }
        });

        entity.entityConditions
          .filter((entityCondition) => entityCondition.name === ConditionName.poison || entityCondition.name === ConditionName.poison_x)
          .forEach((entityCondition) => {
            if (
              value < 0 &&
              !entityCondition.expired &&
              entityCondition.state !== EntityConditionState.new &&
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
          entityCondition.state !== EntityConditionState.new &&
          entityCondition.name === ConditionName.ward &&
          !this.isImmune(entity, figure, entityCondition.name)
      );
      const brittle = entity.entityConditions.find(
        (entityCondition) =>
          !entityCondition.expired &&
          entityCondition.state !== EntityConditionState.new &&
          entityCondition.name === ConditionName.brittle &&
          !this.isImmune(entity, figure, entityCondition.name)
      );

      const ignorePoison =
        (!entity.entityConditions.find(
          (entityCondition) =>
            !entityCondition.expired &&
            entityCondition.state !== EntityConditionState.new &&
            entityCondition.name === ConditionName.poison &&
            !this.isImmune(entity, figure, entityCondition.name)
        ) ||
          settingsManager.settings.applyConditionsExcludes.includes(ConditionName.poison)) &&
        (!entity.entityConditions.find(
          (entityCondition) =>
            !entityCondition.expired &&
            entityCondition.state !== EntityConditionState.new &&
            entityCondition.name === ConditionName.poison_x &&
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
          this.applyCondition(entity, figure, ward, true, true);
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
          this.applyCondition(entity, figure, brittle, true, true);
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
      const existingMuddle = character.entityConditions.find((e) => e.name === ConditionName.muddle && !e.expired);
      const existingStrengthen = character.entityConditions.find((e) => e.name === ConditionName.strengthen && !e.expired);
      if (
        existingMuddle ||
        (gameManager.monsterManager.getStat(figure, entity.type).actions &&
          gameManager.monsterManager.getStat(figure, entity.type).actions.find((action) => action.value === '%game.custom.disadvantage%'))
      ) {
        if (!existingStrengthen) {
          const muddle = existingMuddle ? existingMuddle : new EntityCondition(ConditionName.muddle);
          muddle.highlight = true;
          if (!existingMuddle) {
            muddle.types.push(ConditionType.hidden);
            muddle.temporary = true;
            character.entityConditions.push(muddle);
          }
          setTimeout(() => {
            muddle.highlight = false;
            if (!existingMuddle) {
              character.entityConditions = character.entityConditions.filter((condition) => condition !== muddle);
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
        entityCondition.name === condition.name &&
        entityCondition.state !== EntityConditionState.removed &&
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

    if (
      entity instanceof ObjectiveEntity &&
      figure instanceof ObjectiveContainer &&
      !figure.escort &&
      !new Condition(conditionName).types.includes(ConditionType.objective)
    ) {
      return true;
    }

    if (entity.immunities && entity.immunities.includes(conditionName) && !ignoreManual) {
      return true;
    } else if (figure instanceof Monster && entity instanceof MonsterEntity) {
      const stat = gameManager.monsterManager.getStat(figure, entity.type);
      immune = stat !== undefined && stat.immunities !== undefined && stat.immunities.includes(conditionName);
    } else if (entity instanceof Character) {
      const immunities: ConditionName[] = [];
      if (entity.progress.equippedItems.find((identifier) => identifier.edition === 'gh' && identifier.name === '38')) {
        immunities.push(ConditionName.stun, ConditionName.muddle);
      }
      if (entity.progress.equippedItems.find((identifier) => identifier.edition === 'gh' && identifier.name === '52')) {
        immunities.push(ConditionName.poison, ConditionName.wound);
      }
      if (entity.progress.equippedItems.find((identifier) => identifier.edition === 'gh' && identifier.name === '103')) {
        immunities.push(ConditionName.poison, ConditionName.wound);
      }
      if (entity.progress.equippedItems.find((identifier) => identifier.edition === 'cs' && identifier.name === '57')) {
        immunities.push(ConditionName.muddle);
      }
      if (entity.progress.equippedItems.find((identifier) => identifier.edition === 'fh' && identifier.name === '138')) {
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
    } else if (gameManager.specialActionsManager.isImmune(entity, figure)) {
      return true;
    }

    if (!immune) {
      if (conditionName === ConditionName.wound_x) {
        return this.isImmune(entity, figure, ConditionName.wound, ignoreManual);
      } else if (conditionName === ConditionName.poison_x) {
        return this.isImmune(entity, figure, ConditionName.poison, ignoreManual);
      } else if (conditionName === ConditionName.rupture) {
        return this.isImmune(entity, figure, ConditionName.wound, ignoreManual);
      } else if (conditionName === ConditionName.infect) {
        return this.isImmune(entity, figure, ConditionName.poison, ignoreManual);
      } else if (conditionName === ConditionName.chill) {
        return (
          this.isImmune(entity, figure, ConditionName.immobilize, ignoreManual) ||
          this.isImmune(entity, figure, ConditionName.muddle, ignoreManual)
        );
      } else if (conditionName === ConditionName.empower) {
        return this.isImmune(entity, figure, ConditionName.bless, ignoreManual);
      } else if (conditionName === ConditionName.enfeeble) {
        return this.isImmune(entity, figure, ConditionName.curse, ignoreManual);
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

  addCondition(
    entity: Entity,
    figure: Figure,
    condition: Condition,
    permanent: boolean = false,
    ignoreImmunity: boolean = false,
    deckSource?: Character
  ) {
    if (condition.types.includes(ConditionType.immunityOnly)) {
      return;
    }
    if (!ignoreImmunity && this.isImmune(entity, figure, condition.name)) {
      return;
    }
    if (
      !ignoreImmunity &&
      settingsManager.settings.applyConditions &&
      !settingsManager.settings.applyConditionsExcludes.includes(ConditionName.safeguard) &&
      this.hasCondition(entity, new Condition(ConditionName.safeguard)) &&
      condition.types.includes(ConditionType.negative)
    ) {
      this.removeCondition(entity, figure, new Condition(ConditionName.safeguard));
      if (condition.value <= 1 || condition.types.includes(ConditionType.upgrade)) {
        return;
      } else if (condition.types.includes(ConditionType.stackable)) {
        condition = new Condition(condition.name, condition.value - 1);
      }
    }
    if (condition.types.includes(ConditionType.amDeck) && !permanent) {
      this.addDeckCondition(figure, condition, deckSource);
    } else {
      this.addStandardCondition(entity, figure, condition, permanent);
    }

    if (figure instanceof Character && entity instanceof MonsterEntity) {
      gameManager.personalQuestManager.trackPersonalQuestProgress(figure, PersonalQuestAutotrackType.condition, condition.name);
    }

    // apply Challenge #1487
    if (
      gameManager.challengesManager.apply &&
      gameManager.challengesManager.isActive(1487, 'fh') &&
      condition.types.includes(ConditionType.negative) &&
      condition.name !== ConditionName.wound &&
      entity instanceof Character &&
      !this.isImmune(entity, entity, ConditionName.wound)
    ) {
      this.addCondition(entity, figure, new Condition(ConditionName.wound));
    }
  }

  addStandardCondition(entity: Entity, figure: Figure, condition: Condition, permanent: boolean = false) {
    if (condition.types.includes(ConditionType.upgrade)) {
      const upgradeCondition = condition;
      const baseCondition = this.activeConditions(entity).find(
        (other) => other.name + '_x' === condition.name && other.types.includes(ConditionType.upgradable)
      );
      if (upgradeCondition && baseCondition) {
        this.removeCondition(entity, figure, baseCondition);
      }
    } else if (condition.types.includes(ConditionType.upgradable)) {
      const upgradeCondition = this.activeConditions(entity).find(
        (other) => other.name === condition.name + '_x' && other.types.includes(ConditionType.upgrade)
      );
      if (upgradeCondition) {
        return;
      }
    }

    entity.entityConditions = entity.entityConditions.filter(
      (entityCondition) => !entityCondition.temporary || entityCondition.name !== condition.name
    );
    let entityCondition: EntityCondition | undefined = entity.entityConditions.find(
      (entityCondition) => entityCondition.name === condition.name && !entityCondition.types.includes(ConditionType.multiple)
    );
    if (!entityCondition) {
      entityCondition = new EntityCondition(condition.name, condition.value);
      entity.entityConditions.push(entityCondition);
    } else {
      entityCondition.expired = false;
      entityCondition.lastState = entityCondition.state;
      entityCondition.state = EntityConditionState.normal;
      if (entityCondition.types.includes(ConditionType.stackable)) {
        entityCondition.value += condition.value;
      } else if (entityCondition.types.includes(ConditionType.upgrade)) {
        entityCondition.value = Math.max(entityCondition.value, condition.value);
      }
    }

    if (entityCondition.name === ConditionName.plague && entityCondition.value > 3 && !gameManager.rpgRules()) {
      entityCondition.value = 3;
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
  }

  canSetImmunity(name: string): boolean {
    return Object.values(ConditionName).includes(name as ConditionName) && name !== ConditionName.invalid;
  }

  setImmunity(entities: Entity[], name: ConditionName, value: boolean): boolean {
    if (!this.canSetImmunity(name)) {
      return false;
    }
    entities.forEach((entity) => {
      entity.immunities = entity.immunities.filter((immunity) => immunity !== name);
      if (value) {
        entity.immunities.push(name);
      }
    });
    return true;
  }

  canAddManualCondition(condition: Condition): boolean {
    return (
      Object.values(ConditionName).includes(condition.name) &&
      condition.name !== ConditionName.invalid &&
      !condition.types.includes(ConditionType.amDeck) &&
      !condition.types.includes(ConditionType.immunityOnly)
    );
  }

  manualCondition(entity: Entity, condition: Condition): Condition {
    if (
      entity instanceof Character &&
      condition.name === ConditionName.muddle &&
      entity.progress.equippedItems.some((identifier) => identifier.edition === 'gh' && identifier.name === '108')
    ) {
      condition.name = ConditionName.strengthen;
    }
    return condition;
  }

  addManualCondition(entity: Entity, figure: Figure, condition: Condition, permanent: boolean = false): boolean {
    if (!this.canAddManualCondition(condition)) {
      return false;
    }
    condition = this.manualCondition(entity, condition);
    const suspended = gameManager.specialActionsManager.isConditionSuspended(entity, condition);
    this.addCondition(entity, figure, condition, permanent, suspended);
    if (suspended && !entity.immunities.includes(condition.name)) {
      entity.immunities.push(condition.name);
    }
    return true;
  }

  canSetConditionValue(name: string, value: number): boolean {
    if (!Object.values(ConditionName).includes(name as ConditionName) || !Number.isInteger(value) || value < 0) {
      return false;
    }
    const condition = new Condition(name);
    return condition.types.includes(ConditionType.stack) || condition.types.includes(ConditionType.upgrade);
  }

  setConditionValue(entity: Entity, figure: Figure, name: ConditionName, value: number): boolean {
    if (!this.canSetConditionValue(name, value)) {
      return false;
    }
    const entityCondition = entity.entityConditions.find((condition) => condition.name === name && !condition.expired);
    if (value <= 0) {
      if (entityCondition) {
        this.removeCondition(entity, figure, entityCondition, entityCondition.permanent);
      }
    } else if (!entityCondition) {
      this.addCondition(entity, figure, new Condition(name, value));
    } else if (entityCondition.types.includes(ConditionType.stack) && value > entityCondition.value) {
      this.addCondition(entity, figure, new Condition(name, value - entityCondition.value));
    } else if (entityCondition.types.includes(ConditionType.stack) || value < entityCondition.value) {
      entityCondition.value = value;
    } else {
      this.addCondition(entity, figure, new Condition(name, value));
    }
    return true;
  }

  deckConditionCards(entity: Entity, figure: Figure, condition: Condition): number {
    if (this.isImmune(entity, figure, condition.name)) {
      return 0;
    }
    if (
      settingsManager.settings.applyConditions &&
      !settingsManager.settings.applyConditionsExcludes.includes(ConditionName.safeguard) &&
      condition.types.includes(ConditionType.negative) &&
      this.hasCondition(entity, new Condition(ConditionName.safeguard))
    ) {
      if (condition.value <= 1 || condition.types.includes(ConditionType.upgrade)) {
        return 0;
      }
      return condition.types.includes(ConditionType.stackable) ? condition.value - 1 : condition.value;
    }
    return condition.value;
  }

  canAddDeckConditions(targets: { entity: Entity; figure: Figure }[], condition: Condition, deckSource?: Character): boolean {
    if (!condition.types.includes(ConditionType.amDeck) || !Number.isInteger(condition.value) || condition.value < 1 || !targets.length) {
      return false;
    }
    if (condition.name === ConditionName.empower || condition.name === ConditionName.enfeeble) {
      const total = targets.reduce((sum, target) => sum + this.deckConditionCards(target.entity, target.figure, condition), 0);
      return !!deckSource && total <= gameManager.attackModifierManager.additionalAvailable(deckSource, AttackModifierType[condition.name]);
    }
    const type = condition.name === ConditionName.bless ? AttackModifierType.bless : AttackModifierType.curse;
    const groups = new Map<AttackModifierDeck | boolean | string, { deck: AttackModifierDeck; isMonster: boolean; total: number }>();
    targets.forEach((target) => {
      const deck = gameManager.attackModifierManager.byFigure(target.figure);
      const isMonster = type === AttackModifierType.curse && gameManager.attackModifierManager.isMonsterDeck(target.figure);
      const key = gameManager.rpgRules() ? deck : type === AttackModifierType.curse ? isMonster : 'all';
      const group = groups.get(key) || { deck, isMonster, total: 0 };
      group.total += this.deckConditionCards(target.entity, target.figure, condition);
      groups.set(key, group);
    });
    return [...groups.values()].every(
      (group) => group.total <= gameManager.attackModifierManager.modifierSupply(group.deck, type, group.isMonster)
    );
  }

  addDeckConditions(targets: { entity: Entity; figure: Figure }[], condition: Condition, deckSource?: Character): boolean {
    if (!this.canAddDeckConditions(targets, condition, deckSource)) {
      return false;
    }
    targets.forEach((target) => this.addCondition(target.entity, target.figure, condition, false, false, deckSource));
    return true;
  }

  addDeckCondition(figure: Figure, condition: Condition, deckSource?: Character) {
    let modifiers: AttackModifier[] = [];
    switch (condition.name) {
      case ConditionName.bless:
        modifiers = gameManager.attackModifierManager.getBless(condition.value, gameManager.attackModifierManager.byFigure(figure));
        break;
      case ConditionName.curse:
        modifiers = gameManager.attackModifierManager.getCurse(
          gameManager.attackModifierManager.isMonsterDeck(figure),
          condition.value,
          gameManager.attackModifierManager.byFigure(figure)
        );
        break;
      case ConditionName.empower:
      case ConditionName.enfeeble:
        if (!deckSource) {
          console.error('No deck source found for:', condition.name, figure);
          return;
        }
        modifiers = gameManager.attackModifierManager.getAdditional(deckSource, AttackModifierType[condition.name], condition.value);
    }
    gameManager.attackModifierManager.addModifierBatch(gameManager.attackModifierManager.byFigure(figure), modifiers);
  }

  // an immunity shown like a condition, without the condition being applied
  isImmunityPlaceholder(entity: Entity, entityCondition: EntityCondition): boolean {
    return !entity.entityConditions.includes(entityCondition) && entity.immunities.includes(entityCondition.name);
  }

  // removes an immunity placeholder, stackable conditions count down, others get removed
  reduceCondition(entity: Entity, figure: Figure, entityCondition: EntityCondition) {
    if (this.isImmunityPlaceholder(entity, entityCondition)) {
      entity.immunities = entity.immunities.filter((immunity) => immunity !== entityCondition.name);
    } else if (entityCondition.types.includes(ConditionType.stackable) && entityCondition.value > 1) {
      entityCondition.value--;
    } else {
      this.removeCondition(entity, figure, entityCondition, entityCondition.permanent);
    }
  }

  removeCondition(entity: Entity, figure: Figure, condition: Condition, permanent: boolean = false) {
    entity.entityConditions = entity.entityConditions.filter(
      (entityCondition) => entityCondition.name !== condition.name || entityCondition.permanent !== permanent
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

  applyCondition(entity: Entity, figure: Figure, condition: EntityCondition, highlight: boolean = false, autoApply: boolean = false) {
    let entityCondition: EntityCondition | undefined = condition;

    if (entity.entityConditions.indexOf(condition) === -1) {
      entityCondition = entity.entityConditions.find((c) => c.name === condition.name && c.value == condition.value);
    }

    if (!!entityCondition && !this.isImmune(entity, figure, entityCondition.name)) {
      if (entityCondition.name === ConditionName.poison || entityCondition.name === ConditionName.poison_x) {
        entity.health -= entityCondition.value;

        const ward = entity.entityConditions.find(
          (c) =>
            !c.expired && c.state !== EntityConditionState.new && c.name === ConditionName.ward && !this.isImmune(entity, figure, c.name)
        );
        const brittle = entity.entityConditions.find(
          (c) =>
            !c.expired && c.state !== EntityConditionState.new && c.name === ConditionName.brittle && !this.isImmune(entity, figure, c.name)
        );

        if (ward && !brittle) {
          ward.value += entityCondition.value;
        }

        if (brittle && !ward) {
          brittle.value += entityCondition.value;
        }

        gameManager.entityManager.checkHealth(entity, figure);
      }

      if (entityCondition.name === ConditionName.ward) {
        const value = Math.floor(entityCondition.value / 2);
        if (autoApply) {
          entity.health += entityCondition.value - value;
        } else {
          entity.health += entityCondition.value;
          if (!autoApply) {
            gameManager.entityManager.checkHealth(entity, figure);
            entity.health -= value;
            const regenerate = entity.entityConditions.find(
              (c) =>
                !c.expired &&
                c.state !== EntityConditionState.new &&
                !c.permanent &&
                c.name === ConditionName.regenerate &&
                !this.isImmune(entity, figure, c.name) &&
                !settingsManager.settings.applyConditionsExcludes.includes(c.name)
            );
            if (regenerate && value > 0) {
              regenerate.expired = true;
            }
            gameManager.entityManager.checkHealth(entity, figure);
          }
        }
        entityCondition.value = 1;
        entityCondition.expired = true;
      }

      if (entityCondition.name === ConditionName.brittle) {
        if (autoApply) {
          entity.health -= entityCondition.value;
        } else {
          entity.health += entityCondition.value;
          gameManager.entityManager.checkHealth(entity, figure);
          entity.health -= entityCondition.value * 2;
          gameManager.entityManager.checkHealth(entity, figure);
        }
        entityCondition.value = 1;
        entityCondition.expired = true;
      }

      if (entityCondition.name === ConditionName.shield) {
        entity.health += entityCondition.value;
        if (!autoApply) {
          gameManager.entityManager.checkHealth(entity, figure);
        }
        entityCondition.expired = true;

        const ward = entity.entityConditions.find(
          (c) =>
            !c.expired && c.state !== EntityConditionState.new && c.name === ConditionName.ward && !this.isImmune(entity, figure, c.name)
        );
        if (ward && ward.highlight) {
          ward.value -= entityCondition.value;
        }
        const brittle = entity.entityConditions.find(
          (c) =>
            !c.expired && c.state !== EntityConditionState.new && c.name === ConditionName.brittle && !this.isImmune(entity, figure, c.name)
        );
        if (brittle && brittle.highlight) {
          brittle.value -= entityCondition.value;
        }
      }

      if (entityCondition.name === ConditionName.retaliate) {
        entityCondition.expired = true;
      }

      if (entityCondition.name === ConditionName.heal) {
        const apply = entityCondition.state == EntityConditionState.new && entityCondition.lastState == EntityConditionState.new;

        if (apply) {
          entity.health += entityCondition.value;
        }

        const preventHeal = entity.entityConditions.find(
          (entityCondition) =>
            entityCondition.types.includes(ConditionType.preventHeal) &&
            entityCondition.state !== EntityConditionState.expire &&
            !entityCondition.expired &&
            !this.isImmune(entity, figure, entityCondition.name)
        );

        if (!!preventHeal) {
          entity.health -= entityCondition.value;
        }

        let clearHeal = entity.entityConditions.find(
          (entityCondition) =>
            entityCondition.types.includes(ConditionType.clearHeal) && !entityCondition.permanent && !entityCondition.expired
        );
        while (clearHeal) {
          clearHeal.lastState = clearHeal.state;
          clearHeal.state = EntityConditionState.expire;
          clearHeal.expired = true;
          clearHeal = entity.entityConditions.find(
            (entityCondition) =>
              entityCondition.types.includes(ConditionType.clearHeal) && !entityCondition.permanent && !entityCondition.expired
          );
        }

        if (!preventHeal && entity.health - entityCondition.value >= EntityValueFunction(entity.maxHealth)) {
          entityCondition.highlight = false;
        }
        gameManager.entityManager.checkHealth(entity, figure);
        entityCondition.expired = true;
      }

      if (highlight && settingsManager.settings.animations) {
        entityCondition.highlight = true;
        setTimeout(() => {
          entityCondition.highlight = false;
          gameManager.triggerUiChange(false);
        }, 1000 * settingsManager.settings.animationSpeed);
      } else {
        entityCondition.highlight = false;
      }

      if (entityCondition.permanent) {
        entityCondition.expired = false;
      }
    }
  }

  declineApplyCondition(entity: Entity, figure: Figure, condition: EntityCondition) {
    condition.highlight = false;

    if (!condition.permanent) {
      if (condition.name === ConditionName.heal) {
        condition.expired = true;
      }
      if (condition.name === ConditionName.shield) {
        condition.expired = true;
      }
    }
  }

  restoreConditions(entity: Entity) {
    entity.entityConditions.forEach((entityCondition) => {
      if (entityCondition.name === ConditionName.chill) {
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
      if (entityCondition.name === ConditionName.chill) {
        if (entityCondition.value === 1 && !entityCondition.permanent) {
          entityCondition.expired = true;
        } else {
          entityCondition.value--;
        }
      }
    });

    let negativeCondition = false;

    entity.entityConditions.forEach((entityCondition) => {
      if (
        entityCondition.types.includes(ConditionType.expire) &&
        !gameManager.specialActionsManager.isConditionSuspended(entity, entityCondition)
      ) {
        if (entityCondition.state === EntityConditionState.expire && !entityCondition.permanent) {
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
        gameManager.entityManager.changeHealth(entity, figure, -1, true);
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
        entityCondition.state === EntityConditionState.normal &&
        entityCondition.name === ConditionName.regenerate &&
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
        regenerateCondition.lastState = regenerateCondition.state;
        regenerateCondition.state = EntityConditionState.expire;
        entity.health += regenerateCondition.value;
        gameManager.entityManager.checkHealth(entity, figure);
      }

      regenerateCondition.highlight = true;
      setTimeout(() => {
        regenerateCondition.highlight = false;
      }, 1000 * settingsManager.settings.animationSpeed);
    }

    if (
      entity instanceof Character &&
      entity.progress.equippedItems.find((identifier) => identifier.edition === 'fh' && identifier.name === '178') &&
      entity.initiative >= 60 &&
      !entity.longRest
    ) {
      entity.health = entity.health + 1;
      const heal = new EntityCondition(ConditionName.heal, 1);
      entity.entityConditions.push(heal);
      this.applyCondition(entity, figure, heal, true);
    }

    entity.entityConditions
      .filter(
        (entityCondition) =>
          !entityCondition.expired &&
          entityCondition.state === EntityConditionState.normal &&
          entityCondition.types.includes(ConditionType.turn)
      )
      .forEach((entityCondition) => {
        if (
          !this.isImmune(entity, figure, entityCondition.name) &&
          !settingsManager.settings.applyConditionsExcludes.includes(entityCondition.name)
        ) {
          entityCondition.lastState = entityCondition.state;
          entityCondition.state = EntityConditionState.turn;
          if (entityCondition.name === ConditionName.wound || entityCondition.name === ConditionName.wound_x) {
            entity.health = entity.health - entityCondition.value - gameManager.specialActionsManager.woundBonus(figure);

            if (
              entity instanceof Character &&
              entity.progress.equippedItems.find((identifier) => identifier.edition === 'cs' && identifier.name === '71')
            ) {
              entity.health = entity.health + entityCondition.value + 1;
              const heal = new EntityCondition(ConditionName.heal, 1);
              entity.entityConditions.push(heal);
              this.applyCondition(entity, figure, heal, true);
            }

            gameManager.entityManager.checkHealth(entity, figure);

            entityCondition.highlight = true;
            setTimeout(() => {
              entityCondition.highlight = false;
              if (
                !(entity instanceof Character) ||
                !entity.progress.equippedItems.find((identifier) => identifier.edition === 'cs' && identifier.name === '71')
              ) {
                this.sufferDamageHighlightConditions(entity, figure, -entityCondition.value, true);
                gameManager.entityManager.checkHealth(entity, figure);
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
        if (entityCondition.state === EntityConditionState.normal) {
          entityCondition.lastState = entityCondition.state;
          entityCondition.state = EntityConditionState.turn;
        } else if (entityCondition.state === EntityConditionState.new && entityCondition.lastState !== EntityConditionState.new) {
          entityCondition.lastState = entityCondition.state;
          entityCondition.state = EntityConditionState.normal;
        }
      });

    entity.entityConditions
      .filter(
        (entityCondition) => !entityCondition.expired && entityCondition.types.includes(ConditionType.expire) && !entityCondition.permanent
      )
      .forEach((entityCondition) => {
        if (entityCondition.state === EntityConditionState.expire && entityCondition.lastState === EntityConditionState.new) {
          entityCondition.lastState = EntityConditionState.normal;
        }
      });
  }

  unapplyConditionsTurn(entity: Entity, figure: Figure) {
    entity.entityConditions
      .filter(
        (entityCondition) =>
          entityCondition.state === EntityConditionState.turn &&
          entityCondition.types.includes(ConditionType.turn) &&
          !settingsManager.settings.applyConditionsExcludes.includes(entityCondition.name)
      )
      .forEach((entityCondition) => {
        if (entityCondition.expired) {
          entityCondition.expired = false;
        } else {
          entityCondition.lastState = entityCondition.state;
          entityCondition.state = EntityConditionState.normal;
          if (entityCondition.name === ConditionName.wound || entityCondition.name === ConditionName.wound_x) {
            entity.health = entity.health + entityCondition.value + gameManager.specialActionsManager.woundBonus(figure);
            gameManager.entityManager.checkHealth(entity, figure);
          }
        }
      });

    const regenerateCondition = entity.entityConditions.find(
      (entityCondition) =>
        entityCondition.name === ConditionName.regenerate &&
        !settingsManager.settings.applyConditionsExcludes.includes(entityCondition.name)
    );

    if (regenerateCondition) {
      const heal =
        entity.entityConditions.every((entityCondition) => !entityCondition.types.includes(ConditionType.preventHeal)) &&
        regenerateCondition.state === EntityConditionState.expire;

      entity.entityConditions
        .filter((entityCondition) => entityCondition.expired && entityCondition.types.includes(ConditionType.clearHeal))
        .forEach((entityCondition) => (entityCondition.expired = false));

      if (heal) {
        regenerateCondition.lastState = regenerateCondition.state;
        regenerateCondition.state = EntityConditionState.normal;
        entity.health -= regenerateCondition.value;
        gameManager.entityManager.checkHealth(entity, figure);
      }
    }

    if (
      entity instanceof Character &&
      entity.progress.equippedItems.find((identifier) => identifier.edition === 'fh' && identifier.name === '178') &&
      entity.initiative >= 60 &&
      !entity.longRest &&
      entity.entityConditions.find((condition) => condition.name === ConditionName.heal && condition.value === 1 && condition.expired)
    ) {
      entity.entityConditions = entity.entityConditions.filter(
        (condition) => condition.name !== ConditionName.heal || condition.value !== 1 || !condition.expired
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
          if (entityCondition.state === EntityConditionState.turn) {
            if (entityCondition.name === ConditionName.bane) {
              gameManager.entityManager.changeHealth(entity, figure, -10, true);
              entityCondition.expired = true;
              entityCondition.highlight = true;
              setTimeout(() => {
                entityCondition.highlight = false;
              }, 1000 * settingsManager.settings.animationSpeed);
            }
          } else if (entityCondition.state === EntityConditionState.normal) {
            entityCondition.lastState = entityCondition.state;
            entityCondition.state = EntityConditionState.turn;
          } else if (entityCondition.state === EntityConditionState.new && entityCondition.lastState !== EntityConditionState.new) {
            entityCondition.lastState = entityCondition.state;
            entityCondition.state = EntityConditionState.normal;
          } else if (entityCondition.state === EntityConditionState.new && entityCondition.lastState === EntityConditionState.new) {
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
          entityCondition.state !== EntityConditionState.removed &&
          entityCondition.types.includes(ConditionType.afterTurn) &&
          !settingsManager.settings.applyConditionsExcludes.includes(entityCondition.name)
      )
      .forEach((entityCondition) => {
        if (entityCondition.expired) {
          if (entityCondition.name === ConditionName.bane) {
            entity.health = entity.health + 10;
            gameManager.entityManager.checkHealth(entity, figure);
          }

          entityCondition.highlight = false;
          entityCondition.expired = false;
        } else if (entityCondition.state === EntityConditionState.normal && entityCondition.lastState === EntityConditionState.new) {
          entityCondition.state = EntityConditionState.new;
        } else if (entityCondition.state === EntityConditionState.new && entityCondition.lastState !== EntityConditionState.new) {
          entityCondition.lastState = entityCondition.state;
        }
      });
  }

  highlightedConditions(entity: Entity): EntityCondition[] {
    return entity.entityConditions
      .filter((entityCondition) => entityCondition.highlight)
      .sort((a, b) => b.types.indexOf(ConditionType.double) - a.types.indexOf(ConditionType.double));
  }

  conditions(edition: string | undefined = undefined, forceEdition: boolean = false): Condition[] {
    let conditions: Condition[] = [];
    let conditionNames: (ConditionName | string)[] = [];

    if (edition) {
      conditionNames = gameManager.editionManager.editionData
        .filter(
          (editionData) =>
            gameManager.editionManager.isEditionRelevant(editionData.edition, edition) &&
            editionData.conditions &&
            editionData.conditions.length > 0
        )
        .flatMap((other) => other.conditions);

      if (!forceEdition && this.game.conditions) {
        conditionNames.push(...this.game.conditions);
      }

      conditions.push(
        ...conditionNames.map((value) => {
          if (value.split(':').length > 1) {
            return new Condition(value.split(':')[0], +value.split(':')[1]);
          } else {
            return new Condition(value);
          }
        })
      );
    } else {
      conditions = Conditions.map((c) => new Condition(c.name, c.value));
    }

    conditions = conditions.filter((condition) => !condition.types.includes(ConditionType.special));

    if (!forceEdition) {
      this.game.figures
        .filter(
          (figure) =>
            figure instanceof Character &&
            figure.specialConditions &&
            figure.specialConditions.length &&
            !figure.absent &&
            gameManager.entityManager.gameplayFigure(figure)
        )
        .forEach((figure) => (figure as Character).specialConditions.forEach((name) => conditions.push(new Condition(name))));
    }

    return conditions.filter((c, i, s) => s.map((co) => co.name).indexOf(c.name) === i);
  }

  figureConditions(figure: Figure, entity: Entity | undefined = undefined): ConditionName[] {
    const conditions: ConditionName[] = [];

    if (figure instanceof Character) {
      if (figure.summons) {
        figure.summons.forEach((summon) => {
          if (summon.action) {
            this.actionConditions(summon.action).forEach((condition) => {
              if (!conditions.find((name) => name === condition)) {
                conditions.push(condition);
              }
            });
          }

          if (summon.additionalAction) {
            this.actionConditions(summon.additionalAction).forEach((condition) => {
              if (!conditions.find((name) => name === condition)) {
                conditions.push(condition);
              }
            });
          }
        });
      }
    } else if (figure instanceof Monster && entity instanceof MonsterEntity) {
      const stat: MonsterStat = gameManager.monsterManager.getStat(figure, entity.type);
      const abilityCard: AbilityCard | undefined = gameManager.monsterAbilityManager.getAbilityCard(figure);
      if (abilityCard) {
        abilityCard.actions.forEach((action) => {
          this.actionConditions(action, stat).forEach((condition) => {
            if (!conditions.find((name) => name === condition)) {
              conditions.push(condition);
            }
          });
        });
      }
    }

    return conditions;
  }

  actionConditions(action: Action, stat: MonsterStat | undefined = undefined): ConditionName[] {
    const conditions: ConditionName[] = [];
    if (action.type === ActionType.condition) {
      conditions.push(action.value as ConditionName);
    } else if (stat && action.type === ActionType.attack && stat.actions) {
      stat.actions.forEach((statAction) => {
        if (statAction.type === ActionType.condition) {
          conditions.push(statAction.value as ConditionName);
        }
      });
    }

    if (action.subActions) {
      action.subActions.forEach((subAction) => {
        conditions.push(...this.actionConditions(subAction, stat));
      });
    }

    return conditions;
  }

  conditionsForTypes(...types: string[]): Condition[] {
    return this.conditions(this.game.edition).filter((condition) =>
      types.every((type) => !type || condition.types.includes(type as ConditionType))
    );
  }

  allConditionsForTypes(...types: string[]): Condition[] {
    return this.conditions().filter((condition) => types.every((type) => !type || condition.types.includes(type as ConditionType)));
  }

  setGameCondition(condition: ConditionName, value: boolean) {
    this.game.conditions = this.game.conditions.filter((other) => other !== condition);
    if (value) {
      this.game.conditions.push(condition);
    }
  }
}
