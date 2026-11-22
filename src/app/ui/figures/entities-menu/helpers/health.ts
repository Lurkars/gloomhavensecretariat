import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { ghsDialogClosingHelper, ghsRemoveDeadEntities, ghsValueSign } from 'src/app/ui/helper/Static';

export class HealthHelper {
  constructor(private component: EntitiesMenuDialogComponent) {}

  toggleDeadExhausted() {
    this.component.before(
      this.component.entity instanceof Character ? (this.component.entity.exhausted ? 'notExhausted' : 'exhausted') : 'dead'
    );
    this.component.entities.forEach((entity) => {
      if (entity instanceof Character) {
        gameManager.entityManager.setExhausted(entity, !entity.exhausted);
      } else {
        gameManager.entityManager.killEntity(entity, this.component.figureForEntity(entity));
      }
    });

    if (this.component.entity instanceof Character) {
      gameManager.stateManager.after();
    } else {
      const entities = this.component.entities.map((entity) => ({ entity, figure: this.component.figureForEntity(entity) }));
      entities.forEach(({ figure }) => gameManager.entityManager.deactivateDeadFigure(figure));
      ghsRemoveDeadEntities(entities.filter(({ entity }) => gameManager.entityManager.deadRemovable(entity)));
      gameManager.stateManager.after();
      ghsDialogClosingHelper(this.component.dialogRef, true);
    }
  }

  changeHealth(value: number) {
    this.component.health += value;
    if (!!this.component.entity) {
      const maxHealth = gameManager.specialActionsManager.maxHealth(this.component.entity, this.component.specialTags);

      if (this.component.maxHealth && this.component.entity.health + this.component.health > maxHealth + this.component.maxHealth) {
        this.component.health = maxHealth + this.component.maxHealth - this.component.entity.health;
      }
    }
  }

  changeMaxHealth(value: number) {
    this.component.maxHealth += value;

    if (this.component.figure instanceof ObjectiveContainer) {
      if (EntityValueFunction(this.component.figure.health) + this.component.maxHealth <= 1) {
        this.component.maxHealth = -EntityValueFunction(this.component.figure.health) + 1;
      }
    } else if (this.component.entity && EntityValueFunction(this.component.entity.maxHealth) + this.component.maxHealth <= 1) {
      this.component.maxHealth = -EntityValueFunction(this.component.entity.maxHealth) + 1;
    }
  }

  close() {
    const applicableEntities = this.component.applicableEntities;

    if (this.component.health !== 0 && applicableEntities.length) {
      this.component.before(
        this.component.trackDamage || settingsManager.settings.damageHP ? 'changeDamage' : 'changeHP',
        ghsValueSign(this.component.health)
      );
      applicableEntities.forEach((entity) => {
        const figure = this.component.figureForEntity(entity);

        let invertDamage = false;
        if (entity instanceof ObjectiveEntity && figure instanceof ObjectiveContainer && figure.objectiveId) {
          const objectiveData = gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(figure.objectiveId);
          invertDamage = !this.component.trackDamage && !!objectiveData && objectiveData.trackDamage;
        }

        gameManager.entityManager.changeHealth(
          entity,
          figure,
          (!settingsManager.settings.damageHP && invertDamage) ||
            (!invertDamage && !this.component.trackDamage && settingsManager.settings.damageHP)
            ? -this.component.health
            : this.component.health
        );
      });

      this.component.health = 0;

      ghsRemoveDeadEntities(this.component.entities.map((entity) => ({ entity, figure: this.component.figureForEntity(entity) })));
      gameManager.stateManager.after();
    }

    if (this.component.maxHealth !== 0 && applicableEntities.length) {
      this.component.before('changeMaxHP', ghsValueSign(this.component.maxHealth));
      applicableEntities.forEach((entity) => {
        if (entity.health === EntityValueFunction(entity.maxHealth)) {
          entity.health += this.component.maxHealth;
        }
        entity.maxHealth = EntityValueFunction(entity.maxHealth) + this.component.maxHealth;
        if (entity.health > entity.maxHealth) {
          entity.health = entity.maxHealth;
        }
      });
      gameManager.stateManager.after();
    }
  }
}
