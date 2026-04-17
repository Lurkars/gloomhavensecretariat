import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { CharacterSpecialAction } from 'src/app/game/model/data/CharacterStat';
import { Condition, ConditionName, ConditionType, EntityCondition, EntityConditionState } from 'src/app/game/model/data/Condition';
import { Summon } from 'src/app/game/model/Summon';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';

export class SpecialActionsHelper {
  constructor(private component: EntitiesMenuDialogComponent) {}

  update() {
    this.component.specialActions = [];

    if (this.component.figure instanceof Character && this.component.figure.specialActions) {
      const character = this.component.figure as Character;
      this.component.specialActions = character.specialActions.filter(
        (specialAction) =>
          (!specialAction.level || specialAction.level <= character.level) &&
          ((this.component.entity instanceof Character && !specialAction.summon) ||
            (this.component.entity instanceof Summon && specialAction.summon))
      );

      character.specialActions.forEach((specialAction) => {
        if (
          this.component.entity instanceof Character &&
          !specialAction.summon &&
          this.component.entity.tags.includes(specialAction.name)
        ) {
          this.component.specialTags.push(specialAction.name);
        } else if (
          this.component.entity instanceof Summon &&
          specialAction.summon &&
          this.component.entity.tags.includes(specialAction.name)
        ) {
          this.component.specialTags.push(specialAction.name);
        }
      });
    }
  }

  applySpecialAction(specialAction: CharacterSpecialAction) {
    if (!specialAction.noTag) {
      if (!this.component.specialTags.includes(specialAction.name)) {
        this.component.specialTags.push(specialAction.name);
      } else {
        this.component.specialTags.splice(this.component.specialTags.indexOf(specialAction.name), 1);
      }
    }
  }

