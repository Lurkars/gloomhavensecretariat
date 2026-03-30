import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, HostListener, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { GhsManager } from "src/app/game/businesslogic/GhsManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Entity, EntityValueFunction } from "src/app/game/model/Entity";
import { Figure } from "src/app/game/model/Figure";
import { GameState } from "src/app/game/model/Game";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { ObjectiveContainer } from "src/app/game/model/ObjectiveContainer";
import { ObjectiveEntity } from "src/app/game/model/ObjectiveEntity";
import { Summon, SummonColor, SummonState } from "src/app/game/model/Summon";
import { Action, ActionType, ActionValueType } from "src/app/game/model/data/Action";
import { ConditionName, ConditionType, EntityCondition, EntityConditionState } from "src/app/game/model/data/Condition";
import { MonsterData } from "src/app/game/model/data/MonsterData";
import { MonsterType } from "src/app/game/model/data/MonsterType";
import { ghsDialogClosingHelper, ghsValueSign } from "../../helper/Static";

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

  entityShield: Action = new Action(ActionType.shield, 0);
  entityShieldPersistent: Action = new Action(ActionType.shield, 0);
  entityRetaliate: Action[] = [new Action(ActionType.retaliate, 0)];
  entityRetaliatePersistent: Action[] = [new Action(ActionType.retaliate, 0)];
  entityRetaliateRange: Action[] = [new Action(ActionType.range, 1, ActionValueType.fixed, [], true)];
  entityRetaliateRangePersistent: Action[] = [new Action(ActionType.range, 1, ActionValueType.fixed, [], true)];

  ConditionName = ConditionName;
  ConditionType = ConditionType;
  MonsterType = MonsterType;
  figures: Figure[] = [];
  entities: Entity[];
  allEntities: Entity[] = [];
  entityConditions: EntityCondition[] = [];
  initialImmunities: ConditionName[] = [];
  entityImmunities: ConditionName[] = [];
  monster: Monster | undefined;
  character: Character | undefined;
  objective: ObjectiveContainer | undefined;

  filter: 'character' | 'monster' | 'allies' | 'enemies' | 'objectives' | undefined;
  filters: ('character' | 'monster' | 'allies' | 'enemies' | 'objectives' | undefined)[] = [undefined, 'character', 'monster', 'objectives', 'allies', 'enemies'];

  SummonState = SummonState;
  SummonColor = SummonColor;
  EntityValueFunction = EntityValueFunction;

  constructor(@Inject(DIALOG_DATA) public data: { monster: Monster, character: Character, objective: ObjectiveContainer, type: MonsterType | undefined, filter: 'character' | 'monster' | 'allies' | 'enemies' | 'objectives' | undefined }, private dialogRef: DialogRef, private ghsManager: GhsManager) {
    this.filter = !!this.data ? this.data.filter : undefined;
    if (!!this.data && this.data.monster) {
      this.monster = this.data.monster;
      this.allEntities = this.monster.entities.filter((entity) => !data.type || entity.type == data.type);
    } else if (!!this.data && this.data.character) {
      this.character = this.data.character;
      this.allEntities = this.character.summons;
    } else if (!!this.data && this.data.objective) {
      this.objective = this.data.objective;
      this.allEntities = this.objective.entities;
    } else {
      this.updateFigures();
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

  updateFigures() {

    if (gameManager.game.figures.find((figure) => figure instanceof Character) == undefined) {
      this.filters = this.filters.filter((v) => v != 'character');
    } else if (!this.filters.includes('character')) {
      this.filters.push('character');
    }

    if (gameManager.game.figures.find((figure) => figure instanceof Monster) == undefined) {
      this.filters = this.filters.filter((v) => v != 'monster');
    } else if (!this.filters.includes('monster')) {
      this.filters.push('monster');
    }

    if (gameManager.game.figures.find((figure) => figure instanceof ObjectiveContainer) == undefined) {
      this.filters = this.filters.filter((v) => v != 'objectives');
    } else if (!this.filters.includes('objectives')) {
      this.filters.push('objectives');
    }

    if (gameManager.game.figures.find((figure) => figure instanceof ObjectiveContainer && figure.escort || figure instanceof Monster && figure.isAlly) == undefined) {
      this.filters = this.filters.filter((v) => v != 'allies');
    } else if (!this.filters.includes('allies')) {
      this.filters.push('allies');
    }

    if (gameManager.game.figures.find((figure) => figure instanceof ObjectiveContainer && !figure.escort) == undefined) {
      this.filters = this.filters.filter((v) => v != 'enemies');
    } else if (!this.filters.includes('enemies')) {
      this.filters.push('enemies');
    }

    this.figures = gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent && (!this.filter || this.filter == 'character' || this.filter == 'allies') || figure instanceof Monster && (!this.filter || this.filter == 'monster' || this.filter == 'enemies' && !figure.isAlly || this.filter == 'allies' && figure.isAlly) || figure instanceof ObjectiveContainer && (!this.filter || this.filter == 'allies' && figure.escort || this.filter == 'enemies' && !figure.escort || this.filter == 'objectives'));

    this.figures.forEach((figure) => {
      if (figure instanceof Character) {
        this.allEntities.push(figure, ...figure.summons);
      } else if (figure instanceof Monster || figure instanceof ObjectiveContainer) {
        this.allEntities.push(...figure.entities);
      }
    })

    this.entities = [];
    this.allEntities.forEach((entity) => this.entities.push(entity));
    this.update();
  }

  setFilter(filter: 'character' | 'monster' | 'allies' | 'enemies' | 'objectives' | undefined = undefined) {
    this.filter = filter;
    this.updateFigures();
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

  toggleEntity(entity: Entity) {
    if (!this.entities.includes(entity)) {
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
      if (entity instanceof MonsterEntity || entity instanceof Summon || entity instanceof ObjectiveEntity) {
        entity.dead = true;
      } else if (entity instanceof Character) {
        entity.exhausted = true;
      }
    });

    setTimeout(() => {
      this.entities.forEach((entity) => {
        if (gameManager.game.state == GameState.draw || entity.entityConditions.length == 0 || entity.entityConditions.every((entityCondition) => !entityCondition.types.includes(ConditionType.turn) && !entityCondition.types.includes(ConditionType.apply))) {
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
      this.ghsManager.triggerUiChange();
    }, settingsManager.settings.animations ? 1500 * settingsManager.settings.animationSpeed : 0);

    ghsDialogClosingHelper(this.dialogRef, true);
  }


  changeShield(value: number) {
    this.entityShield.value = EntityValueFunction(this.entityShield.value) + value;
    this.ghsManager.triggerUiChange();
  }

  changeShieldPersistent(value: number) {
    this.entityShieldPersistent.value = EntityValueFunction(this.entityShieldPersistent.value) + value;
    this.ghsManager.triggerUiChange();
  }

  changeRetaliate(index: number, value: number, range: number, remove: boolean = false) {
    if (!this.entityRetaliate[index]) {
      this.entityRetaliate[index] = new Action(ActionType.retaliate, 0);
    }
    if (!this.entityRetaliateRange[index]) {
      this.entityRetaliateRange[index] = new Action(ActionType.range, 1);
      this.entityRetaliateRange[index].small = true;
    }

    this.entityRetaliate[index].value = EntityValueFunction(this.entityRetaliate[index].value) + value;
    this.entityRetaliateRange[index].value = EntityValueFunction(this.entityRetaliateRange[index].value) + range;

    if (remove && this.entityRetaliate.length > 1) {
      this.entityRetaliate.splice(index, 1);
      this.entityRetaliateRange.splice(index, 1);
    }

    this.ghsManager.triggerUiChange();
  }



  changeRetaliatePersistent(index: number, value: number, range: number, remove: boolean = false) {
    if (!this.entityRetaliatePersistent[index]) {
      this.entityRetaliatePersistent[index] = new Action(ActionType.retaliate, 0);
    }
    if (!this.entityRetaliateRangePersistent[index]) {
      this.entityRetaliateRangePersistent[index] = new Action(ActionType.range, 1);
      this.entityRetaliateRangePersistent[index].small = true;
    }

    this.entityRetaliatePersistent[index].value = EntityValueFunction(this.entityRetaliatePersistent[index].value) + value;
    this.entityRetaliateRangePersistent[index].value = EntityValueFunction(this.entityRetaliateRangePersistent[index].value) + range;

    if (remove && this.entityRetaliatePersistent.length > 1) {
      this.entityRetaliatePersistent.splice(index, 1);
      this.entityRetaliateRangePersistent.splice(index, 1);
    }

    this.ghsManager.triggerUiChange();
  }

  close(): void {

    if (this.figures.length) {
      this.closeFigures();
    } else {

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
        if (!this.entityImmunities.includes(immunity)) {
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
        if (!this.initialImmunities.includes(immunity)) {
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

          if ((entity instanceof MonsterEntity || entity instanceof Summon || entity instanceof ObjectiveEntity) && (EntityValueFunction(entity.maxHealth) > 0 && entity.health <= 0 || entity.dead)) {
            entity.dead = entity.entityConditions.length == 0 || entity.entityConditions.every((entityCondition) => !entityCondition.highlight || entityCondition.types.includes(ConditionType.hidden) || !entityCondition.types.includes(ConditionType.turn) && !entityCondition.types.includes(ConditionType.apply));
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
          }, settingsManager.settings.animations ? 1500 * settingsManager.settings.animationSpeed : 0);
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
          if (entity.health == EntityValueFunction(entity.maxHealth)) {
            entity.health += this.maxHealth;
          }
          entity.maxHealth = EntityValueFunction(entity.maxHealth) + this.maxHealth;
          if (entity.health > entity.maxHealth) {
            entity.health = entity.maxHealth;
          }
        })

        gameManager.stateManager.after();
      }
    }
  }

  figureForEntity(entity: Entity): Figure {
    let result: Figure | undefined;
    if (entity instanceof Character) {
      result = entity;
    } else if (entity instanceof Summon) {
      result = this.figures.find((figure) => figure instanceof Character && figure.summons.includes(entity));
    } else if (entity instanceof MonsterEntity) {
      result = this.figures.find((figure) => figure instanceof Monster && figure.entities.includes(entity));
    } else if (entity instanceof ObjectiveEntity) {
      result = this.figures.find((figure) => figure instanceof ObjectiveContainer && figure.entities.includes(entity));
    }

    if (!result) {
      console.warn("No figure found for entity:", entity);
      return new Monster(new MonsterData());
    }
    return result;
  }

  closeFigures(): void {
    this.entityConditions.filter((entityCondition) => entityCondition.state == EntityConditionState.new || entityCondition.state == EntityConditionState.removed).forEach((entityCondition) => {

      gameManager.stateManager.before(entityCondition.state == EntityConditionState.removed ? "entities.removeCondition" : "entities.addCondition", entityCondition.name);

      this.figures.forEach((figure) => {
        if (figure instanceof Character && this.entities.includes(figure)) {

        }
      })

      this.entities.forEach((entity) => {
        entityCondition.expired = entityCondition.state == EntityConditionState.new;
        if (entityCondition.state == EntityConditionState.removed) {
          gameManager.entityManager.removeCondition(entity, this.figureForEntity(entity), entityCondition, entityCondition.permanent);
        } else {
          gameManager.entityManager.addCondition(entity, this.figureForEntity(entity), entityCondition, entityCondition.permanent);
        }
      })

      gameManager.stateManager.after();
    })

    this.entityConditions.forEach((condition) => {
      if (this.entities.find((entity) => entity.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired && entityCondition.value != condition.value))) {
        gameManager.stateManager.before("entities.setConditionValue", condition.name, "" + condition.value);
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
      if (!this.entityImmunities.includes(immunity)) {
        gameManager.stateManager.before("entities.removeImmunity", immunity);
        this.entities.forEach((entity) => {
          entity.immunities = entity.immunities.filter((existing) => existing != immunity);
        })
        gameManager.stateManager.after();
      }
    })

    this.entityImmunities.forEach((immunity) => {
      if (!this.initialImmunities.includes(immunity)) {
        gameManager.stateManager.before("entities.addImmunity", immunity);
        this.entities.forEach((entity) => {
          entity.immunities.push(immunity);
        })
        gameManager.stateManager.after();
      }
    })

    if (this.health != 0) {
      gameManager.stateManager.before("entities.changeHP", ghsValueSign(this.health));
      let deadEntities: (MonsterEntity | Summon | ObjectiveEntity)[] = [];
      this.entities.forEach((entity) => {
        if (this.health != 0) {
          gameManager.entityManager.changeHealth(entity, this.figureForEntity(entity), this.health);
        }

        if ((entity instanceof MonsterEntity || entity instanceof Summon || entity instanceof ObjectiveEntity) && (EntityValueFunction(entity.maxHealth) > 0 && entity.health <= 0 || entity.dead)) {
          entity.dead = entity.entityConditions.length == 0 || entity.entityConditions.every((entityCondition) => !entityCondition.highlight || entityCondition.types.includes(ConditionType.hidden) || !entityCondition.types.includes(ConditionType.turn) && !entityCondition.types.includes(ConditionType.apply));
          deadEntities.push(entity);
        }
      })

      this.health = 0;

      if (deadEntities.length > 0) {
        setTimeout(() => {
          deadEntities.forEach((entity) => {
            const figure = this.figureForEntity(entity);
            if (entity.dead) {
              if (figure instanceof Monster && entity instanceof MonsterEntity) {
                gameManager.monsterManager.removeMonsterEntity(figure, entity);
              } else if (figure instanceof Character && entity instanceof Summon) {
                gameManager.characterManager.removeSummon(figure, entity);
              } else if (figure instanceof ObjectiveContainer && entity instanceof ObjectiveEntity) {
                gameManager.objectiveManager.removeObjectiveEntity(figure, entity);
              }
            }
          })

          this.figures.forEach((figure) => {
            if (figure instanceof Monster && figure.active && (figure.entities.every((entity) => !gameManager.entityManager.isAlive(entity)) || figure.entities.length == 0)) {
              gameManager.roundManager.toggleFigure(figure);
            } else if (figure instanceof ObjectiveContainer && (figure.entities.every((entity) => !gameManager.entityManager.isAlive(entity)) || figure.entities.length == 0)) {

              gameManager.objectiveManager.removeObjective(figure);
            }
          })

          gameManager.stateManager.after();
        }, settingsManager.settings.animations ? 1500 * settingsManager.settings.animationSpeed : 0);
      } else {
        gameManager.stateManager.after();
      }
    }

    if (this.maxHealth != 0) {
      gameManager.stateManager.before("entities.changeMaxHP", ghsValueSign(this.health));
      this.entities.forEach((entity) => {
        if (entity.health == EntityValueFunction(entity.maxHealth)) {
          entity.health += this.maxHealth;
        }
        entity.maxHealth = EntityValueFunction(entity.maxHealth) + this.maxHealth;
        if (entity.health > entity.maxHealth) {
          entity.health = entity.maxHealth;
        }
      })
      gameManager.stateManager.after();
    }

    if (this.entityShield.value) {
      gameManager.stateManager.before("entities.changeShield", this.entityShield.value);
      this.entities.forEach((entity) => {
        if (entity.shield) {
          entity.shield.value = EntityValueFunction(entity.shield.value) + EntityValueFunction(this.entityShield.value);
        } else {
          entity.shield = this.entityShield;
        }
        if (EntityValueFunction(entity.shield.value) <= 0) {
          entity.shield = undefined;
        }
      })
      gameManager.stateManager.after();
    }

    if (this.entityShieldPersistent.value) {
      gameManager.stateManager.before("entities.changeShieldPersistent", this.entityShieldPersistent.value);
      this.entities.forEach((entity) => {
        if (entity.shieldPersistent) {
          entity.shieldPersistent.value = EntityValueFunction(entity.shieldPersistent.value) + EntityValueFunction(this.entityShieldPersistent.value);
        } else {
          entity.shieldPersistent = this.entityShieldPersistent;
        }
        if (EntityValueFunction(entity.shieldPersistent.value) <= 0) {
          entity.shieldPersistent = undefined;
        }
      })
      gameManager.stateManager.after();
    }

    const retaliate = this.entityRetaliate.filter((action) => action.value).map((action, index) => {
      let retaliateAction = new Action(ActionType.retaliate, action.value);
      retaliateAction.subActions = action.subActions || [];
      if (this.entityRetaliateRange[index] && this.entityRetaliateRange[index].value != 1) {
        retaliateAction.subActions.unshift(this.entityRetaliateRange[index]);
      }
      return retaliateAction
    });

    if (retaliate.length > 0) {
      gameManager.stateManager.before("entities.changeRetaliate", retaliate.map((action) => '%game.action.retaliate% ' + EntityValueFunction(action.value) + (action.subActions && action.subActions[0] && action.subActions[0].type == ActionType.range && EntityValueFunction(action.subActions[0].value) > 1 ? ' %game.action.range% ' + EntityValueFunction(action.subActions[0].value) + '' : '')).join(', '));
      this.entities.forEach((entity) => {
        if (entity.retaliate) {
          retaliate.forEach((retaliateAction) => {
            const existing = entity.retaliate.find((action) => JSON.stringify(action.subActions) == JSON.stringify(retaliateAction.subActions));
            if (existing) {
              existing.value = EntityValueFunction(existing.value) + EntityValueFunction(retaliateAction.value);
            } else {
              entity.retaliate.push(retaliateAction);
            }
          })
        } else {
          entity.retaliate = retaliate;
        }

        entity.retaliate = entity.retaliate.filter((action) => EntityValueFunction(action.value) > 0);
      })

      gameManager.stateManager.after();
    }


    const retaliatePersistent = this.entityRetaliatePersistent.filter((action) => action.value).map((action, index) => {
      let retaliateAction = new Action(ActionType.retaliate, action.value);
      retaliateAction.subActions = [];
      if (this.entityRetaliateRangePersistent[index] && this.entityRetaliateRangePersistent[index].value != 1) {
        retaliateAction.subActions.push(this.entityRetaliateRangePersistent[index]);
      }
      return retaliateAction
    });

    if (retaliatePersistent.length > 0) {
      gameManager.stateManager.before("entities.changeRetaliatePersistent", retaliatePersistent.map((action) => '%game.action.retaliate% ' + EntityValueFunction(action.value) + (action.subActions && action.subActions[0] && action.subActions[0].type == ActionType.range && EntityValueFunction(action.subActions[0].value) > 1 ? ' %game.action.range% ' + EntityValueFunction(action.subActions[0].value) + '' : '')).join(', '));
      this.entities.forEach((entity) => {
        if (entity.retaliatePersistent) {
          retaliatePersistent.forEach((retaliateAction) => {
            const existing = entity.retaliatePersistent.find((action) => JSON.stringify(action.subActions) == JSON.stringify(retaliateAction.subActions));
            if (existing) {
              existing.value = EntityValueFunction(existing.value) + EntityValueFunction(retaliateAction.value);
            } else {
              entity.retaliatePersistent.push(retaliateAction);
            }
          })
        } else {
          entity.retaliatePersistent = retaliatePersistent;
        }

        entity.retaliatePersistent = entity.retaliatePersistent.filter((action) => EntityValueFunction(action.value) > 0);
      })

      gameManager.stateManager.after();
    }
  }

}