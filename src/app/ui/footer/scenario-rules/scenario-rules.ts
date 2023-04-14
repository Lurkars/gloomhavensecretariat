import { Dialog } from "@angular/cdk/dialog";
import { Component } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { MonsterStandeeData, RoomData } from "src/app/game/model/data/RoomData";
import { ScenarioRule, ScenarioFigureRule, MonsterSpawnData } from "src/app/game/model/data/ScenarioRule";
import { Entity, EntityValueFunction } from "src/app/game/model/Entity";
import { Monster } from "src/app/game/model/Monster";
import { MonsterType } from "src/app/game/model/data/MonsterType";
import { Objective } from "src/app/game/model/Objective";
import { Condition } from "src/app/game/model/Condition";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { GameState } from "src/app/game/model/Game";
import { AttackModifier, AttackModifierType } from "src/app/game/model/data/AttackModifier";
import { Figure } from "src/app/game/model/Figure";
import { ScenarioObjectiveIdentifier } from "src/app/game/model/data/ObjectiveData";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { ScenarioSummaryComponent } from "../scenario/summary/scenario-summary";
import { FigureError, FigureErrorType } from "src/app/game/model/data/FigureError";
import { ConditionName } from "src/app/game/model/Condition";

@Component({
    selector: 'ghs-scenario-rules',
    templateUrl: './scenario-rules.html',
    styleUrls: ['./scenario-rules.scss']
})
export class ScenarioRulesComponent {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    EntityValueFunction = EntityValueFunction;

    constructor(private dialog: Dialog) { }

    spawns(rule: ScenarioRule): MonsterSpawnData[] {
        return rule.spawns && rule.spawns.filter((spawn) => this.spawnType(spawn.monster)) || [];
    }