  close() {
    if (
      this.component.figure instanceof Character &&
      (this.component.entity instanceof Character || this.component.entity instanceof Summon)
    ) {
      const character = this.component.figure;
      const entity = this.component.entity;

      const specialTagsToTemove = entity.tags.filter(
        (specialTag) =>
          character.specialActions &&
          character.specialActions.find((specialAction) => specialAction.name == specialTag) != undefined &&
          !this.component.specialTags.includes(specialTag)
      );

      if (specialTagsToTemove.length) {
        this.component.before(
          'removeSpecialTags',
          specialTagsToTemove
            .map((specialTag) => '%data.character.' + character.edition + '.' + character.name + '.' + specialTag + '%')
            .join(',')
        );

        entity.tags = entity.tags.filter((specialTag) => !specialTagsToTemove.includes(specialTag));

        if (entity instanceof Character) {
          if (entity.name == 'lightning' && specialTagsToTemove.includes('careless-charge')) {
            entity.immunities = [];
            this.component.entityImmunities = entity.immunities;
          }

          if (entity.name == 'shackles' && specialTagsToTemove.includes('delayed_malady')) {
            entity.immunities = [];
            entity.tags = entity.tags.filter((tag) => tag != 'delayed_malady');
            this.component.entityImmunities = entity.immunities;
          }

          if (entity.name == 'fist' && specialTagsToTemove.includes('one-with-the-mountain')) {
            entity.entityConditions = entity.entityConditions.filter(
              (entityCondition) => entityCondition.name != ConditionName.regenerate || !entityCondition.permanent
            );
          }

          if (entity.name == 'demolitionist' && specialTagsToTemove.includes('mech')) {
            entity.maxHealth -= 5;
            gameManager.entityManager.checkHealth(this.component.entity, character);
          }

          if (entity.name == 'boneshaper') {
            if (specialTagsToTemove.includes('solid-bones') || specialTagsToTemove.includes('unholy-prowess')) {
              entity.summons.forEach((summon) => {
                if (summon.name === 'shambling-skeleton') {
                  summon.maxHealth -= 1;
                  if (summon.health > summon.maxHealth) {
                    summon.health = summon.maxHealth;
                  } else {
                    summon.health -= 1;
                  }
                  gameManager.entityManager.checkHealth(summon, character);
                  if (specialTagsToTemove.includes('solid-bones')) {
                    summon.movement -= 1;
                    summon.action = undefined;
                  }
                }
              });
            }
          }

          if (entity.name == 'astral') {
            if (specialTagsToTemove.includes('veil-of-protection')) {
              entity.health -= 3;
              entity.maxHealth -= 3;
              entity.summons.forEach((summon) => {
                summon.health -= 3;
                summon.maxHealth -= 3;
              });
            }

            if (specialTagsToTemove.includes('imbue-with-life')) {
              entity.entityConditions = entity.entityConditions.filter(
                (entityCondition) => entityCondition.name != ConditionName.disarm || !entityCondition.permanent
              );
            }
          }
        }

        gameManager.stateManager.after();
      }

      const specialTagsToAdd = this.component.specialTags.filter((specialTag) => entity && !entity.tags.includes(specialTag));

      if (specialTagsToAdd.length) {
        this.component.before(
          'addSpecialTags',
          specialTagsToAdd
            .map((specialTag) => '%data.character.' + character.edition + '.' + character.name + '.' + specialTag + '%')
            .join(',')
        );

        entity.tags.push(...specialTagsToAdd);

        if (entity instanceof Character) {
          if (entity.name == 'lightning' && specialTagsToAdd.includes('careless-charge')) {
            entity.immunities = gameManager.conditionsForTypes('character', 'negative').map((condition) => condition.name);
            entity.immunities.push(ConditionName.curse);
            if (gameManager.entityManager.hasCondition(this.component.entity, new Condition(ConditionName.enfeeble))) {
              entity.immunities.push(ConditionName.enfeeble);
            }
            this.component.entityImmunities = character.immunities;
          }

          if (entity.name == 'shackles' && specialTagsToAdd.includes('delayed_malady')) {
            entity.entityConditions.forEach((condition) => {
              if (
                condition.types.indexOf(ConditionType.negative) &&
                !condition.expired &&
                condition.state != EntityConditionState.removed &&
                !this.component.entityConditions.find(
                  (removed) => removed.state == EntityConditionState.removed && removed.name == condition.name
                ) &&
                !entity.immunities.includes(condition.name)
              ) {
                entity.immunities.push(condition.name);
              }
            });

            this.component.entityConditions.forEach((condition) => {
              if (condition.state == EntityConditionState.new) {
                entity.immunities.push(condition.name);
              }
            });

            this.component.entityImmunities = character.immunities;
            entity.tags.push(...[1, 2, 3].map(() => 'delayed_malady'));
          }

          if (entity.name == 'fist' && specialTagsToAdd.includes('one-with-the-mountain')) {
            let regenerate = entity.entityConditions.find((entityCondition) => entityCondition.name == ConditionName.regenerate);
            if (regenerate) {
              regenerate.permanent = true;
            } else {
              regenerate = new EntityCondition(ConditionName.regenerate);
              regenerate.permanent = true;
              entity.entityConditions.push(regenerate);
            }
          }

          if (entity.name == 'demolitionist' && specialTagsToAdd.includes('mech')) {
            entity.maxHealth += 5;
            entity.health += 10;
            gameManager.entityManager.addCondition(entity, character, new Condition(ConditionName.heal, 10));
            gameManager.entityManager.applyCondition(entity, character, ConditionName.heal, true);
          }

          if (entity.name == 'boneshaper') {
            if (specialTagsToAdd.includes('solid-bones') || specialTagsToAdd.includes('unholy-prowess')) {
              entity.summons.forEach((summon) => {
                if (summon.name === 'shambling-skeleton') {
                  summon.maxHealth += 1;
                  if (summon.health == summon.maxHealth - 1) {
                    summon.health = summon.maxHealth;
                  } else {
                    summon.health += 1;
                  }
                  gameManager.entityManager.checkHealth(summon, character);
                  if (specialTagsToAdd.includes('solid-bones')) {
                    summon.movement += 1;
                    summon.action = new Action(ActionType.pierce, 1);
                  }
                }
              });
            }
          }

          if (entity.name == 'astral') {
            if (specialTagsToAdd.includes('veil-of-protection')) {
              entity.health += 3;
              entity.maxHealth += 3;
              entity.summons.forEach((summon) => {
                summon.health += 3;
                summon.maxHealth += 3;
              });
            }

            if (specialTagsToAdd.includes('imbue-with-life')) {
              let disarm = entity.entityConditions.find((entityCondition) => entityCondition.name == ConditionName.disarm);
              if (disarm) {
                disarm.expired = false;
                disarm.permanent = true;
              } else {
                disarm = new EntityCondition(ConditionName.disarm);
                disarm.permanent = true;
                entity.entityConditions.push(disarm);
              }
            }
          }
        }

        if (entity instanceof Summon) {
          if (character.tags.includes('autoapply_mode') && specialTagsToAdd.includes('prism_mode')) {
            const damage = entity.health - entity.maxHealth;
            gameManager.entityManager.changeHealth(character, character, damage);
            entity.health = entity.maxHealth;
            entity.entityConditions.forEach((summonCondition) => {
              if (
                !summonCondition.expired &&
                summonCondition.state != EntityConditionState.removed &&
                !gameManager.entityManager.isImmune(character, character, summonCondition.name)
              ) {
                gameManager.entityManager.addCondition(character, character, new Condition(summonCondition.name));
              }
            });
            entity.entityConditions = [];

            character.summons.forEach((summon) => (summon.tags = summon.tags.filter((tag) => tag != 'prism_mode')));
            entity.tags.push('prism_mode');
          }
        }

        gameManager.stateManager.after();
      }
    }
  }
}
