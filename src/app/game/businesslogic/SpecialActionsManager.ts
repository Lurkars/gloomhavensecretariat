import { Entity, EntityValueFunction } from 'src/app/game/model/Entity';

import { Character } from 'src/app/game/model/Character';
import { Game, GameState } from 'src/app/game/model/Game';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { Condition, ConditionName, ConditionType, EntityCondition, EntityConditionState } from 'src/app/game/model/data/Condition';

import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Figure } from 'src/app/game/model/Figure';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { Summon } from 'src/app/game/model/Summon';
import { CharacterSpecialAction, CharacterSpecialActionSlotTrigger } from 'src/app/game/model/data/CharacterStat';
import { Element, ElementState } from 'src/app/game/model/data/Element';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';

export class SpecialActionsManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  keepInitiativeOnLongRest(character: Character): boolean {
    return character.name === 'prism' && character.tags.includes('long_rest');
  }

  isIdentityLocked(character: Character): boolean {
    return (
      character.name === 'blinkblade' &&
      character.tags.includes('time_tokens') &&
      character.primaryToken === 0 &&
      (this.game.state === GameState.next ||
        (this.game.state === GameState.draw && character.identity === 1 && character.tokenValues[0] === 0))
    );
  }

  maxTokenValue(character: Character, index: number): number | undefined {
    if (
      index === 0 &&
      ((character.name === 'blinkblade' && character.tags.includes('time_tokens')) ||
        (character.name === 'shards' && character.tags.includes('resonance_tokens')))
    ) {
      return 5;
    }
    return undefined;
  }

  maxHealthBonus(character: Character): number {
    let bonus = 0;
    if (character.name === 'demolitionist' && character.tags.includes('mech')) {
      bonus += 5;
    }
    if (character.name === 'astral' && character.tags.includes('veil-of-protection')) {
      bonus += 3;
    }
    return bonus;
  }

  maxHealth(entity: Entity, tags: string[] = entity.tags): number {
    let maxHealth = EntityValueFunction(entity.maxHealth);
    if (entity instanceof Character && !entity.absent && entity.name === 'lightning' && tags.includes('unbridled-power')) {
      maxHealth = Math.max(maxHealth, 26);
    }
    return maxHealth;
  }

  isImmune(entity: Entity, figure: Figure): boolean {
    return (
      entity instanceof Summon &&
      figure instanceof Character &&
      !figure.absent &&
      figure.name === 'prism' &&
      entity.tags.includes('prism_mode')
    );
  }

  isConditionSuspended(entity: Entity, condition: Condition): boolean {
    return (
      entity instanceof Character &&
      entity.name === 'shackles' &&
      !entity.absent &&
      entity.tags.includes('delayed_malady') &&
      condition.types.includes(ConditionType.negative) &&
      !condition.types.includes(ConditionType.amDeck)
    );
  }

  woundBonus(figure: Figure): number {
    return figure instanceof Monster &&
      !figure.isAlly &&
      gameManager.characterManager.getActiveCharacters().some((c) => c.tags.includes('call-of-the-grave'))
      ? 1
      : 0;
  }

  preventElementWaning(element: Element): boolean {
    return (
      [Element.fire, Element.ice, Element.air, Element.earth].includes(element) &&
      this.game.figures.some(
        (figure) => figure instanceof Character && !figure.absent && figure.name === 'triangles' && figure.tags.includes('element_waning')
      )
    );
  }

  skipSummonTurn(summon: Summon): boolean {
    return summon.tags.includes('prism_mode');
  }

  longRestHealBonus(character: Character): number {
    if (character.name === 'lightning' && character.edition === 'fh-crossover' && character.tags.includes('rapid_recovery')) {
      return 1;
    } else if (character.name === 'lightning' && character.edition === 'gh2e' && character.tags.includes('long_rest_heal')) {
      return 1;
    }
    return 0;
  }

  startScenario(character: Character) {
    if (character.absent) {
      return;
    }

    if (character.name === 'blinkblade' && character.tags.includes('time_tokens')) {
      character.tokenValues[0] = 1;
    }

    if (character.name === 'kelp' && character.tags.includes('trophy_tokens')) {
      character.tokenValues[0] = 2;
    }

    if (character.name === 'shards' && character.tags.includes('resonance_tokens')) {
      character.tokenValues[0] = 1;
    }

    if (character.name === 'shards' && character.tags.includes('extra_resonance_tokens')) {
      character.tokenValues[0] = (character.tokenValues[0] || 0) + 2;
      gameManager.entityManager.addCondition(character, character, new Condition(ConditionName.brittle));
    }

    if (character.name === 'three-spears' && character.tags.includes('supply_tokens_scenario')) {
      character.tokenValues[0] = 1;
    }

    if (character.name === 'swarmshift' && character.tags.includes('hive_tokens')) {
      character.tokenValues[0] = 1;
    }
  }

  revealMonsterEntities(entities: MonsterEntity[]) {
    if (
      this.game.figures.some(
        (figure) => figure instanceof Character && !figure.absent && figure.name === 'snowflake' && figure.tags.includes('muddle-monster')
      )
    ) {
      this.game.figures.forEach((figure) => {
        if (figure instanceof Monster && !figure.isAlly) {
          figure.entities.forEach((entity) => {
            if (entities.includes(entity) && !gameManager.entityManager.isImmune(entity, figure, ConditionName.muddle)) {
              gameManager.entityManager.addCondition(entity, figure, new Condition(ConditionName.muddle));
            }
          });
        }
      });
    }
  }

  private resetTurnState(entity: Entity) {
    entity.extraActions = entity.extraActions.filter(
      (action) =>
        action.type !== ActionType.extra &&
        (!action.subActions || !action.subActions.some((subAction) => subAction.hidden && subAction.value === 'banner-of-strength'))
    );

    entity.entityConditions = entity.entityConditions.filter(
      (entityCondition) => !entityCondition.highlight || entityCondition.state !== EntityConditionState.new
    );
  }

  beforeTurn(entity: Entity) {
    this.resetTurnState(entity);

    if (entity instanceof Character) {
      this.triggerSlot(entity, 'turnStart');

      if (!entity.absent) {
        if (entity.name === 'music-note' && entity.tags.includes('song_active')) {
          entity.experience -= 1;
        }

        if (!entity.active && entity.name === 'skull' && entity.tags.includes('spirits')) {
          entity.summons
            .filter((summon) => summon.afterTurn)
            .forEach((summon) => {
              if (summon.maxHealth) {
                summon.health += 1;
                gameManager.entityManager.checkHealth(summon, entity);
              }
            });
        }
      }
    }
  }

  turn(entity: Entity, figure: Figure) {
    if (entity instanceof Character && !entity.absent) {
      if (entity.name === 'lightning' && entity.tags.includes('blood-pact') && gameManager.entityManager.isAlive(entity)) {
        if (entity.edition !== 'gh2e' || entity.health > 1) {
          gameManager.entityManager.changeHealth(entity, entity, -1, true);
        }
      }

      if (entity.name === 'berserker' && entity.tags.includes('strength-in-agony') && entity.health > 1) {
        gameManager.entityManager.changeHealth(entity, entity, -1, true);
      }

      if (entity.name === 'music-note' && entity.tags.includes('song_active')) {
        entity.experience += 1;
      }

      if (entity.longRest && settingsManager.settings.applyLongRest) {
        if (
          entity.name === 'three-spears' &&
          entity.tags.includes('supply_tokens_perk') &&
          entity.primaryToken === 0 &&
          entity.tokenValues[0] < 5 &&
          entity.progress.perks[10] >= 2
        ) {
          entity.tokenValues[0] += 1;
        }
      }

      if (entity.name === 'prism') {
        if (entity.tags.includes('repair_mode') && !entity.tags.includes('roundAction-repair_mode')) {
          entity.health += 2;
          const heal = new EntityCondition(ConditionName.heal, 2);
          gameManager.entityManager.addCondition(entity, entity, heal);
          gameManager.entityManager.applyCondition(entity, entity, heal, true);
          entity.tags.push('roundAction-repair_mode');
        }
        if (entity.tags.includes('spider_mode') && !entity.tags.includes('roundAction-spider_mode')) {
          gameManager.entityManager.addCondition(entity, entity, new Condition(ConditionName.ward));
          entity.tags.push('roundAction-spider_mode');
        }
      }
    }

    if (
      (figure instanceof Character || (figure instanceof Monster && figure.isAlly)) &&
      this.game.figures.find(
        (f) =>
          f instanceof Character &&
          gameManager.entityManager.isAlive(f) &&
          f.name === 'banner-spear' &&
          f.tags.includes('banner-of-strength') &&
          !!f.summons &&
          f.summons.some((summon) => summon.name === 'banner-of-strength' && gameManager.entityManager.isAlive(summon))
      )
    ) {
      const attackAction = new Action(ActionType.extra, '', ActionValueType.fixed, [
        new Action(ActionType.attack, 1, ActionValueType.plus, [
          new Action(ActionType.custom, 'banner-of-strength', ActionValueType.fixed, [], false, true)
        ])
      ]);
      entity.extraActions.push(attackAction);
    }

    if (
      (figure instanceof Character ||
        (figure instanceof Monster && figure.isAlly) ||
        (figure instanceof ObjectiveContainer && figure.escort)) &&
      (entity.health < EntityValueFunction(entity.maxHealth) ||
        entity.entityConditions.find(
          (entityCondition) => !entityCondition.expired && entityCondition.types.includes(ConditionType.clearHeal)
        )) &&
      this.game.figures.find(
        (f) =>
          f instanceof Character &&
          gameManager.entityManager.isAlive(f) &&
          f.name === 'banner-spear' &&
          f.tags.includes('banner-of-hope') &&
          !!f.summons &&
          f.summons.some((summon) => summon.name === 'banner-of-hope' && gameManager.entityManager.isAlive(summon))
      )
    ) {
      const healCondition = new EntityCondition(ConditionName.heal, 1);
      healCondition.highlight = true;
      healCondition.state = EntityConditionState.new;
      entity.entityConditions.push(healCondition);
    }
  }

  afterTurn(entity: Entity) {
    this.resetTurnState(entity);

    if (entity instanceof Character) {
      this.triggerSlot(entity, 'turnEnd');

      if (!entity.absent) {
        if (entity.name === 'skull' && entity.tags.includes('spirits')) {
          entity.summons
            .filter((summon) => summon.afterTurn)
            .forEach((summon) => {
              if (summon.maxHealth) {
                summon.health -= 1;
                gameManager.entityManager.checkHealth(summon, entity);
              }
            });
        }

        if (
          entity.name === 'fist' &&
          entity.tags.includes('gift-of-the-mountain') &&
          (entity.health < EntityValueFunction(entity.maxHealth, entity.level) ||
            entity.entityConditions.find(
              (condition) => condition.types.includes(ConditionType.clearHeal) && !condition.permanent && !condition.expired
            ))
        ) {
          let heal = entity.entityConditions.find((entityCondition) => entityCondition.name === ConditionName.heal);
          if (!heal) {
            heal = new EntityCondition(ConditionName.heal, 2);
            entity.entityConditions.push(heal);
          }
          heal.value = 2;
          heal.expired = false;
          heal.state = EntityConditionState.normal;
          entity.health += 2;
          gameManager.entityManager.applyCondition(entity, entity, heal, true);
        }

        if (entity.name === 'shards' && entity.tags.includes('resonance_tokens') && entity.tokenValues[0] < 5) {
          entity.tokenValues[0] += 1;
        }
      }
    }
  }

  addSummon(character: Character, summon: Summon) {
    if (character.name === 'boneshaper') {
      if (character.tags.includes('solid-bones') || character.tags.includes('unholy-prowess')) {
        if (summon.name === 'shambling-skeleton') {
          summon.maxHealth += 1;
          if (summon.health === summon.maxHealth - 1) {
            summon.health = summon.maxHealth;
          } else {
            summon.health += 1;
          }
          gameManager.entityManager.checkHealth(summon, character);
          if (character.tags.includes('solid-bones')) {
            summon.movement += 1;
            summon.action = new Action(ActionType.pierce, 1);
          }
        }
      }
    }

    if (character.name === 'astral' && character.tags.includes('veil-of-protection')) {
      summon.health += 3;
      summon.maxHealth += 3;
    }

    if (character.name === 'astral' && character.tags.includes('imbue-with-life') && summon.name === 'animated-claymore') {
      let disarm = character.entityConditions.find((entityCondition) => entityCondition.name === ConditionName.disarm);
      if (disarm) {
        disarm.expired = false;
        disarm.permanent = true;
      } else {
        disarm = new EntityCondition(ConditionName.disarm);
        disarm.permanent = true;
        character.entityConditions.push(disarm);
      }
    }
  }

  removeSummon(character: Character, summon: Summon) {
    if (character.name === 'astral' && character.tags.includes('imbue-with-life') && summon.name === 'animated-claymore') {
      const disarm = character.entityConditions.find((entityCondition) => entityCondition.name === ConditionName.disarm);
      if (disarm) {
        disarm.permanent = false;
        disarm.state = EntityConditionState.expire;
      }
    }
  }

  next(character: Character) {
    if (
      character instanceof Character &&
      !character.absent &&
      character.name === 'blinkblade' &&
      character.tags.includes('time_tokens') &&
      character.primaryToken === 0
    ) {
      character.identity = 1;
    }

    if (!character.absent && character.name === 'blinkblade' && character.tags.includes('roundAction-overdrive')) {
      const blinkbladeShield = character.extraActionsPersistent.find((action) => action.type === ActionType.shield);
      if (blinkbladeShield) {
        blinkbladeShield.value = EntityValueFunction(blinkbladeShield.value) - 1;
        if (blinkbladeShield.value <= 0) {
          character.extraActionsPersistent = character.extraActionsPersistent.filter((action) => action.type !== ActionType.shield);
        }
      }
    }

    if (!character.absent && character.name === 'coral' && character.tags.includes('roundAction-perk9')) {
      const coralShield = character.extraActions.find((action) => action.type === ActionType.shield);
      if (coralShield) {
        coralShield.value = EntityValueFunction(coralShield.value) - 1;
        if (coralShield.value <= 0) {
          character.extraActions = character.extraActions.filter((action) => action.type !== ActionType.shield);
        }
      }
    }

    this.triggerSlot(character, 'roundEnd');
  }

  draw(character: Character) {
    if (!character.absent && character.name === 'blinkblade' && character.tags.includes('time_tokens') && character.primaryToken === 0) {
      if (character.identity === 1 && character.tokenValues[0] < 2) {
        character.tokenValues[0] += 1;
      } else if (character.identity === 0) {
        if (character.tokenValues[0] > 0) {
          character.tokenValues[0] -= 1;
        } else {
          character.identity = 1;
          character.tokenValues[0] = 1;
        }
      }
    }

    if (
      !character.absent &&
      character.name === 'blinkblade' &&
      character.tags.includes('overdrive') &&
      !character.tags.includes('roundAction-overdrive') &&
      character.identity === 1
    ) {
      character.tags.push('roundAction-overdrive');
      const existingShield = character.extraActionsPersistent.find((action) => action.type === ActionType.shield);
      if (!existingShield) {
        character.extraActionsPersistent.push(new Action(ActionType.shield, 1));
      } else {
        existingShield.value = EntityValueFunction(existingShield.value) + 1;
      }
    }

    // FH Coral Perk 9: whenever you declare a long rest during card selection, gain Shield 1 for the round
    if (
      !character.absent &&
      character.name === 'coral' &&
      character.tags.includes('perk9') &&
      character.longRest &&
      !character.tags.includes('roundAction-perk9')
    ) {
      character.tags.push('roundAction-perk9');
      const existingShield = character.extraActions.find((action) => action.type === ActionType.shield);
      if (!existingShield) {
        character.extraActions.push(new Action(ActionType.shield, 1));
      } else {
        existingShield.value = EntityValueFunction(existingShield.value) + 1;
      }
    }

    this.triggerSlot(character, 'roundStart');
  }

  triggerSlot(
    character: Character,
    slotTrigger: CharacterSpecialActionSlotTrigger,
    tag: string | undefined = undefined,
    revert: boolean = false,
    force: boolean = false
  ) {
    character.specialActions
      .filter(
        (specialAction) =>
          (!tag || tag === specialAction.name) &&
          !!specialAction.slots &&
          specialAction.slots.length &&
          !!specialAction.slotTrigger &&
          specialAction.slotTrigger === slotTrigger &&
          (force || revert || this.isSlotTriggering(character, specialAction))
      )
      .forEach((specialAction) => {
        if (!!specialAction.slots && character.tags.includes(specialAction.name)) {
          this.triggerSlotBefore(character, specialAction, !force && revert);

          const current = Math.max(
            0,
            specialAction.slots.length -
              character.tags.filter((tag) => tag === specialAction.name).length -
              (specialAction.slots[0].toLowerCase().includes('start') ? 0 : 1) -
              (revert ? 1 : 0)
          );
          if (!force && specialAction.slots[current].toLowerCase().includes('xp')) {
            character.experience += revert ? -1 : 1;
          }
          if (revert) {
            character.tags.push(specialAction.name);
          } else {
            character.tags.splice(character.tags.indexOf(specialAction.name), 1);
          }

          this.triggerSlotAfter(character, specialAction, !force && revert);
        }
      });
  }

  isSlotTriggering(character: Character, specialAction: CharacterSpecialAction): boolean {
    if (character.name === 'blinkblade' && specialAction.name === 'breaknet_speed' && character.longRest) {
      return false;
    }

    if (
      character.name === 'eclipse' &&
      character.edition === 'gh' &&
      specialAction.name === 'nightfall' &&
      this.game.elementBoard.some(
        (elementModel) =>
          elementModel.type === Element.dark && [ElementState.always, ElementState.strong, ElementState.new].includes(elementModel.state)
      )
    ) {
      return false;
    }

    return gameManager.entityManager.isAlive(character);
  }

  triggerSlotBefore(character: Character, specialAction: CharacterSpecialAction, revert: boolean = false) {
    if (!revert) {
      if (character.name === 'shackles' && specialAction.name === 'delayed_malady') {
        character.entityConditions.forEach((condition) => {
          if (condition.types.includes(ConditionType.negative) && !condition.expired && condition.state !== EntityConditionState.removed) {
            condition.state = EntityConditionState.new;
            condition.state = EntityConditionState.new;
            if (!character.immunities.includes(condition.name) && !condition.types.includes(ConditionType.amDeck)) {
              character.immunities.push(condition.name);
            }
          }
        });
      }
    }
  }

  triggerSlotAfter(character: Character, specialAction: CharacterSpecialAction, revert: boolean = false) {
    if (!revert) {
      if (character.name === 'shackles' && specialAction.name === 'delayed_malady' && !character.tags.includes(specialAction.name)) {
        {
          character.immunities.forEach((immunity) => {
            const condition = new Condition(immunity);
            if (!condition.types.includes(ConditionType.amDeck)) {
              gameManager.entityManager.addCondition(character, character, new Condition(immunity), false, true);
            }
          });

          character.immunities = [];
          gameManager.itemManager.applyEquippedItemEffects(character, true);
        }
      }

      if (character.name === 'eclipse' && character.edition === 'gh' && specialAction.name === 'nightfall') {
        this.game.elementBoard.forEach((elementModel) => {
          if (elementModel.type === Element.dark) {
            elementModel.state = ElementState.new;
            gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.element, Element.dark);
          }
        });
      }
    }

    if (character.name === 'blinkblade' && specialAction.name === 'breaknet_speed') {
      gameManager.entityManager.changeHealth(character, character, revert ? 2 : -2, true);
    }
  }

  removeSpecialAction(entity: Entity, figure: Figure, tag: string) {
    entity.tags = entity.tags.filter((value) => value !== tag);
    if (entity instanceof Character) {
      if (entity.name === 'lightning' && tag === 'careless-charge') {
        entity.immunities = [];
      }

      if (entity.name === 'shackles' && tag === 'delayed_malady') {
        entity.immunities.forEach((immunity) => {
          const entityCondition = entity.entityConditions.find((condition) => condition.name === immunity);
          if (entityCondition) {
            entityCondition.state = EntityConditionState.new;
            entityCondition.lastState = EntityConditionState.new;
          }
        });

        entity.immunities = [];
        gameManager.itemManager.applyEquippedItemEffects(entity, true);
        entity.tags = entity.tags.filter((tag) => tag !== 'delayed_malady');
      }

      if (entity.name === 'fist' && tag === 'one-with-the-mountain') {
        entity.entityConditions = entity.entityConditions.filter(
          (entityCondition) => entityCondition.name !== ConditionName.regenerate || !entityCondition.permanent
        );
      }

      if (entity.name === 'demolitionist' && tag === 'mech') {
        entity.maxHealth -= 5;
        gameManager.entityManager.checkHealth(entity, figure);
      }

      if (entity.name === 'boneshaper') {
        if (tag === 'solid-bones' || tag === 'unholy-prowess') {
          entity.summons.forEach((summon) => {
            if (summon.name === 'shambling-skeleton') {
              summon.maxHealth -= 1;
              if (summon.health > summon.maxHealth) {
                summon.health = summon.maxHealth;
              } else {
                summon.health -= 1;
              }
              gameManager.entityManager.checkHealth(summon, figure);
              if (tag === 'solid-bones') {
                summon.movement -= 1;
                summon.action = undefined;
              }
            }
          });
        }
      }

      if (entity.name === 'astral') {
        if (tag === 'veil-of-protection') {
          entity.health -= 3;
          entity.maxHealth -= 3;
          entity.summons.forEach((summon) => {
            summon.health -= 3;
            summon.maxHealth -= 3;
          });
        }

        if (tag === 'imbue-with-life') {
          entity.entityConditions = entity.entityConditions.filter(
            (entityCondition) => entityCondition.name !== ConditionName.disarm || !entityCondition.permanent
          );
        }
      }
    }
  }

  addSpecialAction(entity: Entity, character: Character, tag: string) {
    const specialAction = character.specialActions.find((specialAction) => specialAction.name === tag);
    if (!!specialAction && !!specialAction.slots && specialAction.slots.length > 0) {
      for (let i = 0; i < specialAction.slots.length; i++) {
        entity.tags.push(tag);
      }
    } else {
      entity.tags.push(tag);
    }

    if (entity instanceof Character) {
      if (entity.name === 'lightning' && tag === 'careless-charge') {
        entity.immunities = gameManager.conditionsForTypes('character', 'negative').map((condition) => condition.name);
        entity.immunities.push(ConditionName.curse);
      }

      if (entity.name === 'shackles' && tag === 'delayed_malady') {
        entity.entityConditions.forEach((condition) => {
          if (
            condition.types.includes(ConditionType.negative) &&
            !condition.types.includes(ConditionType.amDeck) &&
            !condition.expired &&
            condition.state !== EntityConditionState.removed &&
            !entity.immunities.includes(condition.name)
          ) {
            entity.immunities.push(condition.name);
          }
        });
      }

      if (entity.name === 'fist' && tag === 'one-with-the-mountain') {
        let regenerate = entity.entityConditions.find((entityCondition) => entityCondition.name === ConditionName.regenerate);
        if (regenerate) {
          regenerate.permanent = true;
        } else {
          regenerate = new EntityCondition(ConditionName.regenerate);
          regenerate.permanent = true;
          entity.entityConditions.push(regenerate);
        }
      }

      if (entity.name === 'demolitionist' && tag === 'mech') {
        entity.maxHealth += 5;
        entity.health += 10;
        const heal = new EntityCondition(ConditionName.heal, 10);
        gameManager.entityManager.addCondition(entity, character, heal);
        gameManager.entityManager.applyCondition(entity, character, heal, true);
      }

      if (entity.name === 'boneshaper') {
        if (tag === 'solid-bones' || tag === 'unholy-prowess') {
          entity.summons.forEach((summon) => {
            if (summon.name === 'shambling-skeleton') {
              summon.maxHealth += 1;
              if (summon.health === summon.maxHealth - 1) {
                summon.health = summon.maxHealth;
              } else {
                summon.health += 1;
              }
              gameManager.entityManager.checkHealth(summon, character);
              if (tag === 'solid-bones') {
                summon.movement += 1;
                summon.action = new Action(ActionType.pierce, 1);
              }
            }
          });
        }
      }

      if (entity.name === 'astral') {
        if (tag === 'veil-of-protection') {
          entity.health += 3;
          entity.maxHealth += 3;
          entity.summons.forEach((summon) => {
            summon.health += 3;
            summon.maxHealth += 3;
          });
        }
      }
    } else if (entity instanceof Summon) {
      if (character.tags.includes('autoapply_mode') && tag === 'prism_mode') {
        const damage = entity.health - entity.maxHealth;
        gameManager.entityManager.changeHealth(character, character, damage);
        entity.health = entity.maxHealth;
        entity.entityConditions.forEach((summonCondition) => {
          if (
            !summonCondition.expired &&
            summonCondition.state !== EntityConditionState.removed &&
            !gameManager.entityManager.isImmune(character, character, summonCondition.name)
          ) {
            gameManager.entityManager.addCondition(character, character, new Condition(summonCondition.name));
          }
        });
        entity.entityConditions = [];

        if (!character.tags.includes('code_geminate')) {
          character.summons.forEach((summon) => (summon.tags = summon.tags.filter((tag) => tag !== 'prism_mode')));
          entity.tags.push('prism_mode');
        }
      }
    }
  }
}
