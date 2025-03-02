import { Character } from "../model/Character";
import { Entity, EntityValueFunction } from "../model/Entity";
import { Figure } from "../model/Figure";
import { GameState } from "../model/Game";
import { Monster } from "../model/Monster";
import { MonsterEntity } from "../model/MonsterEntity";
import { ObjectiveContainer } from "../model/ObjectiveContainer";
import { ObjectiveEntity } from "../model/ObjectiveEntity";
import { Summon } from "../model/Summon";
import { Action, ActionHint, ActionType, ActionValueType } from "../model/data/Action";
import { AttackModifier, AttackModifierType } from "../model/data/AttackModifier";
import { Condition, ConditionName } from "../model/data/Condition";
import { Element, ElementModel, ElementState } from "../model/data/Element";
import { MonsterType } from "../model/data/MonsterType";
import { MonsterSpawnData, ObjectiveSpawnData } from "../model/data/ScenarioRule";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export type InteractiveAction = { action: Action, index: string };

export class ActionsManager {

    getValues(action: Action): string[] {
        if (action.value && typeof action.value === "string") {
            return action.value.split(':');
        }
        return [];
    }

    calcActionHints(figure: Figure, entity: Entity): ActionHint[] {
        let actionHints: ActionHint[] = [];

        if (figure instanceof Monster && entity instanceof MonsterEntity) {
            actionHints.push(...this.calcMonsterActionHints(figure, entity));
        }

        if (entity instanceof Summon) {
            if (entity.action && entity.action.type == ActionType.shield) {
                const existingShield = actionHints.find((actionHint) => actionHint.type == ActionType.shield);
                if (existingShield) {
                    existingShield.value += EntityValueFunction(entity.action.value);
                } else {
                    actionHints.push(new ActionHint(ActionType.shield, EntityValueFunction(entity.action.value)));
                }
            }
            if (entity.additionalAction && entity.additionalAction.type == ActionType.shield) {
                const existingShield = actionHints.find((actionHint) => actionHint.type == ActionType.shield);
                if (existingShield) {
                    existingShield.value += EntityValueFunction(entity.additionalAction.value);
                } else {
                    actionHints.push(new ActionHint(ActionType.shield, EntityValueFunction(entity.additionalAction.value)));
                }
            }
            if (entity.action && entity.action.type == ActionType.retaliate) {
                let rangeSubAction = entity.action.subActions && entity.action.subActions.find((subAction) => subAction.type == ActionType.range);
                const existingRetaliate = actionHints.find((actionHint) => {
                    if (!rangeSubAction || EntityValueFunction(rangeSubAction.value) == 1 && (!actionHint.range || actionHint.range == 1)) {
                        return actionHint.type == ActionType.retaliate;
                    } else {
                        return actionHint.type == ActionType.retaliate && actionHint.range == EntityValueFunction(rangeSubAction.value);
                    }
                });
                if (existingRetaliate) {
                    existingRetaliate.value += EntityValueFunction(entity.action.value);
                } else {
                    actionHints.push(new ActionHint(ActionType.retaliate, EntityValueFunction(entity.action.value), rangeSubAction ? EntityValueFunction(rangeSubAction.value) : 0));
                }
            }
            if (entity.additionalAction && entity.additionalAction.type == ActionType.retaliate) {
                let rangeSubAction = entity.additionalAction.subActions && entity.additionalAction.subActions.find((subAction) => subAction.type == ActionType.range);
                const existingRetaliate = actionHints.find((actionHint) => {
                    if (!rangeSubAction || EntityValueFunction(rangeSubAction.value) == 1 && (!actionHint.range || actionHint.range == 1)) {
                        return actionHint.type == ActionType.retaliate;
                    } else {
                        return actionHint.type == ActionType.retaliate && actionHint.range == EntityValueFunction(rangeSubAction.value);
                    }
                });
                if (existingRetaliate) {
                    existingRetaliate.value += EntityValueFunction(entity.additionalAction.value);
                } else {
                    actionHints.push(new ActionHint(ActionType.retaliate, EntityValueFunction(entity.additionalAction.value), rangeSubAction ? EntityValueFunction(rangeSubAction.value) : 0));
                }
            }
        }

        if (entity.shield) {
            const existingShield = actionHints.find((actionHint) => actionHint.type == ActionType.shield);
            if (existingShield) {
                existingShield.value += EntityValueFunction(entity.shield.value);
            } else {
                actionHints.push(new ActionHint(ActionType.shield, EntityValueFunction(entity.shield.value)));
            }
        }

        if (entity.shieldPersistent) {
            const existingShield = actionHints.find((actionHint) => actionHint.type == ActionType.shield);
            if (existingShield) {
                existingShield.value += EntityValueFunction(entity.shieldPersistent.value);
            } else {
                actionHints.push(new ActionHint(ActionType.shield, EntityValueFunction(entity.shieldPersistent.value)));
            }
        }

        if (entity.retaliate) {
            entity.retaliate.forEach((action) => {
                let rangeSubAction = action.subActions.find((subAction) => subAction.type == ActionType.range);
                const existingRetaliate = actionHints.find((actionHint) => {
                    if (!rangeSubAction || EntityValueFunction(rangeSubAction.value) == 1 && (!actionHint.range || actionHint.range == 1)) {
                        return actionHint.type == ActionType.retaliate;
                    } else {
                        return actionHint.type == ActionType.retaliate && actionHint.range == EntityValueFunction(rangeSubAction.value);
                    }
                });
                if (existingRetaliate) {
                    existingRetaliate.value += EntityValueFunction(action.value);
                } else {
                    actionHints.push(new ActionHint(ActionType.retaliate, EntityValueFunction(action.value), rangeSubAction ? EntityValueFunction(rangeSubAction.value) : 0));
                }
            })
        }

        if (entity.retaliatePersistent) {
            entity.retaliatePersistent.forEach((action) => {
                let rangeSubAction = action.subActions.find((subAction) => subAction.type == ActionType.range);
                const existingRetaliate = actionHints.find((actionHint) => {
                    if (!rangeSubAction || EntityValueFunction(rangeSubAction.value) == 1 && (!actionHint.range || actionHint.range == 1)) {
                        return actionHint.type == ActionType.retaliate;
                    } else {
                        return actionHint.type == ActionType.retaliate && actionHint.range == EntityValueFunction(rangeSubAction.value);
                    }
                });
                if (existingRetaliate) {
                    existingRetaliate.value += EntityValueFunction(action.value);
                } else {
                    actionHints.push(new ActionHint(ActionType.retaliate, EntityValueFunction(action.value), rangeSubAction ? EntityValueFunction(rangeSubAction.value) : 0));
                }
            })
        }

        return actionHints.sort((a, b) => {
            if (a.type == ActionType.shield && b.type != ActionType.shield) {
                return -1;
            } else if (b.type == ActionType.shield && a.type != ActionType.shield) {
                return 1;
            }
            return a.range - b.range;
        });
    }

