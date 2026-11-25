import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { CharacterSpecialAction } from 'src/app/game/model/data/CharacterStat';
import { Summon } from 'src/app/game/model/Summon';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';

export class SpecialActionsHelper {
  constructor(private component: EntitiesMenuDialogComponent) {}

  update() {
    this.component.specialActions = [];

    if (this.component.figure instanceof Character && this.component.figure.specialActions) {
      const character = this.component.figure as Character;

      character.specialActions.forEach((specialAction) => {
        const entity = this.component.entity;
        if (
          ((entity instanceof Character && !specialAction.summon) || (entity instanceof Summon && specialAction.summon)) &&
          entity.tags.includes(specialAction.name) &&
          !this.component.specialTags.includes(specialAction.name)
        ) {
          this.component.specialTags.push(specialAction.name);
        }
      });

      this.component.specialActions = character.specialActions.filter(
        (specialAction) =>
          (!!this.component.entity &&
            gameManager.specialActionsManager.specialActionAvailable(character, this.component.entity, specialAction)) ||
          this.component.specialTags.includes(specialAction.name)
      );
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

      const specialTagsToRemove = entity.tags.filter(
        (specialTag) =>
          character.specialActions &&
          character.specialActions.find((specialAction) => specialAction.name === specialTag) !== undefined &&
          !this.component.specialTags.includes(specialTag)
      );

      if (specialTagsToRemove.length) {
        this.component.before(
          'removeSpecialTags',
          specialTagsToRemove
            .map((specialTag) => '%data.character.' + character.edition + '.' + character.name + '.' + specialTag + '%')
            .join(',')
        );

        specialTagsToRemove.forEach((specialTagToRemove) => {
          gameManager.specialActionsManager.setSpecialAction(character, entity, specialTagToRemove, false);
        });

        if (entity instanceof Character) {
          this.component.entityImmunities = entity.immunities;
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
          gameManager.specialActionsManager.setSpecialAction(character, entity, specialTagToAdd, true);
        });

        if (entity instanceof Character) {
          this.component.entityImmunities = entity.immunities;
        }

        gameManager.stateManager.after();
      }
    }
  }
}
