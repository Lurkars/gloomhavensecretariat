import { moveItemInArray } from '@angular/cdk/drag-drop';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { Condition, ConditionName, EntityCondition } from 'src/app/game/model/data/Condition';
import { FigureError, FigureErrorType } from 'src/app/game/model/data/FigureError';
import { MonsterStatEffect } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { ObjectiveData, ScenarioObjectiveIdentifier } from 'src/app/game/model/data/ObjectiveData';
import { MonsterStandeeData } from 'src/app/game/model/data/RoomData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { MonsterSpawnData, ScenarioRule, ScenarioRuleIdentifier } from 'src/app/game/model/data/ScenarioRule';
import { Entity, EntityValueFunction } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { Game, GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { Summon } from 'src/app/game/model/Summon';

export class ScenarioRuleEffectsManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  applyRule(rule: ScenarioRule, identifier: ScenarioRuleIdentifier, entityFilter: Entity[] | undefined = undefined) {
    const scenario = gameManager.scenarioRulesManager.getScenarioForRule(identifier).scenario;
    const section = gameManager.scenarioRulesManager.getScenarioForRule(identifier).section;
    if (scenario) {
      this.applyRuleRemoveFigures(rule);

      this.applyRuleSpawns(rule, scenario);

      this.applyRuleObjectiveSpawns(rule, scenario, section);

      this.applyRuleElements(rule);

      if (rule.figures) {
        this.applyRuleFigureEffects(rule, identifier, entityFilter);

        this.applyRuleKillLowest(rule, entityFilter);

        this.applyRuleToggleFigures(rule);

        this.applyRuleTransferFigures(rule, identifier, scenario, section);

        this.applyRuleAttackModifiers(rule);

        this.applyRuleAbilities(rule);
      }

      this.applyRuleStatEffects(rule);

      this.applyRuleRandomDungeon(rule);
    }
  }

  private applyRuleRemoveFigures(rule: ScenarioRule) {
    if (rule.figures) {
      rule.figures
        .filter((figureRule) => figureRule.type === 'remove')
        .forEach((figureRule) => {
          const figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
          figures.forEach((figure) => {
            if (figure instanceof ObjectiveContainer) {
              gameManager.objectiveManager.removeObjective(figure);
            } else if (figure instanceof Monster) {
              gameManager.monsterManager.removeMonster(figure);
            }
          });
        });
    }
  }

  private applyRuleSpawns(rule: ScenarioRule, scenario: ScenarioData) {
    if (rule.spawns) {
      const checkActive: string[] = [];
      rule.spawns.forEach((spawn) => {
        const type = this.spawnType(spawn.monster);
        if (scenario && (type === MonsterType.boss || type === MonsterType.elite)) {
          checkActive.push(...this.applySpawnRule(scenario, rule, spawn, type));
        }
      });

      rule.spawns.forEach((spawn) => {
        const type = this.spawnType(spawn.monster);
        if (scenario && type === MonsterType.normal) {
          checkActive.push(...this.applySpawnRule(scenario, rule, spawn, type));
        }
      });
    }
  }

  private applyRuleObjectiveSpawns(rule: ScenarioRule, scenario: ScenarioData, section: boolean) {
    if (rule.objectiveSpawns) {
      rule.objectiveSpawns.forEach((spawn) => {
        const objectiveIdentifier: ScenarioObjectiveIdentifier = {
          edition: scenario.edition,
          scenario: scenario.index,
          group: scenario.group,
          section: section,
          index: spawn.objective.id - 1
        };
        const objectiveData = gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(objectiveIdentifier);
        if (objectiveData && spawn.count !== 0) {
          const count = EntityValueFunction(spawn.count || 1);
          const objective = gameManager.objectiveManager.addObjective(objectiveData, objectiveData.name, objectiveIdentifier);
          if (objective) {
            if (spawn.objective.marker) {
              objective.marker = spawn.objective.marker;
            }
          }
          for (let i = 0; i < count; i++) {
            const objectiveEntity = gameManager.objectiveManager.addObjectiveEntity(objective);
            if (spawn.objective.tags) {
              objectiveEntity.tags = spawn.objective.tags;
            }
            if (objective.marker || objectiveEntity.tags.length > 0) {
              gameManager.entityCounterManager.addEntityCount(objective);
            }
          }
        }
      });
    }
  }

  private applyRuleElements(rule: ScenarioRule) {
    if (rule.elements) {
      rule.elements.forEach((ruleElement) => {
        this.game.elementBoard.forEach((element) => {
          if (ruleElement && element.type === ruleElement.type) {
            element.state = ruleElement.state;
          }
        });
      });
    }
  }

  private applyRuleFigureEffects(rule: ScenarioRule, identifier: ScenarioRuleIdentifier, entityFilter: Entity[] | undefined) {
    rule.figures
      .filter(
        (figureRule) =>
          figureRule.type === 'gainCondition' ||
          figureRule.type === 'permanentCondition' ||
          figureRule.type === 'loseCondition' ||
          figureRule.type === 'losePermanentCondition' ||
          figureRule.type === 'damage' ||
          figureRule.type === 'heal' ||
          figureRule.type === 'setHp' ||
          figureRule.type === 'dormant' ||
          figureRule.type === 'activate' ||
          figureRule.type === 'removeEntity' ||
          figureRule.type === 'toggleAfterTurnSummon'
      )
      .forEach((figureRule) => {
        const figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
        const ruleEntities: Entity[] = gameManager.scenarioRulesManager.entitiesByFigureRule(figureRule, rule);
        figures.forEach((figure) => {
          const entities: Entity[] = gameManager.entityManager
            .entitiesAll(figure)
            .filter((entity) => ruleEntities.includes(entity) && (!entityFilter || entityFilter.includes(entity)));
          entities.forEach((entity) => {
            switch (figureRule.type) {
              case 'gainCondition':
                const conditionName = figureRule.value.split(':')[0];
                const value = figureRule.value.split(':').length > 1 ? +figureRule.value.split(':')[1] : 1;
                const gainCondition = new Condition(conditionName, value);
                gameManager.conditionManager.addCondition(entity, figure, gainCondition);
                break;
              case 'permanentCondition':
                const permanentCondition = new Condition(('' + figureRule.value).split(':')[0]);
                if (!gameManager.conditionManager.hasCondition(entity, permanentCondition, true)) {
                  gameManager.conditionManager.addCondition(entity, figure, permanentCondition, true, true);
                }
                break;
              case 'loseCondition':
                const loseCondition = new Condition(('' + figureRule.value).split(':')[0]);
                if (gameManager.conditionManager.hasCondition(entity, loseCondition)) {
                  gameManager.conditionManager.removeCondition(entity, figure, loseCondition);
                }
                break;
              case 'losePermanentCondition':
                const losePermanentCondition = new Condition(('' + figureRule.value).split(':')[0]);
                if (gameManager.conditionManager.hasCondition(entity, losePermanentCondition, true)) {
                  gameManager.conditionManager.removeCondition(entity, figure, losePermanentCondition, true);
                }
                break;
              case 'damage':
                let damage = 0;
                if (isNaN(+figureRule.value) && figureRule.value.includes('H')) {
                  damage = +EntityValueFunction(
                    figureRule.value.replaceAll('HP', '' + entity.health).replaceAll('H', '' + EntityValueFunction(entity.maxHealth))
                  );
                } else {
                  damage = +EntityValueFunction(figureRule.value);
                }

                let objectiveData: ObjectiveData | undefined = undefined;
                if (figure instanceof ObjectiveContainer && figure.objectiveId) {
                  objectiveData = gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(figure.objectiveId);
                }

                if (objectiveData && objectiveData.trackDamage) {
                  damage *= -1;
                } else if (damage < 0) {
                  damage = 0;
                } else if (damage > EntityValueFunction(entity.maxHealth)) {
                  damage = EntityValueFunction(entity.maxHealth);
                }

                gameManager.entityManager.changeHealth(entity, figure, -damage, true);
                break;
              case 'heal':
                let heal = 0;
                if (isNaN(+figureRule.value) && figureRule.value.includes('H')) {
                  heal = +EntityValueFunction(
                    figureRule.value.replaceAll('HP', '' + entity.health).replaceAll('H', '' + EntityValueFunction(entity.maxHealth))
                  );
                } else {
                  heal = +EntityValueFunction(figureRule.value);
                }
                if (heal < 0) {
                  heal = 0;
                }

                entity.health += heal;
                const healCondition = new EntityCondition(ConditionName.heal, heal);
                gameManager.conditionManager.addCondition(entity, figure, healCondition);
                gameManager.conditionManager.applyCondition(entity, figure, healCondition, true);
                break;
              case 'setHp':
                let hp = 0;
                if (isNaN(+figureRule.value) && figureRule.value.includes('H')) {
                  hp = +EntityValueFunction(
                    figureRule.value.replaceAll('HP', '' + entity.health).replaceAll('H', '' + EntityValueFunction(entity.maxHealth))
                  );
                } else {
                  hp = +EntityValueFunction(figureRule.value);
                }
                if (hp < 0) {
                  hp = 0;
                } else if (hp > EntityValueFunction(entity.maxHealth)) {
                  hp = EntityValueFunction(entity.maxHealth);
                }

                entity.health = hp;
                break;
              case 'dormant':
                if (entity instanceof MonsterEntity) {
                  entity.dormant = true;
                  entity.revealed = false;
                }
                break;
              case 'activate':
                if (entity instanceof MonsterEntity) {
                  entity.dormant = false;
                }
                break;
              case 'removeEntity':
                entity.tags.push('ignore-kill');
                if (entity instanceof Character) {
                  gameManager.characterManager.removeCharacter(entity);
                } else if (figure instanceof Monster && entity instanceof MonsterEntity) {
                  gameManager.monsterManager.removeMonsterEntity(figure, entity);
                } else if (figure instanceof ObjectiveContainer && entity instanceof ObjectiveEntity) {
                  gameManager.objectiveManager.removeObjectiveEntity(figure, entity);
                }
                if (figureRule.identifier) {
                  gameManager.entityCounterManager.entityCounters(figureRule.identifier).forEach((entityCounter) => {
                    entityCounter.total -= 1;
                  });
                }
                break;
              case 'toggleAfterTurnSummon':
                if (entity instanceof Summon) {
                  entity.afterTurn = !entity.afterTurn;
                }
                break;
            }
          });
        });
      });
  }

  private applyRuleKillLowest(rule: ScenarioRule, entityFilter: Entity[] | undefined) {
    rule.figures
      .filter((figureRule) => figureRule.type === 'killLowest')
      .forEach((figureRule) => {
        const count = EntityValueFunction(figureRule.value || '1');
        const allPairs: { entity: Entity; figure: Figure }[] = [];
        const figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
        figures.forEach((figure) => {
          gameManager.entityManager
            .entitiesAll(figure)
            .filter((entity) => gameManager.entityManager.isAlive(entity) && (!entityFilter || entityFilter.includes(entity)))
            .forEach((entity) => allPairs.push({ entity, figure }));
        });
        allPairs.sort((a, b) => {
          if (a.entity.health == b.entity.health) {
            if (a.entity instanceof MonsterEntity && b.entity instanceof MonsterEntity && a.entity.type !== b.entity.type) {
              return a.entity.type === MonsterType.elite ? -1 : 1;
            }
            return a.entity.number - b.entity.number;
          }
          return a.entity.health - b.entity.health;
        });
        allPairs.slice(0, count).forEach(({ entity, figure }) => {
          gameManager.entityManager.changeHealth(entity, figure, -entity.health, true);
        });
      });
  }

  private applyRuleToggleFigures(rule: ScenarioRule) {
    rule.figures
      .filter((figureRule) => figureRule.type === 'toggleOff' || figureRule.type === 'toggleOn')
      .forEach((figureRule) => {
        const figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
        figures.forEach((figure) => {
          figure.off = figureRule.type === 'toggleOff';
          if (figure instanceof Monster) {
            figure.entities.forEach((entity) => {
              entity.dormant = figureRule.type === 'toggleOff';
            });
          }
        });
      });
  }

  private applyRuleTransferFigures(rule: ScenarioRule, identifier: ScenarioRuleIdentifier, scenario: ScenarioData, section: boolean) {
    rule.figures
      .filter((figureRule) => figureRule.type === 'transfer' || figureRule.type === 'transferEntities')
      .forEach((figureRule) => {
        const figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
        const entities: Entity[] = gameManager.scenarioRulesManager.entitiesByFigureRule(figureRule, rule);
        if (figures.length === 1 && figures[0] instanceof Monster) {
          const figure = figures[0];
          const monster = gameManager.monsterManager.addMonsterByName(figureRule.value, scenario.edition);
          if (monster) {
            if (figureRule.type === 'transfer') {
              if (!figureRule.value.includes(':')) {
                monster.level = figure.level;
              }
              monster.active = figure.active;
              monster.drawExtra = figure.drawExtra;
              monster.lastDraw = figure.lastDraw;
              monster.ability = figure.ability;
              monster.isAlly = figure.isAlly;
              monster.isAllied = figure.isAllied;
              if (figureRule.identifier) {
                gameManager.entityCounterManager.entityCounters(figureRule.identifier).forEach((entityCounter) => {
                  entityCounter.total -= figure.entities.length;
                });
              }
              monster.entities = [...monster.entities, ...figure.entities];
              figure.entities.forEach((entity) => {
                gameManager.entityCounterManager.addEntityCount(monster, entity);
              });
            } else {
              if (figureRule.identifier) {
                gameManager.entityCounterManager.entityCounters(figureRule.identifier).forEach((entityCounter) => {
                  entityCounter.total -= entities.length;
                });
              }
              monster.entities = [
                ...monster.entities,
                ...entities.filter((entity) => entity instanceof MonsterEntity).map((entity) => entity as MonsterEntity)
              ];
              entities.forEach((entity) => {
                gameManager.entityCounterManager.addEntityCount(monster, entity);
              });
            }

            monster.entities.forEach((entity) => {
              const figureStat = figure.stats.find((stat) => {
                return stat.level === figure.level && stat.type === entity.type;
              });
              const stat = monster.stats.find((stat) => {
                return stat.level === monster.level && stat.type === entity.type;
              });

              if (!stat) {
                monster.errors = monster.errors || [];
                if (
                  !monster.errors.find((figureError) => figureError.type === FigureErrorType.unknown) &&
                  !monster.errors.find((figureError) => figureError.type === FigureErrorType.stat)
                ) {
                  console.error("Could not find '" + entity.type + "' stats for monster: " + monster.name + ' level: ' + monster.level);
                  monster.errors.push(
                    new FigureError(FigureErrorType.stat, 'monster', monster.name, monster.edition, entity.type, '' + monster.level)
                  );
                }
              } else {
                entity.stat = stat;
                if (figureStat && entity.maxHealth === EntityValueFunction(figureStat.health)) {
                  entity.maxHealth = EntityValueFunction(stat.health);
                }
              }

              if (entity.health > entity.maxHealth || (entity.maxHealth === 0 && entity.health > 0)) {
                entity.health = entity.maxHealth;
              }
            });

            if (monster !== figure) {
              if (figureRule.type === 'transfer') {
                gameManager.monsterManager.removeMonster(figure);
              } else {
                figure.entities = figure.entities.filter((entity) => !entities.includes(entity));
              }
            }

            if (entities.length) {
              monster.off = gameManager.monsterManager.monsterEntityCount(monster) === 0;
              figure.off = gameManager.monsterManager.monsterEntityCount(figure) === 0;
              if (this.game.state === GameState.next && monster.ability === -1) {
                if (!gameManager.monsterAbilityManager.applySameDeck(monster)) {
                  gameManager.monsterAbilityManager.drawAbility(monster);
                }
              }
              gameManager.roundManager.sortFigures(monster);
            }
          }
        } else if (figures.length === 1 && figures[0] instanceof ObjectiveContainer) {
          const figure = figures[0];
          const objectiveIdentifier: ScenarioObjectiveIdentifier = {
            edition: scenario.edition,
            scenario: scenario.index,
            group: scenario.group,
            section: section,
            index: +figureRule.value - 1
          };

          const objectiveData = scenario.objectives[+figureRule.value - 1];
          const objectiveContainer = gameManager.objectiveManager.addObjective(objectiveData, undefined, objectiveIdentifier);

          objectiveContainer.entities = figure.entities;

          objectiveContainer.entities.forEach((entity) => {
            entity.maxHealth = EntityValueFunction(figure.health);
            if (entity.health > entity.maxHealth) {
              entity.health = entity.maxHealth;
            }
            if (objectiveData) {
              if (objectiveData.tags) {
                entity.tags = objectiveData.tags;
              }
              if (objectiveData.marker) {
                entity.marker = objectiveData.marker;
              }
            }
          });

          gameManager.objectiveManager.removeObjective(figure);
        }
      });
  }

  private applyRuleAttackModifiers(rule: ScenarioRule) {
    rule.figures
      .filter((figureRule) => figureRule.type === 'amAdd' || figureRule.type === 'amRemove')
      .forEach((figureRule) => {
        const figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
        figures.forEach((figure) => {
          const deck = gameManager.attackModifierManager.byFigure(figure);
          const type: AttackModifierType = figureRule.value.split(':')[0] as AttackModifierType;
          let value = +figureRule.value.split(':')[1];
          if (figureRule.type === 'amAdd') {
            for (let i = 0; i < value; i++) {
              gameManager.attackModifierManager.addModifierByType(deck, type);
            }
          } else {
            let card = deck.cards.find((attackModifier, index) => {
              return attackModifier.type === type && index > deck.current;
            });
            while (card && value > 0) {
              deck.cards.splice(deck.cards.indexOf(card), 1);
              card = deck.cards.find((attackModifier, index) => {
                return attackModifier.type === type && index > deck.current;
              });
              value--;
            }
            if (value > 0) {
              let card = deck.cards.find((attackModifier) => {
                return attackModifier.type === type;
              });
              while (card && value > 0) {
                const cardIndex = deck.cards.indexOf(card);
                deck.cards.splice(cardIndex, 1);
                if (cardIndex <= deck.current) {
                  deck.current--;
                  if (deck.lastVisible > deck.current) {
                    deck.lastVisible = Math.max(deck.current, 0);
                  }
                }
                card = deck.cards.find((attackModifier) => {
                  return attackModifier.type === type;
                });
                value--;
              }
            }
          }
        });
      });
  }

  private applyRuleAbilities(rule: ScenarioRule) {
    rule.figures
      .filter(
        (figureRule) =>
          figureRule.type === 'setAbility' ||
          figureRule.type === 'drawAbility' ||
          figureRule.type === 'shuffleAbilities' ||
          figureRule.type === 'discardAbilityToBottom' ||
          figureRule.type === 'removeAbility'
      )
      .forEach((figureRule) => {
        const figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
        figures.forEach((figure) => {
          if (figure instanceof Monster) {
            if (figureRule.type === 'setAbility' || figureRule.type === 'removeAbility') {
              const abilityCard = gameManager.editionManager
                .abilityCards(figure)
                .find((abilityCard) =>
                  isNaN(+figureRule.value) ? abilityCard.name === figureRule.value : abilityCard.cardId === +figureRule.value
                );
              if (abilityCard) {
                const index = gameManager.editionManager.abilityCards(figure).indexOf(abilityCard);
                if (index !== -1) {
                  figure.abilities = figure.abilities.filter((number) => number !== index);
                  if (figureRule.type === 'setAbility') {
                    figure.abilities.unshift(index);
                    figure.ability = this.game.state === GameState.draw ? -1 : 0;
                  }
                }
              }
            } else if (figureRule.type === 'drawAbility') {
              gameManager.monsterAbilityManager.drawAbility(figure);
            } else if (figureRule.type === 'shuffleAbilities') {
              gameManager.monsterAbilityManager.shuffleAbilities(figure);
            } else if (figureRule.type === 'discardAbilityToBottom') {
              moveItemInArray(figure.abilities, figure.ability, 0);
            }
          }
        });
      });
  }

  private applyRuleStatEffects(rule: ScenarioRule) {
    if (rule.statEffects) {
      rule.statEffects.forEach((statEffectRule) => {
        const figures: Figure[] = gameManager.entityManager.figuresByIdentifier(statEffectRule.identifier);
        let referenceValue: number = 0;
        if (statEffectRule.reference && (statEffectRule.reference.type === 'present' || statEffectRule.reference.type === 'killed')) {
          const referenceCount = gameManager.scenarioRulesManager.presentEntitiesByFigureRule(statEffectRule.reference, rule).length;
          const offset: number = statEffectRule.reference.value ? EntityValueFunction(statEffectRule.reference.value.split(':')[0]) : 0;
          referenceValue = statEffectRule.reference.type === 'present' ? referenceCount + offset : offset - referenceCount;
        }

        figures.forEach((figure) => {
          if (figure instanceof Monster) {
            const statEffect = new MonsterStatEffect();

            statEffect.name = statEffectRule.statEffect.name;

            if (statEffectRule.statEffect.health) {
              statEffect.health = ('' + statEffectRule.statEffect.health).replaceAll('X', '' + referenceValue);
            }
            if (statEffectRule.statEffect.movement) {
              statEffect.movement = ('' + statEffectRule.statEffect.movement).replaceAll('X', '' + referenceValue);
            }
            if (statEffectRule.statEffect.attack) {
              statEffect.attack = ('' + statEffectRule.statEffect.attack).replaceAll('X', '' + referenceValue);
            }
            if (statEffectRule.statEffect.range) {
              statEffect.range = ('' + statEffectRule.statEffect.range).replaceAll('X', '' + referenceValue);
            }

            statEffect.initiative = statEffectRule.statEffect.initiative;
            statEffect.flying = statEffectRule.statEffect.flying;
            statEffect.actions = statEffectRule.statEffect.actions;
            statEffect.special = statEffectRule.statEffect.special;
            statEffect.immunities = statEffectRule.statEffect.immunities;
            statEffect.deck = statEffectRule.statEffect.deck;
            statEffect.absolute = statEffectRule.statEffect.absolute || false;

            statEffect.note = statEffectRule.note;

            if (
              statEffect.absolute ||
              statEffect.name ||
              statEffect.health ||
              statEffect.movement ||
              statEffect.attack ||
              statEffect.range ||
              statEffect.initiative ||
              (statEffect.actions && statEffect.actions.length) ||
              (statEffect.immunities && statEffect.immunities.length) ||
              statEffect.deck ||
              statEffect.name ||
              statEffect.flying !== undefined
            ) {
              if (!!figure.statEffect && figure.statEffect.name && !statEffect.name) {
                statEffect.name = figure.statEffect.name;
              }
              figure.statEffect = statEffect;
            } else {
              figure.statEffect = undefined;
            }

            if (figure.statEffect && figure.statEffect.initiative) {
              gameManager.roundManager.sortFigures();
            }
          }
        });
      });
    }
  }

  private applyRuleRandomDungeon(rule: ScenarioRule) {
    if (rule.randomDungeon && rule.randomDungeon.monsterCount && this.game.scenario) {
      const shuffledSections = gameManager.randomManager.shuffle(
        gameManager.editionManager
          .sectionData(this.game.scenario.edition, true)
          .filter(
            (sectionData) =>
              sectionData.group === 'randomMonsterCard' &&
              rule.randomDungeon &&
              (!rule.randomDungeon.monsterCards || rule.randomDungeon.monsterCards.includes(sectionData.index)) &&
              (!this.game.scenario ||
                !this.game.scenario.additionalSections ||
                !this.game.scenario.additionalSections.includes(sectionData.index))
          )
      );
      if (shuffledSections.length >= rule.randomDungeon.monsterCount) {
        this.game.scenario.additionalSections = this.game.scenario.additionalSections || [];
        this.game.scenario.additionalSections.push(
          ...shuffledSections.slice(0, rule.randomDungeon.monsterCount).map((sectionData) => sectionData.index)
        );
        if (rule.randomDungeon.initial) {
          gameManager.scenarioManager.addSection(shuffledSections[0]);
        }
      }
    }
  }

  spawns(rule: ScenarioRule): MonsterSpawnData[] {
    return (rule.spawns && rule.spawns.filter((spawn) => this.spawnType(spawn.monster))) || [];
  }

  spawnType(monsterStandeeData: MonsterStandeeData): MonsterType | undefined {
    let type: MonsterType | undefined = monsterStandeeData.type;

    if (!type) {
      const charCount = gameManager.levelManager.characterCountVariable();
      if (charCount < 3) {
        type = monsterStandeeData.player2;
      } else if (charCount === 3) {
        type = monsterStandeeData.player3;
      } else {
        type = monsterStandeeData.player4;
      }
    }

    return type;
  }

  spawnCount(rule: ScenarioRule, spawn: MonsterSpawnData): number {
    let count = spawn.count;
    let F = 0;
    if (count && rule.figures) {
      const figureRule = rule.figures.find((figureRule) => figureRule.type === 'present' || figureRule.type === 'dead');
      if (figureRule) {
        const gameplayEntities: Entity[] = gameManager.scenarioRulesManager
          .entitiesByFigureRule(figureRule, rule)
          .filter(
            (entity) =>
              gameManager.entityManager.isAlive(entity) &&
              (!(entity instanceof MonsterEntity) ||
                !figureRule.identifier?.marker ||
                (entity instanceof MonsterEntity && entity.marker === figureRule.identifier?.marker))
          );
        const max: number =
          figureRule.value && figureRule.value.split(':').length > 1 ? EntityValueFunction(figureRule.value.split(':')[1]) : 0;
        F = figureRule.type === 'present' ? gameplayEntities.length : Math.max(0, max - gameplayEntities.length);
      }
    }

    while (typeof count === 'string' && count.includes('F')) {
      count = count.replace('F', '' + F);
    }

    return EntityValueFunction(count || (spawn.manual ? 0 : 1));
  }

  applySpawnRule(scenario: ScenarioData, rule: ScenarioRule, spawn: MonsterSpawnData, type: MonsterType): string[] {
    const monster = gameManager.monsterManager.addMonsterByName(spawn.monster.name, scenario.edition);
    const checkActive: string[] = [];
    if (monster) {
      for (let i = 0; i < this.spawnCount(rule, spawn); i++) {
        const entity = gameManager.monsterManager.spawnMonsterEntity(
          monster,
          type,
          scenario.allies && scenario.allies.includes(spawn.monster.name),
          scenario.allied && scenario.allied.includes(spawn.monster.name),
          scenario.drawExtra && scenario.drawExtra.includes(spawn.monster.name),
          spawn.summon
        );
        if (entity) {
          if (spawn.monster.marker) {
            entity.marker = spawn.monster.marker;
          }
          if (spawn.monster.tags) {
            entity.tags = spawn.monster.tags;
          }
          checkActive.push(spawn.monster.name);
          if (entity.marker || entity.tags.length > 0) {
            gameManager.entityCounterManager.addEntityCount(monster, entity);
          }
        }
      }
    }
    return checkActive;
  }
}