    spawnType(monsterStandeeData: MonsterStandeeData): MonsterType | undefined {
        let type: MonsterType | undefined = monsterStandeeData.type;

        if (!type) {
            const charCount = Math.max(2, gameManager.characterManager.characterCount());
            if (charCount < 3) {
                type = monsterStandeeData.player2;
            } else if (charCount == 3) {
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
            const figureRule = rule.figures.find((figureRule) => figureRule.type == "present" || figureRule.type == "dead");
            if (figureRule) {
                const gameplayEntities: Entity[] = gameManager.scenarioRulesManager.entitiesByFigureRule(figureRule, rule).filter((entity) => gameManager.entityManager.isAlive(entity) && (!(entity instanceof MonsterEntity) || !(figureRule.identifier?.marker) || (entity instanceof MonsterEntity && entity.marker == figureRule.identifier?.marker)));
                const max: number = figureRule.value && figureRule.value.split(':').length > 1 ? EntityValueFunction(figureRule.value.split(':')[1]) : 0;
                F = figureRule.type == "present" ? gameplayEntities.length : Math.max(0, max - gameplayEntities.length);
            }
        }

        while (typeof count == 'string' && count.indexOf('F') != -1) {
            count = count.replace('F', '' + F);
        }

        return EntityValueFunction(count || (spawn.manual ? 0 : 1));
    }

    prevent(event: any) {
        event.preventDefault();
        event.stopPropagation();
    }

    sections(index: number): ScenarioData[] {
        if (gameManager.game.scenarioRules[index]) {
            const scenario = gameManager.scenarioRulesManager.getScenarioForRule(gameManager.game.scenarioRules[index].identifier).scenario;
            if (scenario) {
                const rule = gameManager.game.scenarioRules[index].rule;
                if (rule && rule.sections) {
                    return gameManager.sectionData(scenario.edition).filter((sectionData) => !gameManager.game.sections.find((active) => active.edition == sectionData.edition && active.group == sectionData.group && active.index == sectionData.index) && rule.sections.indexOf(sectionData.index) != -1);
                }
            }
        }
        return [];
    }

    rooms(index: number): RoomData[] {
        let rooms: RoomData[] = [];
        if (gameManager.game.scenarioRules[index]) {
            const scenario = gameManager.scenarioRulesManager.getScenarioForRule(gameManager.game.scenarioRules[index].identifier).scenario;
            if (scenario) {
                const rule = gameManager.game.scenarioRules[index].rule;
                if (rule && rule.rooms) {
                    rule.rooms.forEach((roomNumber) => {
                        const roomData = scenario.rooms.find((roomData) => roomData.roomNumber == roomNumber);
                        if (roomData && gameManager.game.scenario && gameManager.game.scenario.revealedRooms.indexOf(roomNumber) == -1) {
                            rooms.push(roomData);
                        }
                    })
                }
            }
        }
        return rooms;
    }

    figureRules(rule: ScenarioRule): ScenarioFigureRule[] {
        return rule.figures && rule.figures.filter((figureRule) => {
            if (figureRule.type == "present" || figureRule.type == "dead" || figureRule.type == "killed") {
                return false;
            }

            const figures = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
            if (figures.length == 0) {
                return false;
            }

            if (figureRule.type == "gainCondition" || figureRule.type == "permanentCondition" || figureRule.type == "loseCondition") {
                return figures.some((figure) => {
                    if (figureRule.type == "gainCondition") {
                        let entities: Entity[] = gameManager.entityManager.entities(figure);
                        let gainCondition = new Condition(figureRule.value);
                        if (entities.every((entity) => gameManager.entityManager.hasCondition(entity, gainCondition))) {
                            return false
                        }
                    } else if (figureRule.type == "permanentCondition") {
                        let entities: Entity[] = gameManager.entityManager.entities(figure);
                        let gainCondition = new Condition(figureRule.value);
                        if (entities.every((entity) => gameManager.entityManager.hasCondition(entity, gainCondition, true))) {
                            return false
                        }
                    } else if (figureRule.type == "loseCondition") {
                        let entities: Entity[] = gameManager.entityManager.entities(figure);
                        let loseCondition = new Condition(figureRule.value);
                        if (entities.every((entity) => !gameManager.entityManager.hasCondition(entity, loseCondition))) {
                            return false
                        }
                    }
                    return true;
                });
            } else if (figureRule.type == "toggleOn" || figureRule.type == "toggleOff") {
                return figures.some((figure) => figure.off == (figureRule.type == "toggleOn"));
            }

            return true;
        }) || [];
    }

    figureNames(figureRule: ScenarioFigureRule, scenarioRule: ScenarioRule): string {
        if (figureRule.identifier) {
            if (figureRule.identifier.type == "all") {
                return settingsManager.getLabel('scenario.rules.figures.all');
            }
            return gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, scenarioRule).filter((figure) => {
                if (figureRule.type == "gainCondition") {
                    let entities: Entity[] = gameManager.entityManager.entities(figure);
                    let gainCondition = new Condition(figureRule.value);
                    if (entities.every((entity) => gameManager.entityManager.hasCondition(entity, gainCondition))) {
                        return false
                    }
                } else if (figureRule.type == "permanentCondition") {
                    let entities: Entity[] = gameManager.entityManager.entities(figure);
                    let gainCondition = new Condition(figureRule.value);
                    if (entities.every((entity) => gameManager.entityManager.hasCondition(entity, gainCondition, true))) {
                        return false
                    }
                } else if (figureRule.type == "loseCondition") {
                    let entities: Entity[] = gameManager.entityManager.entities(figure);
                    let loseCondition = new Condition(figureRule.value);
                    if (entities.every((entity) => !gameManager.entityManager.hasCondition(entity, loseCondition))) {
                        return false
                    }
                } else if (figureRule.type == "toggleOn" || figureRule.type == "toggleOff") {
                    return figure.off == (figureRule.type == "toggleOn");
                }

                return true;
            }).map((figure) => {
                if (figure instanceof Character) {
                    return figure.title || settingsManager.getLabel('data.character.' + figure.name);
                }
                if (figure instanceof Objective) {
                    return (figure.title || settingsManager.getLabel('data.objective.' + figure.name)) + ' %game.objectiveMarker.' + (figure.id + 1) + '%' + (figure.marker ? ' %game.mapMarker.' + figure.marker + '%' : '');
                }
                if (figure instanceof Monster) {
                    return settingsManager.getLabel('data.monster.' + figure.name);
                }

                return figure.name;
            }).join(', ');
        }
        return "";
    }