    calcMonsterActionHints(monster: Monster, entity: MonsterEntity): ActionHint[] {
        let actionHints: ActionHint[] = [];
        const stat = gameManager.monsterManager.getStat(monster, entity.type);
        this.calcMonsterActionHint(monster, entity.type, ActionType.shield, stat.actions, actionHints);
        this.calcMonsterActionHint(monster, entity.type, ActionType.retaliate, stat.actions, actionHints);
        if (gameManager.entityManager.isAlive(entity, true) && (!entity.active || monster.active)) {
            const activeFigure = gameManager.game.figures.find((figure) => figure.active);
            if (monster.active || gameManager.game.state == GameState.next && (!activeFigure || gameManager.game.figures.indexOf(activeFigure) > gameManager.game.figures.indexOf(monster))) {
                let ability = gameManager.monsterManager.getAbility(monster);
                if (ability) {
                    this.calcMonsterActionHint(monster, entity.type, ActionType.shield, ability.actions, actionHints);
                    this.calcMonsterActionHint(monster, entity.type, ActionType.retaliate, ability.actions, actionHints);

                    if (ability.bottomActions) {
                        this.calcMonsterActionHint(monster, entity.type, ActionType.shield, ability.bottomActions, actionHints, 'bottom');
                        this.calcMonsterActionHint(monster, entity.type, ActionType.retaliate, ability.bottomActions, actionHints, 'bottom');
                    }
                }
            }
        }

        return actionHints;
    }

