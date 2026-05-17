import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterSpecialAction } from 'src/app/game/model/data/CharacterStat';
import { Condition, ConditionName, ConditionType, EntityConditionState } from 'src/app/game/model/data/Condition';
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
          character.specialActions.find((specialAction) => specialAction.name === specialTag) !== undefined &&
          !this.component.specialTags.includes(specialTag)
      );

      if (specialTagsToTemove.length) {
        this.component.before(
          'removeSpecialTags',
          specialTagsToTemove
            .map((specialTag) => '%data.character.' + character.edition + '.' + character.name + '.' + specialTag + '%')
            .join(',')
        );

        specialTagsToTemove.forEach((specialTagToRemove) => {
          gameManager.specialActionsManager.removeSpecialAction(entity, character, specialTagToRemove);
        });

        if (entity instanceof Character) {
          if (entity.name === 'lightning' && specialTagsToTemove.includes('careless-charge')) {
            this.component.entityImmunities = entity.immunities;
          }

          if (entity.name === 'shackles' && specialTagsToTemove.includes('delayed_malady')) {
            this.component.entityImmunities = entity.immunities;
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

        specialTagsToAdd.forEach((specialTagToAdd) => {
          gameManager.specialActionsManager.addSpecialAction(entity, character, specialTagToAdd);
        });

        if (entity instanceof Character) {
          if (entity.name === 'lightning' && specialTagsToAdd.includes('careless-charge')) {
            entity.immunities = gameManager.conditionsForTypes('character', 'negative').map((condition) => condition.name);
            entity.immunities.push(ConditionName.curse);
            if (gameManager.entityManager.hasCondition(this.component.entity, new Condition(ConditionName.enfeeble))) {
              entity.immunities.push(ConditionName.enfeeble);
            }
            this.component.entityImmunities = character.immunities;
          }

          if (entity.name === 'shackles' && specialTagsToAdd.includes('delayed_malady')) {
            entity.entityConditions.forEach((condition) => {
              if (
                condition.types.includes(ConditionType.negative) &&
                !condition.expired &&
                condition.state !== EntityConditionState.removed &&
                !this.component.entityConditions.find(
                  (removed) => removed.state === EntityConditionState.removed && removed.name === condition.name
                ) &&
                !entity.immunities.includes(condition.name)
              ) {
                entity.immunities.push(condition.name);
              }
            });

            this.component.entityConditions.forEach((condition) => {
              if (condition.state === EntityConditionState.new) {
                entity.immunities.push(condition.name);
              }
            });

            this.component.entityImmunities = character.immunities;
          }
        }

        gameManager.stateManager.after();
      }
    }
  }
}
