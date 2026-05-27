import { Entity, EntityValueFunction } from 'src/app/game/model/Entity';

import { Character } from 'src/app/game/model/Character';
import { Game } from 'src/app/game/model/Game';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { Condition, ConditionName, ConditionType, EntityCondition, EntityConditionState } from 'src/app/game/model/data/Condition';

import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Figure } from 'src/app/game/model/Figure';
import { Monster } from 'src/app/game/model/Monster';
import { Summon } from 'src/app/game/model/Summon';
import { CharacterSpecialAction, CharacterSpecialActionSlotTrigger } from 'src/app/game/model/data/CharacterStat';
import { Element, ElementState } from 'src/app/game/model/data/Element';

export class SpecialActionsManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  beforeTurn(entity: Entity) {
    entity.extraActions = entity.extraActions.filter(
      (action) =>
        action.type !== ActionType.extra &&
        (!action.subActions || !action.subActions.some((subAction) => subAction.hidden && subAction.value === 'banner-of-strength'))
    );

    entity.entityConditions = entity.entityConditions.filter(
      (entityCondition) => !entityCondition.highlight || entityCondition.state !== EntityConditionState.new
    );
    if (entity instanceof Character) {
      this.triggerSlot(entity, 'turnStart');
    }
  }

  turn(entity: Entity, figure: Figure) {
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
      (figure instanceof Character || (figure instanceof Monster && figure.isAlly)) &&
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
    this.beforeTurn(entity);
    if (entity instanceof Character) {
      this.triggerSlot(entity, 'turnEnd');
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
      character.identity = 0;
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

    this.triggerSlot(character, 'roundEnd');
  }

  draw(character: Character) {
    if (!character.absent && character.name === 'blinkblade' && character.tags.includes('time_tokens') && character.primaryToken === 0) {
      if (character.identity === 0 && character.tokenValues[0] < 2) {
        character.tokenValues[0] += 1;
      } else if (character.identity === 1) {
        if (character.tokenValues[0] > 0) {
          character.tokenValues[0] -= 1;
        } else {
          character.identity = 0;
          character.tokenValues[0] = 1;
        }
      }
    }

    if (
      !character.absent &&
      character.name === 'blinkblade' &&
      character.tags.includes('overdrive') &&
      !character.tags.includes('roundAction-overdrive') &&
      character.identity === 0
    ) {
      character.tags.push('roundAction-overdrive');
      const existingShield = character.extraActionsPersistent.find((action) => action.type === ActionType.shield);
      if (!existingShield) {
        character.extraActionsPersistent.push(new Action(ActionType.shield, 1));
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
            if (!character.immunities.includes(condition.name)) {
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
          character.immunities = [];

          character.entityConditions.forEach((condition) => {
            if (
              condition.types.includes(ConditionType.negative) &&
              !condition.expired &&
              condition.state !== EntityConditionState.removed
            ) {
              condition.state = EntityConditionState.normal;
              if (condition.types.includes(ConditionType.expire)) {
                condition.state = EntityConditionState.expire;
              }
            }
          });
        }
      }

      if (character.name === 'eclipse' && character.edition === 'gh' && specialAction.name === 'nightfall') {
        this.game.elementBoard.forEach((elementModel) => {
          if (elementModel.type === Element.dark) {
            elementModel.state = ElementState.new;
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
