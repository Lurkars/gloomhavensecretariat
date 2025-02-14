import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, HostListener, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ConditionName, ConditionType, EntityCondition, EntityConditionState } from "src/app/game/model/data/Condition";
import { GameState } from "src/app/game/model/Game";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { MonsterType } from "src/app/game/model/data/MonsterType";
import { ghsDialogClosingHelper, ghsValueSign } from "../../helper/Static";
import { EntityValueFunction } from "src/app/game/model/Entity";
import { Summon, SummonState } from "src/app/game/model/Summon";
import { Character } from "src/app/game/model/Character";
import { ObjectiveEntity } from "src/app/game/model/ObjectiveEntity";
import { ObjectiveContainer } from "src/app/game/model/ObjectiveContainer";
import { MonsterData } from "src/app/game/model/data/MonsterData";

@Component({
	standalone: false,
  selector: 'ghs-entities-menu-dialog',
  templateUrl: 'entities-menu-dialog.html',
  styleUrls: ['./entities-menu-dialog.scss']
})
export class EntitiesMenuDialogComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  health: number = 0;
  maxHealth: number = 0;

  ConditionName = ConditionName;
  ConditionType = ConditionType;
  MonsterType = MonsterType;
  entities: (MonsterEntity | Summon | ObjectiveEntity)[];
  allEntities: (MonsterEntity | Summon | ObjectiveEntity)[] = [];
  entityConditions: EntityCondition[] = [];
  initialImmunities: ConditionName[] = [];
  entityImmunities: ConditionName[] = [];
  monster: Monster | undefined;
  character: Character | undefined;
  objective: ObjectiveContainer | undefined;

  SummonState = SummonState;
  EntityValueFunction = EntityValueFunction;

  constructor(@Inject(DIALOG_DATA) public data: { monster: Monster, character: Character, objective: ObjectiveContainer, type: MonsterType | undefined }, private dialogRef: DialogRef) {
    if (this.data.monster) {
      this.monster = this.data.monster;
      this.allEntities = this.monster.entities.filter((entity) => !data.type || entity.type == data.type);
    } else if (this.data.character) {
      this.character = this.data.character;
      this.allEntities = this.character.summons;
    } else if (this.data.objective) {
      this.objective = this.data.objective;
      this.allEntities = this.objective.entities;
    }
    this.dialogRef.closed.subscribe({
      next: (forced) => {
        if (!forced) {
          this.close();
        }
      }
    })

    this.entities = [];
    this.allEntities.forEach((entity) => this.entities.push(entity));
    this.update();
  }

  @HostListener('document:keydown', ['$event'])
  keyboardShortcuts(event: KeyboardEvent) {
    if (settingsManager.settings.keyboardShortcuts && !event.altKey && !event.metaKey && (!window.document.activeElement || window.document.activeElement.tagName != 'INPUT' && window.document.activeElement.tagName != 'SELECT' && window.document.activeElement.tagName != 'TEXTAREA')) {
      if (!event.ctrlKey && !event.shiftKey && event.key === 'ArrowRight') {
        this.changeHealth(1);
        event.preventDefault();
        event.stopPropagation();
      } else if (!event.ctrlKey && !event.shiftKey && event.key === 'ArrowLeft') {
        this.changeHealth(-1);
        event.preventDefault();
        event.stopPropagation();
      } else if (!event.ctrlKey && !event.shiftKey && event.key === 'ArrowUp') {
        this.changeMaxHealth(1);
        event.preventDefault();
        event.stopPropagation();
      } else if (!event.ctrlKey && !event.shiftKey && event.key === 'ArrowDown') {
        this.changeMaxHealth(-1);
        event.preventDefault();
        event.stopPropagation();
      } else if (!event.ctrlKey && !event.shiftKey && (event.key.toLowerCase() === 'k' || event.key.toLowerCase() === 'd')) {
        this.toggleDead();
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  update() {
    this.entityConditions = [];

    this.entities.forEach((entity, index, self) => {
      entity.entityConditions.forEach((entityCondition) => {
        if (!this.entityConditions.find((other) => other.name == entityCondition.name) && self.every((otherEntity) => otherEntity.entityConditions.find((other) => other.name == entityCondition.name && other.state == entityCondition.state))) {
          this.entityConditions.push(JSON.parse(JSON.stringify(entityCondition)));
        }
      })

      entity.immunities.forEach((immunity) => {
        if (!this.entityImmunities.find((other) => other == immunity) && self.every((otherEntity) => otherEntity.immunities.find((other) => other == immunity))) {
          this.entityImmunities.push(immunity);
          this.initialImmunities.push(immunity);
        }
      })
    })
  }

  toggleEntity(entity: MonsterEntity | Summon | ObjectiveEntity) {
    if (this.entities.indexOf(entity) == -1) {
      this.entities.push(entity);
    } else {
      this.entities.splice(this.entities.indexOf(entity), 1);
    }
    this.update();
  }

  changeHealth(value: number) {
    this.health += value;
  }

  changeMaxHealth(value: number) {
    this.maxHealth += value;
  }


  toggleType() {
    if (this.monster) {
      const normalStat = this.monster.stats.find((stat) => {
        return this.monster && stat.level == this.monster.level && stat.type == MonsterType.normal;
      });
      const eliteStat = this.monster.stats.find((stat) => {
        return this.monster && stat.level == this.monster.level && stat.type == MonsterType.elite;
      });
      if (normalStat && eliteStat) {
        gameManager.stateManager.before("toggleTypeAll", "monster." + this.monster.name);
        this.entities.forEach((entity) => {
          if (this.monster && gameManager.entityManager.isAlive(entity) && entity instanceof MonsterEntity) {
            entity.type = entity.type == MonsterType.elite ? MonsterType.normal : MonsterType.elite;
            entity.maxHealth = EntityValueFunction(entity.type == MonsterType.normal ? normalStat.health : eliteStat.health, this.monster.level)
            if (entity.health > entity.maxHealth) {
              entity.health = entity.maxHealth;
            } else if (entity.health < entity.maxHealth && entity.health == EntityValueFunction(entity.type == MonsterType.normal ? eliteStat.health : normalStat.health, this.monster.level)) {
              entity.health = entity.maxHealth;
            }
          }
        });
        gameManager.stateManager.after();
      } else {
        console.warn("Missing stats!", this.monster);
      }
    }
  }

  toggleDead() {
    if (this.monster) {
      gameManager.stateManager.before("monsterDead", "monster." + this.monster.name, this.data.type ? 'monster.' + this.data.type + ' ' : '');
    } else if (this.character) {
      gameManager.stateManager.before("summonsDead", gameManager.characterManager.characterName(this.character));
    } else if (this.objective) {
      gameManager.stateManager.before("objectivesDead", gameManager.objectiveManager.objectiveName(this.objective));
    }
    this.entities.forEach((entity) => {
      entity.dead = true;
    });

    setTimeout(() => {
      this.entities.forEach((entity) => {
        if (gameManager.game.state == GameState.draw || entity.entityConditions.length == 0 || entity.entityConditions.every((entityCondition) => entityCondition.types.indexOf(ConditionType.turn) == -1 && entityCondition.types.indexOf(ConditionType.apply) == -1)) {
          if (this.monster && entity instanceof MonsterEntity) {
            gameManager.monsterManager.removeMonsterEntity(this.monster, entity);
          } else if (this.character && entity instanceof Summon) {
            gameManager.characterManager.removeSummon(this.character, entity);
          } else if (this.objective && entity instanceof ObjectiveEntity) {
            gameManager.objectiveManager.removeObjectiveEntity(this.objective, entity);
          }
        }
      });

      if (this.entities.every((entity) => !gameManager.entityManager.isAlive(entity))) {
        if (this.monster && this.monster.active) {
          gameManager.roundManager.toggleFigure(this.monster);
        }
      }

      gameManager.stateManager.after();
      gameManager.uiChange.emit();
    }, !settingsManager.settings.animations ? 0 : 1500);

    ghsDialogClosingHelper(this.dialogRef, true);
  }

  close(): void {
    this.entityConditions.filter((entityCondition) => entityCondition.state == EntityConditionState.new || entityCondition.state == EntityConditionState.removed).forEach((entityCondition) => {
      if (this.monster) {
        gameManager.stateManager.before(...gameManager.entityManager.undoInfos(undefined, this.monster, entityCondition.state == EntityConditionState.removed ? "removeCondition" : "addCondition"), entityCondition.name, this.data.type ? 'monster.' + this.data.type + ' ' : '');
      } else if (this.character) {
        gameManager.stateManager.before(entityCondition.state == EntityConditionState.removed ? "removeCondition.summons" : "addCondition.summons", gameManager.characterManager.characterName(this.character), entityCondition.name);
      } else if (this.objective) {
        gameManager.stateManager.before(entityCondition.state == EntityConditionState.removed ? "removeCondition.objectives" : "addCondition.objectives", gameManager.objectiveManager.objectiveName(this.objective), entityCondition.name);
      }
      this.entities.forEach((entity) => {
        entityCondition.expired = entityCondition.state == EntityConditionState.new;
        if (entityCondition.state == EntityConditionState.removed) {
          gameManager.entityManager.removeCondition(entity, this.monster || this.character || this.objective || new Monster(new MonsterData()), entityCondition, entityCondition.permanent);
        } else if (this.monster && !gameManager.entityManager.isImmune(entity, this.monster, entityCondition.name)) {
          gameManager.entityManager.addCondition(entity, this.monster || this.character || this.objective || new Monster(new MonsterData()), entityCondition, entityCondition.permanent);
        } else if (this.character) {
          gameManager.entityManager.addCondition(entity, this.monster || this.character || this.objective || new Monster(new MonsterData()), entityCondition, entityCondition.permanent);
        } else if (this.objective) {
          gameManager.entityManager.addCondition(entity, this.monster || this.character || this.objective || new Monster(new MonsterData()), entityCondition, entityCondition.permanent);
        }
      })
      gameManager.stateManager.after();
    })

    this.entityConditions.forEach((condition) => {
      if (this.entities.find((entity) => entity.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired && entityCondition.value != condition.value))) {

        if (this.monster) {
          gameManager.stateManager.before(...gameManager.entityManager.undoInfos(undefined, this.monster, "setConditionValue"), condition.name, "" + condition.value, this.data.type ? 'monster.' + this.data.type + ' ' : '');
        } else if (this.character) {
          gameManager.stateManager.before("setConditionValue.summons", gameManager.characterManager.characterName(this.character), condition.name, "" + condition.value);
        } else if (this.objective) {
          gameManager.stateManager.before("setConditionValue.objectives", gameManager.objectiveManager.objectiveName(this.objective), condition.name, "" + condition.value);
        }


        this.entities.forEach((entity) => {
          const entityCondition = entity.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired);
          if (entityCondition && entityCondition.value != condition.value) {
            entityCondition.value = condition.value;
          }
        })
        gameManager.stateManager.after();
      }
    })

    this.initialImmunities.forEach((immunity) => {
      if (this.entityImmunities.indexOf(immunity) == -1) {
        if (this.monster) {
          gameManager.stateManager.before(...gameManager.entityManager.undoInfos(undefined, this.monster, "removeImmunity"), immunity, this.data.type ? 'monster.' + this.data.type + ' ' : '');
        } else if (this.character) {
          gameManager.stateManager.before("removeImmunity.summons", gameManager.characterManager.characterName(this.character), immunity);
        } else if (this.objective) {
          gameManager.stateManager.before("removeImmunity.objectives", gameManager.objectiveManager.objectiveName(this.objective), immunity);
        }

        this.entities.forEach((entity) => {
          entity.immunities = entity.immunities.filter((existing) => existing != immunity);
        })
        gameManager.stateManager.after();
      }
    })

    this.entityImmunities.forEach((immunity) => {
      if (this.initialImmunities.indexOf(immunity) == -1) {
        if (this.monster) {
          gameManager.stateManager.before(...gameManager.entityManager.undoInfos(undefined, this.monster, "addImmunity"), immunity, this.data.type ? 'monster.' + this.data.type + ' ' : '');
        } else if (this.character) {
          gameManager.stateManager.before("addImmunity.summons", gameManager.characterManager.characterName(this.character), immunity);
        } else if (this.objective) {
          gameManager.stateManager.before("addImmunity.objectives", gameManager.objectiveManager.objectiveName(this.objective), immunity);
        }

        this.entities.forEach((entity) => {
          entity.immunities.push(immunity);
        })
        gameManager.stateManager.after();
      }
    })

    if (this.health != 0) {
      if (this.monster) {
        gameManager.stateManager.before("changeMonsterHP", "monster." + this.monster.name, ghsValueSign(this.health), this.data.type ? 'monster.' + this.data.type + ' ' : '');
      } else if (this.character) {
        gameManager.stateManager.before("changeSummonsHP", gameManager.characterManager.characterName(this.character), ghsValueSign(this.health));
      } else if (this.objective) {
        gameManager.stateManager.before("changeObjectivesHP", gameManager.objectiveManager.objectiveName(this.objective), ghsValueSign(this.health));
      }
      let deadEntities: (MonsterEntity | Summon | ObjectiveEntity)[] = [];
      this.entities.forEach((entity) => {
        if (this.health != 0) {
          if (this.monster) {
            gameManager.entityManager.changeHealth(entity, this.monster, this.health);
          } else if (this.character) {
            gameManager.entityManager.changeHealth(entity, this.character, this.health);
          } else if (this.objective) {
            gameManager.entityManager.changeHealth(entity, this.objective, this.health);
          }
        }

        if (entity.maxHealth > 0 && entity.health <= 0 || entity.dead) {
          entity.dead = entity.entityConditions.length == 0 || entity.entityConditions.every((entityCondition) => !entityCondition.highlight || entityCondition.types.indexOf(ConditionType.turn) == -1 && entityCondition.types.indexOf(ConditionType.apply) == -1);
          deadEntities.push(entity);
        }
      })

      this.health = 0;

      if (deadEntities.length > 0) {
        setTimeout(() => {
          deadEntities.forEach((entity) => {
            if (entity.dead) {
              if (this.monster && entity instanceof MonsterEntity) {
                gameManager.monsterManager.removeMonsterEntity(this.monster, entity);
              } else if (this.character && entity instanceof Summon) {
                gameManager.characterManager.removeSummon(this.character, entity);
              } else if (this.objective && entity instanceof ObjectiveEntity) {
                gameManager.objectiveManager.removeObjectiveEntity(this.objective, entity);
              }
            }
          })

          if (this.entities.every((entity) => !gameManager.entityManager.isAlive(entity))) {
            if (this.monster && this.monster.active) {
              gameManager.roundManager.toggleFigure(this.monster);
            }
            if (this.objective) {
              gameManager.objectiveManager.removeObjective(this.objective);
            }
          }

          if (this.objective && this.objective.entities.length == 0) {
            gameManager.objectiveManager.removeObjective(this.objective);
          }

          gameManager.stateManager.after();
        }, !settingsManager.settings.animations ? 0 : 1500);
      } else {
        gameManager.stateManager.after();
      }
    }

    if (this.maxHealth != 0) {
      if (this.monster) {
        gameManager.stateManager.before("changeMonsterMaxHP", "monster." + this.monster.name, ghsValueSign(this.health), this.data.type ? 'monster.' + this.data.type + ' ' : '');
      } else if (this.character) {
        gameManager.stateManager.before("changeSummonsMaxHP", gameManager.characterManager.characterName(this.character), ghsValueSign(this.health));
      } else if (this.objective) {
        gameManager.stateManager.before("changeObjectivesMaxHP", gameManager.objectiveManager.objectiveName(this.objective), ghsValueSign(this.health));
        this.objective.health = ghsValueSign(this.health);
      }

      this.entities.forEach((entity) => {
        if (entity.health == entity.maxHealth) {
          entity.health += this.maxHealth;
        }
        entity.maxHealth += this.maxHealth;
        if (entity.health > entity.maxHealth) {
          entity.health = entity.maxHealth;
        }
      })

      gameManager.stateManager.after();
    }
  }

}