    calcMonsterActionHint(monster: Monster, monsterType: MonsterType, type: ActionType, actions: Action[], actionHints: ActionHint[], parentIndex: string = "") {
        actions.forEach((action, i) => {
            const index = (parentIndex ? parentIndex + '-' : '') + i;
            if (action.type == type && action.value != 'X') {
                let actionHint: ActionHint = new ActionHint(type, EntityValueFunction(action.value));
                if (action.subActions && action.subActions.length > 0) {
                    let rangeSubAction = action.subActions.find((subAction) => subAction.type == ActionType.range);
                    if (rangeSubAction) {
                        if (!rangeSubAction.valueType || rangeSubAction.valueType == ActionValueType.fixed) {
                            actionHint.range = EntityValueFunction(rangeSubAction.value);
                        } else {
                            const stats = gameManager.monsterManager.getStat(monster, monsterType);
                            if (stats && rangeSubAction.valueType == ActionValueType.plus) {
                                actionHint.range = EntityValueFunction(stats.range) + EntityValueFunction(rangeSubAction.value);
                            } else if (stats && rangeSubAction.valueType == ActionValueType.minus) {
                                actionHint.range = EntityValueFunction(stats.range) - EntityValueFunction(rangeSubAction.value);
                            } else if (rangeSubAction.valueType == ActionValueType.add || rangeSubAction.valueType == ActionValueType.subtract) {
                                actionHint.additionalRange = rangeSubAction.valueType == ActionValueType.add ? "add" : "substract";
                                actionHint.range = EntityValueFunction(rangeSubAction.value);
                            }
                        }
                    }
                }

                let existingActionHint = actionHints.find((existing) => existing.type == actionHint.type && (!actionHint.additionalRange && existing.range == actionHint.range || existing.range && actionHint.additionalRange));

                if (existingActionHint) {
                    if (existingActionHint.range && actionHint.additionalRange) {
                        if (actionHint.additionalRange == "add") {
                            existingActionHint.range += actionHint.range;
                        } else {
                            existingActionHint.range -= actionHint.range;
                        }
                    }
                    existingActionHint.value += actionHint.value;
                } else {
                    actionHints.push(actionHint)
                }
            } else if (action.type == ActionType.monsterType && action.value == monsterType || action.type == ActionType.concatenation || action.type == ActionType.grid) {
                this.calcMonsterActionHint(monster, monsterType, type, action.subActions, actionHints, index);
            } else if (action.type == ActionType.element && action.valueType == ActionValueType.minus && monster.entities.find((monsterEntity) => monsterEntity.tags.find((tag) => tag == this.roundTag(action, index)))) {
                this.calcMonsterActionHint(monster, monsterType, type, action.subActions, actionHints, index);
            } else if (action.type == ActionType.special) {
                const stats = monster.stats.find((stat) => stat.level == monster.level && stat.type == monsterType);
                if (stats) {
                    this.calcMonsterActionHint(monster, monsterType, type, stats.special[EntityValueFunction(action.value) - 1], actionHints, index);
                }
            }
        })
    }

    roundTag(action: Action, index: string): string {
        return 'roundAction-' + (index ? index + '-' : '') + action.type;
    }

