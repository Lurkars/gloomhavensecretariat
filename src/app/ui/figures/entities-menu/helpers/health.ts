import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { ConditionType } from 'src/app/game/model/data/Condition';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { Summon } from 'src/app/game/model/Summon';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { ghsDialogClosingHelper, ghsValueSign } from 'src/app/ui/helper/Static';

export class HealthHelper {
  constructor(private component: EntitiesMenuDialogComponent) {}

  toggleDeadExhausted() {
    this.component.before(
      this.component.entity instanceof Character ? (this.component.entity.exhausted ? 'notExhausted' : 'exhausted') : 'dead'
    );
    this.component.entities.forEach((entity) => {
      if (entity instanceof MonsterEntity || entity instanceof Summon || entity instanceof ObjectiveEntity) {
        entity.dead = true;
      } else if (entity instanceof Character) {
        entity.exhausted = !entity.exhausted;
      }
    });

    if (this.component.entity instanceof Character) {
      gameManager.stateManager.after();
    } else {
      setTimeout(
        () => {
          this.component.entities.forEach((entity) => {
            const figure: Figure = this.component.figureForEntity(entity);
            if (
              gameManager.game.state === GameState.draw ||
              entity.entityConditions.length === 0 ||
              entity.entityConditions.every(
                (entityCondition) =>
                  !entityCondition.types.includes(ConditionType.turn) && !entityCondition.types.includes(ConditionType.apply)
              )
            ) {
              if (entity instanceof MonsterEntity) {
                gameManager.monsterManager.removeMonsterEntity(figure as Monster, entity);
              } else if (entity instanceof Summon) {
                gameManager.characterManager.removeSummon(figure as Character, entity);
              } else if (entity instanceof ObjectiveEntity) {
                gameManager.objectiveManager.removeObjectiveEntity(figure as ObjectiveContainer, entity);
              }
            }
            if (
              (figure instanceof Monster || figure instanceof ObjectiveContainer) &&
              figure.active &&
              figure.entities.every((entity) => !gameManager.entityManager.isAlive(entity))
            ) {
              gameManager.roundManager.toggleFigure(figure);
            }
          });

          gameManager.stateManager.after();
          this.component.ghsManager.triggerUiChange();
        },
        settingsManager.settings.animations ? 1500 * settingsManager.settings.animationSpeed : 0
      );
      ghsDialogClosingHelper(this.component.dialogRef, true);
    }
  }

  changeHealth(value: number) {
    this.component.health += value;
    if (!!this.component.entity) {
      let maxHealth = EntityValueFunction(this.component.entity.maxHealth);
      if (
        this.component.entity instanceof Character &&
        this.component.entity.name === 'lightning' &&
        this.component.specialTags.includes('unbridled-power')
      ) {
        maxHealth = Math.max(maxHealth, 26);
      }

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
    if (this.component.health !== 0) {
      this.component.before(
        this.component.trackDamage || settingsManager.settings.damageHP ? 'changeDamage' : 'changeHP',
        ghsValueSign(this.component.health)
      );
      const deadEntities: (MonsterEntity | Summon | ObjectiveEntity)[] = [];
      this.component.entities.forEach((entity) => {
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

        if (
          (entity instanceof MonsterEntity || entity instanceof Summon || entity instanceof ObjectiveEntity) &&
          ((EntityValueFunction(entity.maxHealth) > 0 && entity.health <= 0) || entity.dead)
        ) {
          entity.dead =
            entity.entityConditions.length === 0 ||
            entity.entityConditions.every(
              (entityCondition) =>
                !entityCondition.highlight ||
                entityCondition.types.includes(ConditionType.hidden) ||
                (!entityCondition.types.includes(ConditionType.turn) && !entityCondition.types.includes(ConditionType.apply))
            );
          deadEntities.push(entity);
        }
      });

      this.component.health = 0;

      if (deadEntities.length > 0) {
        setTimeout(
          () => {
            deadEntities.forEach((entity) => {
              const figure = this.component.figureForEntity(entity);
              if (entity.dead) {
                if (figure instanceof Monster && entity instanceof MonsterEntity) {
                  gameManager.monsterManager.removeMonsterEntity(figure, entity);
                } else if (figure instanceof Character && entity instanceof Summon) {
                  gameManager.characterManager.removeSummon(figure, entity);
                } else if (figure instanceof ObjectiveContainer && entity instanceof ObjectiveEntity) {
                  gameManager.objectiveManager.removeObjectiveEntity(figure, entity);
                }
              }
            });

            this.component.figures.forEach((figure) => {
              if (
                figure instanceof Monster &&
                figure.active &&
                (figure.entities.every((entity) => !gameManager.entityManager.isAlive(entity)) || figure.entities.length === 0)
              ) {
                gameManager.roundManager.toggleFigure(figure);
              } else if (
                figure instanceof ObjectiveContainer &&
                (figure.entities.every((entity) => !gameManager.entityManager.isAlive(entity)) || figure.entities.length === 0)
              ) {
                gameManager.objectiveManager.removeObjective(figure);
              }
            });

            gameManager.stateManager.after();
          },
          settingsManager.settings.animations ? 1500 * settingsManager.settings.animationSpeed : 0
        );
      } else {
        gameManager.stateManager.after();
      }
    }

    if (this.component.maxHealth !== 0) {
      this.component.before('changeMaxHP', ghsValueSign(this.component.maxHealth));
      this.component.entities.forEach((entity) => {
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
