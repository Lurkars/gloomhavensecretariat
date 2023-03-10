import { Dialog } from "@angular/cdk/dialog";
import { Component } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { MonsterStandeeData, RoomData } from "src/app/game/model/data/RoomData";
import { ScenarioRule, ScenarioFigureRule, MonsterSpawnData } from "src/app/game/model/data/ScenarioRule";
import { Entity, EntityValueFunction } from "src/app/game/model/Entity";
import { Monster } from "src/app/game/model/Monster";
import { MonsterType } from "src/app/game/model/MonsterType";
import { Objective } from "src/app/game/model/Objective";
import { Condition } from "src/app/game/model/Condition";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { GameState } from "src/app/game/model/Game";
import { AttackModifier, AttackModifierType } from "src/app/game/model/AttackModifier";
import { Figure } from "src/app/game/model/Figure";
import { ScenarioObjectiveIdentifier } from "src/app/game/model/data/ObjectiveData";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { ScenarioSummaryComponent } from "../scenario/summary/scenario-summary";

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
                const gameplayFigures: Figure[] = gameManager.figuresByIdentifier(figureRule.identifier, figureRule.scenarioEffect).filter((figure) => gameManager.gameplayFigure(figure) && (!(figure instanceof Monster) || !(figureRule.identifier?.marker) || (figure instanceof Monster && figure.entities.some((entity) => entity.marker == figureRule.identifier?.marker && !entity.dead && entity.health >= 1))));
                const max: number = figureRule.value && figureRule.value.split(':').length > 1 ? EntityValueFunction(figureRule.value.split(':')[1]) : 0;
                F = figureRule.type == "present" ? gameplayFigures.length : Math.max(0, max - gameplayFigures.length);
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
            const scenario = gameManager.scenarioManager.getScenarioForRule(gameManager.game.scenarioRules[index].identifier).scenario;
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
            const scenario = gameManager.scenarioManager.getScenarioForRule(gameManager.game.scenarioRules[index].identifier).scenario;
            if (scenario) {
                const rule = gameManager.game.scenarioRules[index].rule;
                if (rule && rule.rooms) {
                    rule.rooms.forEach((roomNumber) => {
                        const roomData = scenario.rooms.find((roomData) => roomData.roomNumber == roomNumber);
                        if (roomData) {
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
            if (figureRule.type == "present" || figureRule.type == "dead") {
                return false;
            }

            const figures = gameManager.figuresByIdentifier(figureRule.identifier, figureRule.scenarioEffect);
            if (figures.length == 0) {
                return false;
            }

            if (figureRule.type == "gainCondition" || figureRule.type == "looseCondition") {
                let add: boolean = true;
                figures.forEach((figure) => {
                    if (figureRule.type == "gainCondition") {
                        let entities: Entity[] = gameManager.entityManager.entities(figure);
                        let gainCondition = new Condition(figureRule.value);
                        if (entities.every((entity) => gameManager.entityManager.hasCondition(entity, gainCondition))) {
                            add = false;
                        }
                    } else if (figureRule.type == "looseCondition") {
                        let entities: Entity[] = gameManager.entityManager.entities(figure);
                        let looseCondition = new Condition(figureRule.value);
                        if (entities.every((entity) => !gameManager.entityManager.hasCondition(entity, looseCondition))) {
                            add = false;
                        }
                    }
                })
                return add;
            } else if (figureRule.type == "toggleOn" || figureRule.type == "toggleOff") {
                return figures.every((figure) => figure.off == (figureRule.type == "toggleOn"));
            }

            return true;
        }) || [];
    }

    figureNames(figureRule: ScenarioFigureRule): string {
        if (figureRule.identifier) {
            if (figureRule.identifier.type == "all") {
                return settingsManager.getLabel('scenario.rules.figures.all');
            }
            return gameManager.figuresByIdentifier(figureRule.identifier, figureRule.scenarioEffect).map((figure) => {
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
            if (this.spawns(rule).length > 0 || rule.elements && rule.elements.length > 0 || this.sections(index).length > 0 || this.rooms(index).length > 0 || this.figureRules(rule).length > 0 || rule.note || rule.finish) {
                return true;
            }
        }
        return false;
    }

    apply(rule: ScenarioRule) {
        return rule.spawns && gameManager.game.scenario || rule.elements && rule.elements.length > 0 || rule.finish || settingsManager.settings.scenarioRooms && rule.rooms && rule.rooms.length > 0 || rule.sections && rule.sections.length > 0 || rule.figures && rule.figures.length > 0 && rule.figures.some((figureRule) => figureRule.type != "present" && figureRule.type != "dead");
    }

    applyRule(element: HTMLElement, index: number) {
        gameManager.stateManager.before("applyScenarioRule");
        if (gameManager.game.scenarioRules[index]) {
            const scenario = gameManager.scenarioManager.getScenarioForRule(gameManager.game.scenarioRules[index].identifier).scenario;
            const section = gameManager.scenarioManager.getScenarioForRule(gameManager.game.scenarioRules[index].identifier).section;
            if (scenario) {
                const rule = gameManager.game.scenarioRules[index].rule;
                if (rule.spawns) {
                    let checkActive: string[] = [];
                    rule.spawns.forEach((spawn) => {
                        const type = this.spawnType(spawn.monster);

                        if (type && gameManager.game.scenario) {
                            for (let i = 0; i < this.spawnCount(rule, spawn); i++) {
                                let entity = gameManager.monsterManager.spawnMonsterEntity(spawn.monster.name, type, scenario.edition, scenario.allies && scenario.allies.indexOf(spawn.monster.name) != -1, scenario.drawExtra && scenario.drawExtra.indexOf(spawn.monster.name) != -1, spawn.summon);
                                if (entity) {
                                    if (spawn.monster.marker) {
                                        entity.marker = spawn.monster.marker;
                                    }
                                    if (spawn.monster.tags) {
                                        entity.tags = spawn.monster.tags;
                                    }
                                    checkActive.push(spawn.monster.name);
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
                        gameManager.scenarioManager.addSection(sectionData);
                    })
                }

                if (rule.figures) {
                    rule.figures.filter((figureRule) => figureRule.type == "gainCondition" || figureRule.type == "looseCondition" || figureRule.type == "damage" || figureRule.type == "hp").forEach((figureRule) => {
                        let figures = gameManager.figuresByIdentifier(figureRule.identifier, figureRule.scenarioEffect);
                        figures.forEach((figure) => {
                            let entities: Entity[] = gameManager.entityManager.entities(figure).filter((entity) => (!figureRule.identifier?.marker || !(entity instanceof MonsterEntity) || entity.marker == figureRule.identifier.marker) && (!figureRule.identifier?.tag || entity.tags.indexOf(figureRule.identifier.tag) != -1));
                            entities.forEach((entity) => {
                                switch (figureRule.type) {
                                    case "gainCondition":
                                        let gainCondition = new Condition(figureRule.value);
                                        if (!gameManager.entityManager.hasCondition(entity, gainCondition)) {
                                            gameManager.entityManager.toggleCondition(entity, gainCondition, figure.active, figure.off);
                                        }
                                        break;
                                    case "looseCondition":
                                        let looseCondition = new Condition(figureRule.value);
                                        if (gameManager.entityManager.hasCondition(entity, looseCondition)) {
                                            gameManager.entityManager.toggleCondition(entity, looseCondition, figure.active, figure.off);
                                        }
                                        break;
                                    case "damage": let damage = 0;
                                        if (isNaN(+figureRule.value) && figureRule.value.indexOf('H') != -1) {
                                            damage = +EntityValueFunction(figureRule.value.replaceAll('HP', '' + EntityValueFunction(entity.maxHealth)).replaceAll('H', '' + entity.health));
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
                                    case "hp":
                                        let hp = 0;
                                        if (isNaN(+figureRule.value) && figureRule.value.indexOf('H') != -1) {
                                            hp = +EntityValueFunction(figureRule.value.replaceAll('HP', '' + EntityValueFunction(entity.maxHealth)).replaceAll('H', '' + entity.health));
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
                        const figures = gameManager.figuresByIdentifier(figureRule.identifier, figureRule.scenarioEffect);
                        figures.forEach((figure) => {
                            figure.off = figureRule.type == "toggleOff";
                        })
                    })

                    rule.figures.filter((figureRule) => figureRule.type == "transfer").forEach((figureRule) => {
                        const figures = gameManager.figuresByIdentifier(figureRule.identifier, figureRule.scenarioEffect);
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
                                monster.entities = figure.entities;
                                monster.entities.forEach((entity) => {
                                    if (entity.health > EntityValueFunction(entity.maxHealth)) {
                                        entity.health = EntityValueFunction(entity.maxHealth);
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


                    rule.figures.filter((figureRule) => figureRule.type == "remove").forEach((figureRule) => {
                        const figures = gameManager.figuresByIdentifier(figureRule.identifier, figureRule.scenarioEffect);
                        figures.forEach((figure) => {
                            if (figure instanceof Objective) {
                                gameManager.characterManager.removeObjective(figure);
                            } else if (figure instanceof Monster) {
                                gameManager.monsterManager.removeMonster(figure);
                            }
                        })
                    })

                    rule.figures.filter((figureRule) => figureRule.type == "amAdd" || figureRule.type == "amRemove").forEach((figureRule) => {
                        const figures = gameManager.figuresByIdentifier(figureRule.identifier, figureRule.scenarioEffect);
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