    isInteractiveAction(action: Action): boolean {
        const selfSubAction = action.subActions && action.subActions.find((subAction) => subAction.type == ActionType.specialTarget && ('' + subAction.value).startsWith('self'));
        const hasSelfSubAction = selfSubAction != undefined;
        switch (action.type) {
            case ActionType.heal:
                return hasSelfSubAction && action.subActions.every((subAction) => subAction == selfSubAction || subAction.type == ActionType.condition);
            case ActionType.condition:
                return hasSelfSubAction && action.subActions.length == 1;
            case ActionType.sufferDamage:
                return !action.subActions || action.subActions.length == 0 || hasSelfSubAction && action.subActions.length == 1;
            case ActionType.switchType:
            case ActionType.element:
                return true;
            case ActionType.spawn:
            case ActionType.summon:
                return this.getMonsterSpawnData(action).length > 0 || this.getObjectiveSpawnData(action).length > 0;
        }

        return false;
    }

    isInteractiveApplicableAction(entity: Entity, action: Action, index: string): boolean {
        if (!this.isInteractiveAction(action) || !gameManager.entityManager.isAlive(entity, true) || entity.tags.indexOf(this.roundTag(action, index)) != -1) {
            return false;
        }

        switch (action.type) {
            case ActionType.heal:
                return entity.health > 0 && entity.health < EntityValueFunction(entity.maxHealth);
            case ActionType.condition:
                return !gameManager.entityManager.hasCondition(entity, new Condition('' + action.value));
            case ActionType.switchType:
                return entity instanceof MonsterEntity && (entity.type == MonsterType.elite || entity.type == MonsterType.normal);
            case ActionType.element:
                const values = this.getValues(action);
                if (!action.valueType || action.valueType == ActionValueType.plus || action.valueType == ActionValueType.fixed) {
                    return gameManager.game.elementBoard.some((element) => (action.value == Element.wild || values.indexOf(element.type) != -1) && (element.state == ElementState.inert || element.state == ElementState.waning || element.state == ElementState.consumed));
                } else if (action.valueType == ActionValueType.minus) {
                    let elements = this.getElementsToConsume(action);
                    if (elements.length == values.length) {
                        return !action.subActions || action.subActions.every((subAction) => !this.isInteractiveAction(subAction)) || action.subActions.some((subAction, i) => this.isInteractiveApplicableAction(entity, subAction, (index ? index + '-' : '') + i));
                    }
                }
                return false;
            case ActionType.sufferDamage:
            case ActionType.spawn:
            case ActionType.summon:
                return true;
        }

        return false;
    }

    getInteractiveActions(entity: Entity, figure: Figure, actions: Action[], preIndex: string): InteractiveAction[] {
        let result: InteractiveAction[] = [];
        if (!gameManager.entityManager.isAlive(entity, true)) {
            return [];
        }

        actions.forEach((action, i) => {
            const index = (preIndex ? preIndex + '-' : '') + i;
            const tag = this.roundTag(action, index);
            const hasTag = entity.tags.indexOf(tag) != -1;
            if (this.isInteractiveApplicableAction(entity, action, index) && !hasTag) {
                result.push({ action: action, index: index });
            }

            if (action.subActions && (action.type != ActionType.monsterType && !this.isInteractiveAction(action) || hasTag || this.subactionElement(action, entity, index) || this.subactionsMonsterType(action, entity))) {
                result.push(...this.getInteractiveActions(entity, figure, action.subActions, index));
            }

            if (action.type == ActionType.special && entity instanceof MonsterEntity && figure instanceof Monster) {
                const stats = figure.stats.find((stat) => stat.level == figure.level && stat.type == entity.type);
                if (stats) {
                    result.push(...this.getInteractiveActions(entity, figure, stats.special[EntityValueFunction(action.value) - 1], index));
                }
            }
        })

        return result;
    }

    getAllInteractiveActions(figure: Figure, actions: Action[], preIndex: string): InteractiveAction[] {
        let interactiveActions: InteractiveAction[] = [];
        if (figure instanceof Monster || figure instanceof ObjectiveContainer) {
            figure.entities.forEach((entity) => {
                gameManager.actionsManager.getInteractiveActions(entity, figure, actions, preIndex).forEach((interactiveAction) => {
                    if (interactiveActions.find((other) => other.index == interactiveAction.index) == undefined) {
                        interactiveActions.push(interactiveAction);
                    }
                })
            })
        }
        return interactiveActions;
    }

