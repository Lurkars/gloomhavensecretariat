import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ConditionName, ConditionType, EntityCondition, EntityConditionState } from "src/app/game/model/Condition";
import { EntityValueFunction } from "src/app/game/model/Entity";
import { GameState } from "src/app/game/model/Game";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { MonsterType } from "src/app/game/model/data/MonsterType";
import { ghsValueSign } from "../../helper/Static";

@Component({
  selector: 'ghs-entities-menu-dialog',
  templateUrl: 'entities-menu-dialog.html',
  styleUrls: ['./entities-menu-dialog.scss']
})
export class EntitiesMenuDialogComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  health: number[] = [];

  ConditionName = ConditionName;
  ConditionType = ConditionType;
  MonsterType = MonsterType;
  entities: MonsterEntity[];
  entityConditions: EntityCondition[] = [];

  toogleTypeAvailable: boolean;

  constructor(@Inject(DIALOG_DATA) public data: { monster: Monster, type: MonsterType | undefined }, private dialogRef: DialogRef) {
    this.entities = data.monster.entities.filter((entity) => !data.type || entity.type == data.type);
    this.dialogRef.closed.subscribe({
      next: (forced) => {
        if (!forced) {
          this.close();
        }
      }
    })
    this.toogleTypeAvailable = this.entities.some((entity) => entity.type == MonsterType.normal) && this.entities.some((entity) => entity.type == MonsterType.elite);

    this.entities.forEach((entity, index, self) => {
      entity.entityConditions.forEach((entityCondition) => {
        if (!this.entityConditions.find((other) => other.name == entityCondition.name) && self.every((otherEntity) => otherEntity.entityConditions.find((other) => other.name == entityCondition.name && other.state == entityCondition.state))) {
          this.entityConditions.push(JSON.parse(JSON.stringify(entityCondition)));
        }
      })
    })
  }

  changeHealth(value: number) {
    this.entities.forEach((entity, i) => {
      this.health[i] = this.health[i] || 0;
      this.health[i] += value;

      if (entity.health + this.health[i] > entity.maxHealth) {
        this.health[i] = EntityValueFunction(entity.maxHealth) - entity.health;
      } else if (entity.health + this.health[i] < 0) {
        this.health[i] = - entity.health;
      }
    });
  }

  minHealth(): number {
    if (this.health.length == 0) {
      this.health[0] = 0;
    }
    return this.health.reduce((a, b) => Math.min(a, b));
  }

  maxHealth(): number {
    if (this.health.length == 0) {
      this.health[0] = 0;
    }
    return this.health.reduce((a, b) => Math.max(a, b));
  }

  async toggleType() {
    await gameManager.stateManager.before("toggleTypeAll", "data.monster." + this.data.monster.name);
    this.entities.forEach((entity) => {
      entity.type = entity.type == MonsterType.elite ? MonsterType.normal : MonsterType.elite;
    });
    await gameManager.stateManager.after();
  }

  async toggleDead() {
    await gameManager.stateManager.before("monsterDead", "data.monster." + this.data.monster.name, this.data.type ? 'monster.' + this.data.type + ' ' : '');

    this.entities.forEach((entity) => {
      entity.dead = true;
    });

    setTimeout(async () => {
      this.entities.forEach(async (entity) => {
        if (gameManager.game.state == GameState.draw || entity.entityConditions.length == 0 || entity.entityConditions.every((entityCondition) => entityCondition.types.indexOf(ConditionType.turn) == -1 && entityCondition.types.indexOf(ConditionType.apply) == -1)) {
          gameManager.monsterManager.removeMonsterEntity(this.data.monster, entity);
        }
      });

      if (this.entities.every((monsterEntity) => !gameManager.entityManager.isAlive(monsterEntity))) {
        if (this.data.monster.active) {
          gameManager.roundManager.toggleFigure(this.data.monster);
        }
      }

      await gameManager.stateManager.after();
    }, settingsManager.settings.disableAnimations ? 0 : 1500);

    this.dialogRef.close(true);
  }

  async close() {
    this.entityConditions.filter((entityCondition) => entityCondition.state == EntityConditionState.new || entityCondition.state == EntityConditionState.removed).forEach(async (entityCondition) => {
      await gameManager.stateManager.before(...gameManager.entityManager.undoInfos(undefined, this.data.monster, entityCondition.state == EntityConditionState.removed ? "removeCondition" : "addCondition"), "game.condition." + entityCondition.name, this.data.type ? 'monster.' + this.data.type + ' ' : '');
      this.entities.forEach((entity) => {
        entityCondition.expired = entityCondition.state == EntityConditionState.new;
        if (entityCondition.state == EntityConditionState.removed) {
          gameManager.entityManager.removeCondition(entity, entityCondition);
        } else if (!gameManager.entityManager.isImmune(this.data.monster, entity, entityCondition.name)) {
          gameManager.entityManager.addCondition(entity, entityCondition, this.data.monster.active, this.data.monster.off);
        }
      })
      await gameManager.stateManager.after();
    })

    this.entityConditions.forEach(async (condition) => {
      if (this.entities.find((entity) => entity.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired && entityCondition.value != condition.value))) {
        await gameManager.stateManager.before(...gameManager.entityManager.undoInfos(undefined, this.data.monster, "setConditionValue"), "game.condition." + condition.name, "" + condition.value, this.data.type ? 'monster.' + this.data.type + ' ' : '');
        this.entities.forEach((entity) => {
          const entityCondition = entity.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired);
          if (entityCondition && entityCondition.value != condition.value) {
            entityCondition.value = condition.value;
          }
        })
        await gameManager.stateManager.after();
      }
    })

    if (this.minHealth() != 0 || this.maxHealth() != 0) {
      await gameManager.stateManager.before("changeMonsterHP", "data.monster." + this.data.monster.name, ghsValueSign(this.minHealth() != 0 ? this.minHealth() : this.maxHealth()), this.data.type ? 'monster.' + this.data.type + ' ' : '');
      let deadEntities: MonsterEntity[] = [];
      this.entities.forEach((entity, i) => {
        if (this.health[i] && this.health[i] != 0) {
          gameManager.entityManager.changeHealth(entity, this.health[i]);
          this.health[i] = 0;
        }

        if (entity.maxHealth > 0 && entity.health <= 0 || entity.dead) {
          entity.dead = true;
          deadEntities.push(entity);
        }
      })

      if (deadEntities.length > 0) {
        setTimeout(async () => {
          deadEntities.forEach(async (entity) => {
            if (gameManager.game.state == GameState.draw || entity.entityConditions.length == 0 || entity.entityConditions.every((entityCondition) => entityCondition.types.indexOf(ConditionType.turn) == -1 && entityCondition.types.indexOf(ConditionType.apply) == -1)) {
              gameManager.monsterManager.removeMonsterEntity(this.data.monster, entity);
            }
          })

          if (this.entities.every((monsterEntity) => !gameManager.entityManager.isAlive(monsterEntity))) {
            if (this.data.monster.active) {
              gameManager.roundManager.toggleFigure(this.data.monster);
            }
          }

          await gameManager.stateManager.after();
        }, settingsManager.settings.disableAnimations ? 0 : 1500);
      } else {
        await gameManager.stateManager.after();
      }
    }
  }

}