    visible(index: number): boolean {
        if (gameManager.game.scenarioRules[index]) {
            const rule = gameManager.game.scenarioRules[index].rule;
            if (this.spawns(rule).length > 0 || rule.objectiveSpawns && rule.objectiveSpawns.length > 0 || rule.elements && rule.elements.length > 0 || this.sections(index).length > 0 || this.rooms(index).length > 0 || this.figureRules(rule).length > 0 || rule.note || rule.finish) {
                return true;
            }
        }
        return false;
    }

    apply(rule: ScenarioRule) {
        return this.spawns(rule).length > 0 || rule.objectiveSpawns && rule.objectiveSpawns.length > 0 || rule.elements && rule.elements.length > 0 || rule.finish || settingsManager.settings.scenarioRooms && rule.rooms && rule.rooms.length > 0 || rule.sections && rule.sections.length > 0 || rule.figures && rule.figures.length > 0 && rule.figures.some((figureRule) => figureRule.type != "present" && figureRule.type != "dead" && figureRule.type != "killed");
    }

    applyRule(element: HTMLElement, index: number) {
        gameManager.stateManager.before("applyScenarioRule");
        if (gameManager.game.scenarioRules[index]) {
            const scenario = gameManager.scenarioRulesManager.getScenarioForRule(gameManager.game.scenarioRules[index].identifier).scenario;
            const section = gameManager.scenarioRulesManager.getScenarioForRule(gameManager.game.scenarioRules[index].identifier).section;
            if (scenario) {
                const rule = gameManager.game.scenarioRules[index].rule;

                if (rule.figures) {
                    rule.figures.filter((figureRule) => figureRule.type == "remove").forEach((figureRule) => {
                        const figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
                        figures.forEach((figure) => {
                            if (figure instanceof Objective) {
                                gameManager.characterManager.removeObjective(figure);
                            } else if (figure instanceof Monster) {
                                gameManager.monsterManager.removeMonster(figure);
                            }
                        })
                    })
                }

                if (rule.spawns) {
                    let checkActive: string[] = [];
                    rule.spawns.forEach((spawn) => {
                        const type = this.spawnType(spawn.monster);

                        if (type && scenario) {
                            const monster = gameManager.monsterManager.addMonsterByName(spawn.monster.name, scenario.edition);
                            if (monster) {
                                for (let i = 0; i < this.spawnCount(rule, spawn); i++) {
                                    let entity = gameManager.monsterManager.spawnMonsterEntity(monster, type, scenario.allies && scenario.allies.indexOf(spawn.monster.name) != -1, scenario.drawExtra && scenario.drawExtra.indexOf(spawn.monster.name) != -1, spawn.summon);
                                    if (entity) {
                                        if (spawn.monster.marker) {
                                            entity.marker = spawn.monster.marker;
                                        }
                                        if (spawn.monster.tags) {
                                            entity.tags = spawn.monster.tags;
                                        }
                                        checkActive.push(spawn.monster.name);
                                        if (entity.marker || entity.tags.length > 0) {
                                            gameManager.addEntityCount(monster, entity);
                                        }
                                    }
                                }
                            }
                        }
                    })


                    if (gameManager.game.state == GameState.next) {
                        gameManager.game.figures.forEach((figure) => {
                            if (figure instanceof Monster && checkActive.indexOf(figure.name) && figure.edition == scenario.edition) {
                                figure.active = !gameManager.game.figures.some((figure) => figure.active);
                            }
                        })
                    }
                }

                if (rule.objectiveSpawns) {
                    rule.objectiveSpawns.forEach((spawn) => {
                        const objectiveIdentifier: ScenarioObjectiveIdentifier = { "edition": scenario.edition, "scenario": scenario.index, "group": scenario.group, "section": section, "index": spawn.objective.index - 1 };
                        const objectiveData = gameManager.objectiveDataByScenarioObjectiveIdentifier(objectiveIdentifier);
                        if (objectiveData && spawn.count != 0) {
                            for (let i = 0; i < EntityValueFunction(spawn.count || 1); i++) {
                                let objective = gameManager.characterManager.addObjective(objectiveData, objectiveData.name, objectiveIdentifier);
                                if (objective) {
                                    if (spawn.objective.marker) {
                                        objective.marker = spawn.objective.marker;
                                    }
                                    if (spawn.objective.tags) {
                                        objective.tags = spawn.objective.tags;
                                    }
                                    if (objective.marker || objective.tags.length > 0) {
                                        gameManager.addEntityCount(objective);
                                    }
                                }
                            }
                        }
                    })
                }

                if (rule.elements) {
                    rule.elements.forEach((ruleElement) => {
                        gameManager.game.elementBoard.forEach((element) => {
                            if (ruleElement && element.type == ruleElement.type) {
                                element.state = ruleElement.state;
                            }
                        })
                    })
                }

                if (rule.rooms) {
                    this.rooms(index).forEach((roomData) => {
                        gameManager.scenarioManager.openRoom(roomData, scenario, gameManager.game.scenarioRules[index].identifier.section);
                    })
                }

                if (rule.sections) {
                    this.sections(index).forEach((sectionData) => {
                        if (sectionData.conclusion) {
                            this.dialog.open(ScenarioSummaryComponent, {
                                panelClass: 'dialog',
                                data: {
                                    scenario: gameManager.game.scenario,
                                    success: true,
                                    conclusion: sectionData
                                }
                            })
                        } else {
                            gameManager.scenarioManager.addSection(sectionData);
                        }
                    })
                }

                if (rule.figures) {
                    rule.figures.filter((figureRule) => figureRule.type == "gainCondition" || figureRule.type == "permanentCondition" || figureRule.type == "loseCondition" || figureRule.type == "damage" || figureRule.type == "heal" || figureRule.type == "setHp").forEach((figureRule) => {
                        let figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
                        figures.forEach((figure) => {
                            let entities: Entity[] = gameManager.entityManager.entities(figure).filter((entity) => figureRule.identifier && (!figureRule.identifier.marker || !(entity instanceof MonsterEntity) || entity.marker == figureRule.identifier.marker) && (!figureRule.identifier.tags || figureRule.identifier.tags.length == 0 || figureRule.identifier.tags.every((tag) => entity.tags.indexOf(tag) != -1)));
                            entities.forEach((entity) => {
                                switch (figureRule.type) {
                                    case "gainCondition":
                                        let gainCondition = new Condition(figureRule.value);
                                        if (!gameManager.entityManager.hasCondition(entity, gainCondition)) {
                                            gameManager.entityManager.addCondition(entity, gainCondition, figure.active, figure.off);
                                        }
                                        break;
                                    case "permanentCondition":
                                        let permanentCondition = new Condition(figureRule.value);
                                        if (!gameManager.entityManager.hasCondition(entity, permanentCondition, true)) {
                                            gameManager.entityManager.addCondition(entity, permanentCondition, figure.active, figure.off, true);
                                        }
                                        break;
                                    case "loseCondition":
                                        let loseCondition = new Condition(figureRule.value);
                                        if (gameManager.entityManager.hasCondition(entity, loseCondition)) {
                                            gameManager.entityManager.removeCondition(entity, loseCondition);
                                        }
                                        break;
                                    case "damage": let damage = 0;
                                        if (isNaN(+figureRule.value) && figureRule.value.indexOf('H') != -1) {
                                            damage = +EntityValueFunction(figureRule.value.replaceAll('HP', '' + entity.health).replaceAll('H', '' + EntityValueFunction(entity.maxHealth)));
                                        } else {
                                            damage = +EntityValueFunction(figureRule.value);
                                        }
                                        if (damage < 0) {
                                            damage = 0;
                                        } else if (damage > EntityValueFunction(entity.maxHealth)) {
                                            damage = EntityValueFunction(entity.maxHealth);
                                        }
                                        gameManager.entityManager.changeHealth(entity, -damage);
                                        break;
                                    case "heal":
                                        let heal = 0;
                                        if (isNaN(+figureRule.value) && figureRule.value.indexOf('H') != -1) {
                                            heal = +EntityValueFunction(figureRule.value.replaceAll('HP', '' + entity.health).replaceAll('H', '' + EntityValueFunction(entity.maxHealth)));
                                        } else {
                                            heal = +EntityValueFunction(figureRule.value);
                                        }
                                        if (heal < 0) {
                                            heal = 0;
                                        }

                                        entity.health += heal;
                                        gameManager.entityManager.addCondition(entity, new Condition(ConditionName.heal, heal), figure.active, figure.off);
                                        gameManager.entityManager.applyCondition(entity, ConditionName.heal);
                                        break;
                                    case "setHp":
                                        let hp = 0;
                                        if (isNaN(+figureRule.value) && figureRule.value.indexOf('H') != -1) {
                                            hp = +EntityValueFunction(figureRule.value.replaceAll('HP', '' + entity.health).replaceAll('H', '' + EntityValueFunction(entity.maxHealth)));
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
                                }
                            })
                        })
                    })

                    rule.figures.filter((figureRule) => figureRule.type == "toggleOff" || figureRule.type == "toggleOn").forEach((figureRule) => {
                        const figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
                        figures.forEach((figure) => {
                            figure.off = figureRule.type == "toggleOff";
                        })
                    })

                    rule.figures.filter((figureRule) => figureRule.type == "transfer").forEach((figureRule) => {
                        const figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
                        if (figures.length == 1 && figures[0] instanceof Monster) {
                            const figure = figures[0];
                            const monster = gameManager.monsterManager.addMonsterByName(figureRule.value, scenario.edition);
                            if (monster) {
                                if (figureRule.value.indexOf(':') == -1) {
                                    monster.level = figure.level;
                                }
                                monster.off = figure.off;
                                monster.active = figure.active;
                                monster.drawExtra = figure.drawExtra;
                                monster.lastDraw = figure.lastDraw;

                                monster.ability = figure.ability;
                                monster.isAlly = figure.isAlly;
                                monster.isConfederated = figure.isConfederated;
                                monster.entities = figure.entities;

                                monster.entities.forEach((entity) => {
                                    const figureStat = figure.stats.find((stat) => {
                                        return stat.level == figure.level && stat.type == entity.type;
                                    });
                                    const stat = monster.stats.find((stat) => {
                                        return stat.level == monster.level && stat.type == entity.type;
                                    });

                                    if (!stat) {
                                        monster.errors = monster.errors || [];
                                        if (!monster.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !monster.errors.find((figureError) => figureError.type == FigureErrorType.stat)) {
                                            console.error("Could not find '" + entity.type + "' stats for monster: " + monster.name + " level: " + monster.level);
                                            monster.errors.push(new FigureError(FigureErrorType.stat, "monster", monster.name, monster.edition, entity.type, "" + monster.level));
                                        }
                                    } else {
                                        entity.stat = stat;
                                        if (figureStat && entity.maxHealth == EntityValueFunction(figureStat.health)) {
                                            entity.maxHealth = EntityValueFunction(stat.health);
                                        }

                                    }

                                    if (entity.health > entity.maxHealth || entity.maxHealth == 0 && entity.health > 0) {
                                        entity.health = entity.maxHealth;
                                    }
                                })

                                if (monster != figure) {
                                    gameManager.monsterManager.removeMonster(figure);
                                }
                                gameManager.sortFigures();
                            }
                        } else if (figures.length == 1 && figures[0] instanceof Objective) {
                            const figure = figures[0];
                            const objectiveIdentifier: ScenarioObjectiveIdentifier = { "edition": scenario.edition, "scenario": scenario.index, "group": scenario.group, "section": section, "index": (+figureRule.value) - 1 };
                            const objective = gameManager.characterManager.addObjective(scenario.objectives[(+figureRule.value) - 1], undefined, objectiveIdentifier);
                            objective.id = figure.id;
                            objective.marker = figure.marker;
                            objective.title = figure.title;
                            objective.exhausted = figure.exhausted;
                            objective.off = figure.off;
                            objective.active = figure.active;
                            objective.health = figure.health;
                            if (objective.health > EntityValueFunction(objective.maxHealth)) {
                                objective.health = EntityValueFunction(objective.maxHealth);
                            }
                            objective.entityConditions = figure.entityConditions;
                            gameManager.characterManager.removeObjective(figure);
                        }
                    })

                    rule.figures.filter((figureRule) => figureRule.type == "amAdd" || figureRule.type == "amRemove").forEach((figureRule) => {
                        const figures: Figure[] = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
                        figures.forEach((figure) => {
                            const deck = gameManager.attackModifierManager.byFigure(figure);
                            const type: AttackModifierType = figureRule.value.split(':')[0] as AttackModifierType;
                            let value = +(figureRule.value.split(':')[1]);
                            if (figureRule.type == "amAdd") {
                                for (let i = 0; i < value; i++) {
                                    gameManager.attackModifierManager.addModifier(deck, new AttackModifier(type));
                                }
                            } else {
                                let card = deck.cards.find((attackModifier, index) => {
                                    return attackModifier.type == type && index > deck.current;
                                });
                                while (card && value > 0) {
                                    deck.cards.splice(deck.cards.indexOf(card), 1);
                                    card = deck.cards.find((attackModifier, index) => {
                                        return attackModifier.type == type && index > deck.current;
                                    });
                                    value--;
                                }
                                if (value > 0) {
                                    let card = deck.cards.find((attackModifier) => {
                                        return attackModifier.type == type;
                                    });
                                    while (card && value < 0) {
                                        deck.cards.splice(deck.cards.indexOf(card), 1);
                                        card = deck.cards.find((attackModifier) => {
                                            return attackModifier.type == type;
                                        });
                                        value--;
                                    }
                                }
                            }

                        })
                    })

                }

                if (rule.finish) {
                    this.dialog.open(ScenarioSummaryComponent, {
                        panelClass: 'dialog',
                        data: { scenario: scenario, success: rule.finish == "won" }
                    })
                }
            }
        }

        element.classList.add('closed');
        setTimeout(() => {
            const ruleModel = gameManager.game.scenarioRules.splice(index, 1)[0];
            if (ruleModel.rule.once) {
                gameManager.game.disgardedScenarioRules.push(ruleModel.identifier);
            }
            gameManager.stateManager.after();
        }, settingsManager.settings.disableAnimations ? 0 : 100)
    }


    hideRule(element: HTMLElement, index: number) {
        element.classList.add('closed');
        setTimeout(() => {
            gameManager.stateManager.before("hideScenarioRule");
            const ruleModel = gameManager.game.scenarioRules.splice(index, 1)[0];
            gameManager.game.disgardedScenarioRules.push(ruleModel.identifier);
            gameManager.stateManager.after();
        }, settingsManager.settings.disableAnimations ? 0 : 100)
    }

    close(element: HTMLElement, index: number) {
        element.classList.add('closed');
        setTimeout(() => {
            gameManager.stateManager.before("removeScenarioRule");
            const ruleModel = gameManager.game.scenarioRules.splice(index, 1)[0];
            if (ruleModel.rule.once) {
                gameManager.game.disgardedScenarioRules.push(ruleModel.identifier);
            }
            gameManager.stateManager.after();
        }, settingsManager.settings.disableAnimations ? 0 : 100)
    }
}