    subactionElement(action: Action, entity: Entity, index: string): boolean {
        return action.type == ActionType.element && (action.valueType != ActionValueType.minus || this.isInteractiveApplicableAction(entity, action, index));
    }

    subactionsMonsterType(action: Action, entity: Entity): boolean {
        return action.type == ActionType.monsterType && entity instanceof MonsterEntity && entity.type == (action.value as MonsterType);
    }

    applyInteractiveAction(entity: Entity, figure: Figure, interactiveAction: InteractiveAction, additionalValues: string[] = [], force: boolean = false) {
        const action = interactiveAction.action;
        const index = interactiveAction.index;
        if (!this.isInteractiveApplicableAction(entity, action, index) && !force) {
            return;
        }

        const tag = this.roundTag(action, index);
        if (entity.tags.indexOf(tag) != -1) {
            return;
        }

        switch (action.type) {
            case ActionType.heal:
                const heal = EntityValueFunction(action.value, figure.level);
                entity.health += heal;
                gameManager.entityManager.addCondition(entity, figure, new Condition(ConditionName.heal, heal));
                if (action.subActions) {
                    action.subActions.filter((subAction) => subAction.type == ActionType.condition).forEach((subAction) => {
                        gameManager.entityManager.addCondition(entity, figure, new Condition('' + subAction.value));
                    })
                }
                gameManager.entityManager.applyCondition(entity, figure, ConditionName.heal, true);
                break;
            case ActionType.condition:
                if (action.value == 'bless' || action.value == 'curse') {
                    const am = figure instanceof Monster ? (settingsManager.settings.allyAttackModifierDeck && (gameManager.fhRules() || settingsManager.settings.alwaysAllyAttackModifierDeck) && (figure.isAlly || figure.isAllied) ? gameManager.game.allyAttackModifierDeck : gameManager.game.monsterAttackModifierDeck) : (figure instanceof Character ? figure.attackModifierDeck : undefined);
                    if (am) {
                        gameManager.attackModifierManager.addModifier(am, new AttackModifier(action.value == 'bless' ? AttackModifierType.bless : AttackModifierType.curse));
                    }
                } else {
                    gameManager.entityManager.addCondition(entity, figure, new Condition('' + action.value));
                }
                break;
            case ActionType.sufferDamage:
                entity.health -= EntityValueFunction(action.value, figure.level);
                if (entity.health <= 0) {
                    entity.health = 0;
                }
                if (figure instanceof Monster && entity instanceof MonsterEntity && entity.health == 0) {
                    entity.dead = true;
                } else if (figure instanceof ObjectiveContainer && entity instanceof ObjectiveEntity && entity.health == 0) {
                    entity.dead = true;
                }
                break;
            case ActionType.switchType:
                if (figure instanceof Monster && entity instanceof MonsterEntity) {
                    const normalStat = figure.stats.find((stat) => stat.level == figure.level && stat.type == MonsterType.normal);
                    const eliteStat = figure.stats.find((stat) => stat.level == figure.level && stat.type == MonsterType.elite);
                    if (normalStat && eliteStat) {
                        entity.type = entity.type == MonsterType.elite ? MonsterType.normal : MonsterType.elite;
                        entity.maxHealth = EntityValueFunction(entity.type == MonsterType.normal ? normalStat.health : eliteStat.health, figure.level)
                        if (entity.health > entity.maxHealth) {
                            entity.health = entity.maxHealth;
                        } else if (entity.health < entity.maxHealth && entity.health == EntityValueFunction(entity.type == MonsterType.normal ? eliteStat.health : normalStat.health, entity.level)) {
                            entity.health = entity.maxHealth;
                        }
                    }
                }
                break;
            case ActionType.element:
                if (figure instanceof Monster) {
                    // interactive element action only apply once per monster
                    figure.entities.forEach((monsterEntity) => {
                        if (monsterEntity != entity) {
                            monsterEntity.tags.push(tag);
                        }
                    })
                }
                if (action.valueType == ActionValueType.minus) {
                    let elements: Element[] = this.getValues(action).map((value) => value as Element);
                    let toConsume: Element[] = this.getElementsToConsume(action).map((value) => value.type);
                    elements = elements.map((value) => {
                        if (value == Element.wild) {
                            return additionalValues.shift() || toConsume.shift();
                        }
                        toConsume.shift();
                        return value;
                    }).map((value) => value as Element);
                    elements.forEach((element) => {
                        gameManager.game.elementBoard.forEach((elementModel) => {
                            if (elementModel.type == element && (elementModel.state == ElementState.strong || elementModel.state == ElementState.waning)) {
                                elementModel.state = ElementState.partlyConsumed;
                                if (figure instanceof Monster && entity instanceof MonsterEntity) {
                                    const entities = figure.entities.filter((entity) => this.isInteractiveApplicableAction(entity, action, index));
                                    if (entities.length && entities.indexOf(entity) == entities.length - 1) {
                                        elementModel.state = ElementState.consumed;
                                    }
                                } else if (figure instanceof ObjectiveContainer && entity instanceof ObjectiveEntity) {
                                    const entities = figure.entities.filter((entity) => this.isInteractiveApplicableAction(entity, action, index));
                                    if (entities.length && entities.indexOf(entity) == entities.length - 1) {
                                        elementModel.state = ElementState.consumed;
                                    }
                                } else {
                                    elementModel.state = ElementState.consumed;
                                }
                            }
                        })
                    })
                } else {
                    this.getValues(action).forEach((value, index) => {
                        const element = (additionalValues[index] ? additionalValues[index] : value) as Element;
                        gameManager.game.elementBoard.forEach((elementModel) => {
                            if (elementModel.type == element) {
                                if (elementModel.state != ElementState.always) {
                                    elementModel.state = ElementState.new;
                                }
                            }
                        })
                    })
                }
                break;
            case ActionType.spawn:
            case ActionType.summon:
                const monsterSpawns = this.getMonsterSpawnData(action);
                for (let spawn of monsterSpawns) {
                    if (spawn.monster && spawn.monster.type) {
                        const edition = figure instanceof Monster ? figure.edition : (gameManager.game.scenario ? gameManager.game.scenario.edition : gameManager.currentEdition());
                        const monster = gameManager.monsterManager.addMonsterByName(spawn.monster.name, edition);
                        if (monster) {
                            const spawnCount: number = typeof spawn.count == 'string' ? EntityValueFunction(spawn.count.replaceAll('HP', '' + entity.health).replaceAll('H', '' + EntityValueFunction(entity.maxHealth)), entity.level) : spawn.count || 1;
                            const count = Math.min(gameManager.monsterManager.monsterStandeeMax(monster) - gameManager.monsterManager.monsterStandeeCount(monster), spawnCount);
                            for (let i = 0; i < count; i++) {
                                const spawnEntity = gameManager.monsterManager.spawnMonsterEntity(monster, spawn.monster.type, monster.isAlly, monster.isAllied, monster.drawExtra, action.type == ActionType.summon);
                                if (spawnEntity) {
                                    if (spawn.monster.marker) {
                                        spawnEntity.marker = spawn.monster.marker;
                                    }
                                    if (spawn.monster.health) {
                                        let health = spawn.monster.health;
                                        if (typeof health === 'string') {
                                            health = health.replaceAll('H', '' + entity.health);
                                        }

                                        spawnEntity.health = EntityValueFunction(health);

                                        if (spawnEntity.health > spawnEntity.maxHealth) {
                                            spawnEntity.health = spawnEntity.maxHealth;
                                        }
                                    }
                                    if (spawnEntity.marker || spawnEntity.tags.length > 0) {
                                        gameManager.addEntityCount(monster, spawnEntity);
                                    }
                                }
                            }
                        }
                    }
                }
                const objectiveSpawns = this.getObjectiveSpawnData(action);
                for (let spawn of objectiveSpawns) {
                    if (figure instanceof Monster) {
                        const count: number = !spawn.count ? 1 : EntityValueFunction(spawn.count);
                        const objectiveContainer = gameManager.objectiveManager.addObjective(spawn.objective, spawn.objective.name, figure ? gameManager.additionalIdentifier(figure) : undefined);
                        if (count > 1) {
                            for (let i = 0; i < count; i++) {
                                const spawnEntity = gameManager.objectiveManager.addObjectiveEntity(objectiveContainer);
                                if (spawnEntity) {
                                    if (spawn.objective.marker) {
                                        spawnEntity.marker = spawn.objective.marker;
                                    }
                                    if (spawn.objective.health) {
                                        let health = spawn.objective.health;
                                        if (typeof health === 'string') {
                                            health = health.replaceAll('H', '' + entity.health);
                                        }

                                        spawnEntity.health = EntityValueFunction(health);

                                        if (spawnEntity.health > spawnEntity.maxHealth) {
                                            spawnEntity.health = spawnEntity.maxHealth;
                                        }
                                    }
                                    if (spawnEntity.marker || spawnEntity.tags.length > 0) {
                                        gameManager.addEntityCount(objectiveContainer, spawnEntity);
                                    }
                                }
                            }
                        }
                    }
                }
                break;
        }

        entity.tags.push(tag);
    }


    getMonsterSpawnData(action: Action): MonsterSpawnData[] {
        let result: MonsterSpawnData[] = [];

        if (action.type != ActionType.spawn && action.type != ActionType.summon) {
            return result;
        }

        if (action.value == 'monsterStandee') {
            result = (JSON.parse(JSON.stringify(action.valueObject)) as MonsterSpawnData[]).map((value) => value as MonsterSpawnData);
            const charCount = Math.max(2, gameManager.characterManager.characterCount());
            result = result.filter((spawn) => {
                if (spawn.monster.type) {
                    return true;
                } else if (charCount < 3 && spawn.monster.player2) {
                    return true;
                } else if (charCount == 3 && spawn.monster.player3) {
                    return true;
                } else if (charCount > 3 && spawn.monster.player4) {
                    return true;
                }
                return !settingsManager.settings.calculate;
            })

            result.forEach((spawn) => {
                if (!spawn.monster.type) {
                    if (charCount < 3 && spawn.monster.player2) {
                        spawn.monster.type = spawn.monster.player2;
                    } else if (charCount == 3 && spawn.monster.player3) {
                        spawn.monster.type = spawn.monster.player3;
                    } else if (charCount > 3 && spawn.monster.player4) {
                        spawn.monster.type = spawn.monster.player4;
                    }
                }
            })
        }
        return result;
    }

    getObjectiveSpawnData(action: Action): ObjectiveSpawnData[] {
        let result: ObjectiveSpawnData[] = [];

        if (action.type != ActionType.spawn && action.type != ActionType.summon) {
            return result;
        } if (action.value == 'objectiveSpawn') {
            result = (JSON.parse(JSON.stringify(action.valueObject)) as ObjectiveSpawnData[]).map((value) => value as ObjectiveSpawnData);
            result = result.filter((spawn) => !spawn.count || EntityValueFunction(spawn.count) > 0);
        }

        return result;
    }

    getElementsToConsume(action: Action): ElementModel[] {
        let elements: ElementModel[] = [];
        if (action.type == ActionType.element && action.valueType == ActionValueType.minus) {
            const values = this.getValues(action);
            values.forEach((value, index, self) => {
                const elementModel = gameManager.game.elementBoard.find((element) => (element.type == value || value == Element.wild && self.indexOf(element.type) == -1) && (element.state != ElementState.inert && element.state != ElementState.new && element.state != ElementState.consumed) && elements.indexOf(element) == -1);
                if (elementModel) {
                    elements.push(elementModel);
                }
            })
        }
        return elements;
    }
}